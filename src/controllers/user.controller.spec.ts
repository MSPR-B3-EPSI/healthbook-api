import { UserController } from './user.controller.js';
import { UserService } from '../services/user.service.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
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

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;
  let currentUser: jest.Mocked<CurrentUserService>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    service = {
      getOne: jest.fn(),
      update: jest.fn(),
      setPicture: jest.fn(),
      clearPicture: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    currentUser = {
      getDbUser: jest
        .fn()
        .mockResolvedValue({ keycloakId: 'kc-1' } as UserModel),
    } as unknown as jest.Mocked<CurrentUserService>;

    storage = {
      presign: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<StorageService>;

    controller = new UserController(service, currentUser, storage);
  });

  describe('getMe', () => {
    it('renvoie l’utilisateur courant mappé', async () => {
      service.getOne.mockResolvedValue(makeUser({ username: 'tester' }));

      const result = await controller.getMe();

      expect(service.getOne).toHaveBeenCalledWith('kc-1');
      expect(result).toMatchObject({ keycloakId: 'kc-1', username: 'tester' });
      expect(result).not.toHaveProperty('profileMediaKey');
    });

    it('expose l’URL présignée dans profilePictureUrl', async () => {
      service.getOne.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/x.png' }),
      );
      storage.presign.mockResolvedValue('https://signed.example/x.png');

      const result = await controller.getMe();

      expect(storage.presign).toHaveBeenCalledWith('users/x.png');
      expect(result.profilePictureUrl).toBe('https://signed.example/x.png');
    });
  });

  describe('updateMe', () => {
    it('délègue (keycloakId courant, dto) au service', async () => {
      const dto = { displayName: 'Bob' };
      service.update.mockResolvedValue(makeUser({ displayName: 'Bob' }));

      const result = await controller.updateMe(dto);

      expect(service.update).toHaveBeenCalledWith('kc-1', dto);
      expect(result).toMatchObject({ displayName: 'Bob' });
    });
  });

  describe('uploadPicture', () => {
    it('délègue le fichier au service avec le keycloakId courant', async () => {
      const file = { originalname: 'a.png' } as never;
      service.setPicture.mockResolvedValue(
        makeUser({ profileMediaKey: 'users/n.png' }),
      );

      await controller.uploadPicture(file);

      expect(service.setPicture).toHaveBeenCalledWith('kc-1', file);
    });
  });

  describe('deletePicture', () => {
    it('délègue au service', async () => {
      service.clearPicture.mockResolvedValue(
        makeUser({ profileMediaKey: null }),
      );

      await controller.deletePicture();

      expect(service.clearPicture).toHaveBeenCalledWith('kc-1');
    });
  });

  describe('getUser', () => {
    it('renvoie l’utilisateur demandé par id', async () => {
      service.getOne.mockResolvedValue(makeUser({ keycloakId: 'kc-2' }));

      const result = await controller.getUser('kc-2');

      expect(service.getOne).toHaveBeenCalledWith('kc-2');
      expect(result).toMatchObject({ keycloakId: 'kc-2' });
    });
  });
});
