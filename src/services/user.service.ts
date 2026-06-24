import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { UserModel } from '../generated/prisma/models.js';
import { UpdateUserDto } from '../dto/user/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly storage: StorageService,
  ) {}

  async getOne(keycloakId: string): Promise<UserModel> {
    const user = await this.userRepo.findByKeycloakId(keycloakId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  update(keycloakId: string, dto: UpdateUserDto): Promise<UserModel> {
    return this.userRepo.update(keycloakId, { displayName: dto.displayName });
  }

  /** Uploads (or replaces) the profile picture, returning the updated user. */
  async setPicture(
    keycloakId: string,
    file: Express.Multer.File,
  ): Promise<UserModel> {
    const user = await this.getOne(keycloakId);
    const key = await this.storage.put(file, 'users');
    const updated = await this.userRepo.update(keycloakId, {
      profileMediaKey: key,
    });
    if (user.profileMediaKey) await this.storage.delete(user.profileMediaKey);
    return updated;
  }

  /** Removes the profile picture (object + reference). */
  async clearPicture(keycloakId: string): Promise<UserModel> {
    const user = await this.getOne(keycloakId);
    if (!user.profileMediaKey) return user;
    const updated = await this.userRepo.update(keycloakId, {
      profileMediaKey: null,
    });
    await this.storage.delete(user.profileMediaKey);
    return updated;
  }
}
