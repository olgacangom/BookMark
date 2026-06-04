import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clubsService } from './club.service';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('clubsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Gestión de Clubes', () => {
        it('createClub: debería enviar los datos al crear un club', async () => {
            const clubData = { name: 'Club Lectura', description: 'Desc' };
            vi.mocked(api.post).mockResolvedValue({ data: { id: '1', ...clubData } });

            const result = await clubsService.createClub(clubData);
            expect(api.post).toHaveBeenCalledWith('/clubs', clubData);
            expect(result.name).toBe('Club Lectura');
        });

        it('getClubs: debería obtener todos los clubes', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1', name: 'Club 1' }] });
            const result = await clubsService.getClubs();
            expect(api.get).toHaveBeenCalledWith('/clubs');
            expect(result).toHaveLength(1);
        });
    });

    describe('Gestión de Hilos y Posts', () => {
        it('createThread: debería enviar el título y el bookId opcional', async () => {
            const threadData = { title: 'Nuevo Hilo', relatedBookId: 123 };
            vi.mocked(api.post).mockResolvedValue({ data: { id: 't1', ...threadData } });

            await clubsService.createThread('c1', 'Nuevo Hilo', 123);
            expect(api.post).toHaveBeenCalledWith('/clubs/c1/threads', threadData);
        });

        it('createPost: debería enviar el contenido y la página de spoiler', async () => {
            const postData = { content: 'Gran libro', spoilerPage: 50 };
            vi.mocked(api.post).mockResolvedValue({ data: { id: 'p1' } });

            await clubsService.createPost('t1', 'Gran libro', 50);
            expect(api.post).toHaveBeenCalledWith('/clubs/threads/t1/posts', postData);
        });
    });

    describe('Operaciones de estado', () => {
        it('joinClub: debería llamar al endpoint de unirse', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
            await clubsService.joinClub('c1');
            expect(api.post).toHaveBeenCalledWith('/clubs/c1/join');
        });

        it('deleteClub: debería eliminar el club por ID', async () => {
            vi.mocked(api.delete).mockResolvedValue({ data: { deleted: true } });
            await clubsService.deleteClub('c1');
            expect(api.delete).toHaveBeenCalledWith('/clubs/c1');
        });
    });

    describe('Métodos faltantes para cobertura completa', () => {
        it('updateClub: debería actualizar un club', async () => {
            const updateData = { name: 'Nuevo Nombre', description: 'Nueva Desc' };
            vi.mocked(api.patch).mockResolvedValue({ data: { id: '1', ...updateData } });

            const result = await clubsService.updateClub('1', updateData);
            expect(api.patch).toHaveBeenCalledWith('/clubs/1', updateData);
            expect(result.name).toBe('Nuevo Nombre');
        });

        it('getClubById: debería obtener un club por ID', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: { id: '1', name: 'Club 1' } });
            const result = await clubsService.getClubById('1');
            expect(api.get).toHaveBeenCalledWith('/clubs/1');
            expect(result.id).toBe('1');
        });

        it('getThreads: debería obtener los hilos de un club', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: [{ id: 't1' }] });
            const result = await clubsService.getThreads('c1');
            expect(api.get).toHaveBeenCalledWith('/clubs/c1/threads');
            expect(result).toHaveLength(1);
        });

        it('getThreadById: debería obtener un hilo específico', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: { id: 't1' } });
            const result = await clubsService.getThreadById('t1');
            expect(api.get).toHaveBeenCalledWith('/clubs/threads/t1');
            expect(result.id).toBe('t1');
        });

        it('getPosts: debería obtener los posts de un hilo', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: [{ id: 'p1' }] });
            const result = await clubsService.getPosts('t1');
            expect(api.get).toHaveBeenCalledWith('/clubs/threads/t1/posts');
            expect(result).toHaveLength(1);
        });
    });
});