import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(email: string, passwordHash: string, name?: string): Promise<User> {
    const newUser = new this.userModel({ email, passwordHash, name });
    return newUser.save();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOrCreateOAuthUser(email: string, name?: string): Promise<User> {
    let user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      user = new this.userModel({ email, name });
      await user.save();
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(userId: string, targetTokenHash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: targetTokenHash }).exec();
  }

  async addApiKey(userId: string, keyHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $push: { apiKeys: keyHash } }).exec();
  }

  async findByApiKey(keyHash: string): Promise<User | null> {
    return this.userModel.findOne({ apiKeys: keyHash }).exec();
  }
}
