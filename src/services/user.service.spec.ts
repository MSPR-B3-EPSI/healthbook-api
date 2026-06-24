import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { UserModel } from '../generated/prisma/models.js';

function makeUser(overrides: Partial<UserModel> = {}): UserModel {
  return {
    keycloakId: 'kc-1',
    email: 'a@b.c',
    username: 'tester',
    displayName: null,
    profileMediaKey: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as UserModel;
}

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    repo = {
      findByKeycloakId: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    storage = {
      put: jest.fn(),
      delete: jest.fn(),
      presign: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new UserService(repo, storage);
  });

  describe('getOne', () => {
    it('retourne l’utilisateur trouvé', async () => {
      const user = makeUser();
      repo.findByKeycloakId.mockResolvedValue(user);

      await expect(service.getOne('kc-1')).resolves.toBe(user);
    });

    it('lève NotFoundException si absent', async () => {
      repo.findByKeycloakId.mockResolvedValue(null);

      await expect(service.getOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met à jour le displayName', async () => {
      const updated = makeUser({ displayName: 'Bob' });
      repo.update.mockResolvedValue(updated);

      const result = await service.update('kc-1', { displayName: 'Bob' });

      expect(repo.update).toHaveBeenCalledWith('kc-1', { displayName: 'Bob' });
      expect(result).toBe(updated);
    });
  });

  describe('setPicture', () => {
    const file = { buffer: Buffer.from('x'), originalname: 'a.png' } as never;

    it('téléverse sous le préfixe users et enregistre la clé', async () => {
      repo.findByKeycloakId.mockResolvedValue(
        makeUser({ profileMediaKey: null }),
      );
      storage.put.mockResolvedValue('users/new.png');
      repo.update.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/new.png' }),
      );

      await service.setPicture('kc-1', file);

      expect(storage.put).toHaveBeenCalledWith(file, 'users');
      expect(repo.update).toHaveBeenCalledWith('kc-1', {
        profileMediaKey: 'users/new.png',
      });
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('supprime l’ancienne image lors d’un remplacement', async () => {
      repo.findByKeycloakId.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/old.png' }),
      );
      storage.put.mockResolvedValue('users/new.png');
      repo.update.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/new.png' }),
      );

      await service.setPicture('kc-1', file);

      expect(storage.delete).toHaveBeenCalledWith('users/old.png');
    });

    it('lève NotFoundException si l’utilisateur n’existe pas', async () => {
      repo.findByKeycloakId.mockResolvedValue(null);

      await expect(service.setPicture('missing', file)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(storage.put).not.toHaveBeenCalled();
    });
  });

  describe('clearPicture', () => {
    it('supprime l’objet et remet profileMediaKey à null', async () => {
      const updated = makeUser({ profileMediaKey: null });
      repo.findByKeycloakId.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/x.png' }),
      );
      repo.update.mockResolvedValue(updated);

      const result = await service.clearPicture('kc-1');

      expect(repo.update).toHaveBeenCalledWith('kc-1', {
        profileMediaKey: null,
      });
      expect(storage.delete).toHaveBeenCalledWith('users/x.png');
      expect(result).toBe(updated);
    });

    it('ne fait rien quand il n’y a pas d’image', async () => {
      const user = makeUser({ profileMediaKey: null });
      repo.findByKeycloakId.mockResolvedValue(user);

      const result = await service.clearPicture('kc-1');

      expect(repo.update).not.toHaveBeenCalled();
      expect(storage.delete).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });
  });
});
