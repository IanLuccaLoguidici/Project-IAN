import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module'; // Adjust if your main module is named differently
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Auth & Todo Full Flow (e2e)', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let jwtToken: string;
  let createdTodoId: string;

  // 1. Setup Phase: Use a Test Database
  beforeAll(async () => {
    // Override environment variables to use a test database for this suite
    // In a real scenario, you can also use tools like mongodb-memory-server here
    process.env.MONGO_URI = 'mongodb://localhost:27017/projectian_test_db';
    process.env.JWT_SECRET = 'test_secret_for_e2e';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Ensure validation pipes are active during tests just like in production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();

    // Store the database connection to clean it up later
    dbConnection = app.get<Connection>(getConnectionToken());
  });

  // 2. Teardown Phase: Clean up database and close app
  afterAll(async () => {
    // Drop the test database to ensure a clean slate for the next run
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
    if (app) {
      await app.close();
    }
  });

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  const testTodo = {
    title: 'E2E Test Todo',
  };

  describe('Authentication Flow', () => {
    it('1. should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      // Ensure password is not returned
      expect(response.body).not.toHaveProperty('password'); 
    });

    it('2. should login the registered user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      jwtToken = response.body.access_token; // Save token for subsequent requests
    });
  });

  describe('Todo CRUD Flow', () => {
    it('3. should create a todo linked to the user', async () => {
      const response = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testTodo)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testTodo.title);
      
      createdTodoId = response.body.id; // Save ID for updates and deletes
    });

    it('4. should get all user todos', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const ourTodo = response.body.data.find(t => t.id === createdTodoId);
      expect(ourTodo).toBeDefined();
      expect(ourTodo.title).toBe(testTodo.title);
    });

    it('5. should update the created todo', async () => {
      const updateData = {
        title: 'Updated E2E Test Todo',
        done: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.done).toBe(true);
    });

    it('6. should delete the created todo', async () => {
      await request(app.getHttpServer())
        .delete(`/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200); // Or 204 depending on your implementation

      // Verify deletion by trying to fetch it again (should fail)
      await request(app.getHttpServer())
        .get(`/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });
});
