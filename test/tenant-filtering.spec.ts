import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseTodoRepository } from '../src/todos/infrastructure/mongoose-todo.repository';
import { TodoMongo, TodoSchema, TodoDocument } from '../src/todos/infrastructure/todo.schema';
import { Model } from 'mongoose';

describe('Tenant Filtering (Integration)', () => {
  jest.setTimeout(120000); // Allow time for mongodb-memory-server to download binaries

  let mongoServer: MongoMemoryServer;
  let repository: MongooseTodoRepository;
  let todoModel: Model<TodoDocument>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: TodoMongo.name, schema: TodoSchema }])
      ],
      providers: [MongooseTodoRepository],
    }).compile();

    repository = moduleFixture.get<MongooseTodoRepository>(MongooseTodoRepository);
    todoModel = moduleFixture.get<Model<TodoDocument>>(getModelToken(TodoMongo.name));
  });

  afterAll(async () => {
    if (todoModel) {
      await todoModel.deleteMany({});
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('verifies that tenant B cannot see a todo created for tenant A', async () => {
    const userId = 'user-123';
    
    // Create Todo for Tenant A
    await repository.create({
      title: 'Task for Tenant A',
      userId,
      tenantId: 'tenant-A',
    });

    // Tenant A queries for todos
    const resultTenantA = await repository.findAll(0, 10, userId, undefined, undefined, undefined, 'tenant-A');
    expect(resultTenantA.data).toHaveLength(1);
    expect(resultTenantA.data[0].title).toBe('Task for Tenant A');
    expect(resultTenantA.data[0].tenantId).toBe('tenant-A');

    // Tenant B queries for todos (same user, different tenant)
    const resultTenantB = await repository.findAll(0, 10, userId, undefined, undefined, undefined, 'tenant-B');
    expect(resultTenantB.data).toHaveLength(0); // Should be completely isolated
  });
});
