import { ClubsGateway } from './club.gateaway';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Socket } from 'socket.io'; // Importación correcta del tipo

describe('ClubsGateway', () => {
  let gateway: ClubsGateway;

  const mockServer = {
    emit: jest.fn(),
  } as { emit: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new ClubsGateway();
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('handleConnection should log connected client id', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const client = { id: 'socket-1' } as unknown as Socket;

    gateway.handleConnection(client);

    expect(consoleSpy).toHaveBeenCalledWith('Cliente conectado: socket-1');
    consoleSpy.mockRestore();
  });

  it('handleDisconnect should log disconnected client id', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const client = { id: 'socket-1' } as unknown as Socket;

    gateway.handleDisconnect(client);

    expect(consoleSpy).toHaveBeenCalledWith('Cliente desconectado: socket-1');
    consoleSpy.mockRestore();
  });

  it('notifyNewPost should emit on thread channel', () => {
    const post = { id: 'p1', content: 'hi' };
    gateway.notifyNewPost('thread1', post);
    expect(mockServer.emit).toHaveBeenCalledWith('thread-thread1', post);
  });
});
