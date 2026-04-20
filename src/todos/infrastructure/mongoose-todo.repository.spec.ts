import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MongooseTodoRepository } from './mongoose-todo.repository';
import { TodoMongo } from './todo.schema';

describe('MongooseTodoRepository', () => {
  let repository: MongooseTodoRepository;
  let mockTodoModel: any;

  beforeEach(async () => {
    mockTodoModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongooseTodoRepository,
        {
          provide: getModelToken(TodoMongo.name),
          useValue: mockTodoModel,
        },
      ],
    }).compile();

    repository = module.get<MongooseTodoRepository>(MongooseTodoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should build a basic filter with userId and without deletedAt', async () => {
      const mockExecFind = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExecFind });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      mockTodoModel.find.mockReturnValue({ skip: mockSkip });

      const mockExecCount = jest.fn().mockResolvedValue(0);
      mockTodoModel.countDocuments.mockReturnValue({ exec: mockExecCount });

      await repository.findAll(0, 10, 'user-1');

      expect(mockTodoModel.find).toHaveBeenCalledWith({ userId: 'user-1', deletedAt: null });
      expect(mockTodoModel.countDocuments).toHaveBeenCalledWith({ userId: 'user-1', deletedAt: null });
    });

    it('should apply search, done, and filterUserId filters', async () => {
      const mockExecFind = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExecFind });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      mockTodoModel.find.mockReturnValue({ skip: mockSkip });

      const mockExecCount = jest.fn().mockResolvedValue(0);
      mockTodoModel.countDocuments.mockReturnValue({ exec: mockExecCount });

      await repository.findAll(0, 10, 'user-1', 'compra', true, 'admin-user-id');

      const expectedFilter = {
        deletedAt: null,
        userId: 'admin-user-id',
        $text: { $search: 'compra' },
        done: true,
      };

      expect(mockTodoModel.find).toHaveBeenCalledWith(expectedFilter);
      expect(mockTodoModel.countDocuments).toHaveBeenCalledWith(expectedFilter);
    });
  });

  describe('delete', () => {
    it('should soft delete a todo', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: 'id1', title: 'Test' });
      mockTodoModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await repository.delete('id1', 'user-1');

      expect(result).toBe(true);
      expect(mockTodoModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'id1', userId: 'user-1', deletedAt: null },
        expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
        { new: true }
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted todo', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: 'id1', title: 'Test' });
      mockTodoModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await repository.restore('id1', 'user-1');

      expect(result).toBe(true);
      expect(mockTodoModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'id1', userId: 'user-1', deletedAt: { $ne: null } },
        { $set: { deletedAt: null } },
        { new: true }
      );
    });
  });

  describe('purge', () => {
    it('should permanently delete a todo', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: 'id1' });
      mockTodoModel.findOneAndDelete.mockReturnValue({ exec: mockExec });

      const result = await repository.purge('id1', 'user-1');

      expect(result).toBe(true);
      expect(mockTodoModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'id1', userId: 'user-1' });
    });
  });
});
