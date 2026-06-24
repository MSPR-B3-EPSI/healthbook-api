import { PostController } from './post.controller.js';
import { PostService } from '../services/post.service.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { PostWithCounts } from '../repositories/post.repository.js';
import { UserModel } from '../generated/prisma/models.js';

function makePost(overrides: Partial<PostWithCounts> = {}): PostWithCounts {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Titre',
    authorId: 'user-1',
    content: 'Contenu',
    mediaUrl: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: { likes: 5, comments: 2 },
    ...overrides,
  } as PostWithCounts;
}

describe('PostController', () => {
  let controller: PostController;
  let service: jest.Mocked<PostService>;
  let currentUser: jest.Mocked<CurrentUserService>;

  beforeEach(() => {
    service = {
      list: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      toggleLike: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<PostService>;

    currentUser = {
      getDbUser: jest
        .fn()
        .mockResolvedValue({ keycloakId: 'user-1' } as UserModel),
    } as unknown as jest.Mocked<CurrentUserService>;

    controller = new PostController(service, currentUser);
  });

  describe('getPosts', () => {
    it('renvoie l’enveloppe paginée { data, total, page, limit }', async () => {
      service.list.mockResolvedValue({
        items: [makePost()],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.getPosts({});

      expect(service.list).toHaveBeenCalledWith({});
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });

    it('mappe _count en likesCount / commentsCount et n’expose pas _count', async () => {
      service.list.mockResolvedValue({
        items: [makePost({ _count: { likes: 5, comments: 2 } })],
        total: 1,
        page: 1,
        limit: 20,
      });

      const { data } = await controller.getPosts({});

      expect(data[0]).toMatchObject({ likesCount: 5, commentsCount: 2 });
      expect(data[0]).not.toHaveProperty('_count');
    });
  });

  describe('getPost', () => {
    it('mappe le post renvoyé par le service', async () => {
      service.getOne.mockResolvedValue(makePost());

      const result = await controller.getPost(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );

      expect(service.getOne).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );
      expect(result).toMatchObject({ id: makePost().id, title: 'Titre' });
    });
  });

  describe('createPost', () => {
    it('crée le post avec le keycloakId de l’utilisateur courant', async () => {
      const dto = { title: 'T', content: 'C' };
      service.create.mockResolvedValue(makePost());

      await controller.createPost(dto);

      expect(currentUser.getDbUser).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledWith('user-1', dto);
    });

    it('renvoie le post mappé', async () => {
      service.create.mockResolvedValue(makePost({ title: 'Nouveau' }));

      const result = await controller.createPost({
        title: 'Nouveau',
        content: 'C',
      });

      expect(result).toMatchObject({ title: 'Nouveau', likesCount: 5 });
    });
  });

  describe('updatePost', () => {
    it('délègue (id, utilisateur courant, dto) au service', async () => {
      const dto = { title: 'Maj' };
      service.update.mockResolvedValue(makePost({ title: 'Maj' }));

      await controller.updatePost('post-1', dto);

      expect(service.update).toHaveBeenCalledWith('post-1', 'user-1', dto);
    });

    it('renvoie le post mappé', async () => {
      service.update.mockResolvedValue(makePost({ title: 'Maj' }));

      const result = await controller.updatePost('post-1', { title: 'Maj' });

      expect(result).toMatchObject({ title: 'Maj' });
    });
  });

  describe('likePost', () => {
    it('renvoie le résultat de toggleLike sans le transformer', async () => {
      service.toggleLike.mockResolvedValue({ liked: true, likesCount: 6 });

      const result = await controller.likePost('post-1');

      expect(service.toggleLike).toHaveBeenCalledWith('post-1', 'user-1');
      expect(result).toEqual({ liked: true, likesCount: 6 });
    });
  });

  describe('deletePost', () => {
    it('supprime via le service avec l’utilisateur courant', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.deletePost('post-1');

      expect(service.remove).toHaveBeenCalledWith('post-1', 'user-1');
    });

    it('renvoie { deleted: true }', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.deletePost('post-1');

      expect(result).toEqual({ deleted: true });
    });
  });
});
