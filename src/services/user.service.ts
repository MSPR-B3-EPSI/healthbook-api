import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository.js';
import { User, Prisma } from '../generated/prisma/client.js';

@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  getUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.userRepo.findUnique(where);
  }

  getUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    return this.userRepo.findMany(params);
  }

  createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepo.create(data);
  }

  updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    return this.userRepo.update(params);
  }

  deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.userRepo.delete(where);
  }
}
