import { CommentController } from './comment.controller.js';
import { CommentService } from '../services/comment.service.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CommentWithCounts } from '../repositories/comment.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { UserModel } from '../generated/prisma/models.js';

function makeComment(
  overrides: Partial<CommentWithCounts> = {},
): CommentWithCounts {
  return {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    postId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
    authorId: 'user-1',
    content: 'Contenu',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: { likes: 5 },
    author: {
      keycloakId: 'user-1',
      username: 'tester',
      displayName: 'Testeur',
      profileMediaKey: null,
    },
    likes: [],
    ...overrides,
  } as CommentWithCounts;
}

describe('CommentController', () => {
  let controller: CommentController;
  let service: jest.Mocked<CommentService>;
  let currentUser: jest.Mocked<CurrentUserService>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    service = {
      list: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      toggleLike: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<CommentService>;

    currentUser = {
      getDbUser: jest
        .fn()
        .mockResolvedValue({ keycloakId: 'user-1' } as UserModel),
    } as unknown as jest.Mocked<CurrentUserService>;

    storage = {
      presign: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<StorageService>;

    controller = new CommentController(service, currentUser, storage);
  });

  describe('getComments', () => {
    it('renvoie l’enveloppe paginée, mappe _count et expose auteur + likedByMe', async () => {
      service.list.mockResolvedValue({
        items: [makeComment({ _count: { likes: 5 }, likes: [{ id: 'l-1' }] })],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.getComments({ postId: 'post-1' });

      expect(service.list).toHaveBeenCalledWith({ postId: 'post-1' }, 'user-1');
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(result.data[0]).toMatchObject({ likesCount: 5, likedByMe: true });
      expect(result.data[0].author).toMatchObject({ username: 'tester' });
      expect(result.data[0]).not.toHaveProperty('_count');
      expect(result.data[0]).not.toHaveProperty('likes');
    });
  });

  describe('getComment', () => {
    it('mappe le commentaire renvoyé par le service', async () => {
      service.getOne.mockResolvedValue(makeComment());

      const result = await controller.getComment(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
      );

      expect(service.getOne).toHaveBeenCalledWith(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'user-1',
      );
      expect(result).toMatchObject({ content: 'Contenu' });
    });
  });

  describe('createComment', () => {
    it('crée le commentaire avec le keycloakId courant', async () => {
      const dto = { postId: 'post-1', content: 'C' };
      service.create.mockResolvedValue(makeComment());

      await controller.createComment(dto);

      expect(currentUser.getDbUser).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('updateComment', () => {
    it('délègue (id, utilisateur courant, dto) au service', async () => {
      const dto = { content: 'Maj' };
      service.update.mockResolvedValue(makeComment({ content: 'Maj' }));

      const result = await controller.updateComment('comment-1', dto);

      expect(service.update).toHaveBeenCalledWith('comment-1', 'user-1', dto);
      expect(result).toMatchObject({ content: 'Maj' });
    });
  });

  describe('likeComment', () => {
    it('renvoie le résultat de toggleLike sans le transformer', async () => {
      service.toggleLike.mockResolvedValue({ liked: true, likesCount: 6 });

      const result = await controller.likeComment('comment-1');

      expect(service.toggleLike).toHaveBeenCalledWith('comment-1', 'user-1');
      expect(result).toEqual({ liked: true, likesCount: 6 });
    });
  });

  describe('deleteComment', () => {
    it('supprime via le service et renvoie { deleted: true }', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.deleteComment('comment-1');

      expect(service.remove).toHaveBeenCalledWith('comment-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
