import { Injectable } from '@nestjs/common';
import { DataSource, Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } as FindOptionsWhere<User> });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByEmailWithOtp(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.otpCode')
      .addSelect('user.otpExpiry')
      .where('user.email = :email', { email })
      .getOne();
  }

  async createUser(data: DeepPartial<User>): Promise<User> {
    const user = this.create(data);
    return this.save(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.update(id, data);
  }
}
