import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class SpacesGateway implements OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private spaceListeners = new Map<string, Set<any>>();
  private logger = new Logger('SpacesGateway');

  // 1. This will log when the backend starts
  afterInit() {
    this.logger.log('🚀 SpacesGateway Initialized!');
  }

  @SubscribeMessage('join-space')
  handleJoinSpace(@ConnectedSocket() client: Socket, @MessageBody() data: { spaceId: string, user: any }) {
    // 2. Safety check
    if (!data || !data.spaceId || !data.user) {
      this.logger.error('❌ Invalid join-space data:', data);
      return;
    }

    this.logger.log(`📡 User ${data.user.username} joining space ${data.spaceId}`);
    
    client.join(data.spaceId);
    
    if (!this.spaceListeners.has(data.spaceId)) {
      this.spaceListeners.set(data.spaceId, new Set());
    }
    
    this.spaceListeners.get(data.spaceId)!.add({ socketId: client.id, ...data.user });
    
    const currentListeners = Array.from(this.spaceListeners.get(data.spaceId)!);
    this.server.to(data.spaceId).emit('listeners-updated', currentListeners);
    this.logger.log(`📢 Broadcasted ${currentListeners.length} listeners to room ${data.spaceId}`);
  }

  @SubscribeMessage('leave-space')
  handleLeaveSpace(@ConnectedSocket() client: Socket, @MessageBody() data: { spaceId: string }) {
    this.logger.log(`📡 User left space ${data.spaceId}`);
    client.leave(data.spaceId);
    this.removeListener(client.id, data.spaceId);
  }

  handleDisconnect(client: Socket) {
    for (const [spaceId, listeners] of this.spaceListeners.entries()) {
      this.removeListener(client.id, spaceId);
    }
  }

  private removeListener(socketId: string, spaceId: string) {
    if (this.spaceListeners.has(spaceId)) {
      const listeners = this.spaceListeners.get(spaceId)!;
      for (const listener of listeners) {
        if (listener.socketId === socketId) {
          listeners.delete(listener);
          break;
        }
      }
      this.server.to(spaceId).emit('listeners-updated', Array.from(listeners));
    }
  }
}