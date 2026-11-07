import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SpacesGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Keeps track of active listeners in each space room
  private spaceListeners = new Map<string, Set<any>>();

  @SubscribeMessage('join-space')
  handleJoinSpace(@ConnectedSocket() client: Socket, @MessageBody() data: { spaceId: string, user: any }) {
    client.join(data.spaceId);
    
    if (!this.spaceListeners.has(data.spaceId)) {
      this.spaceListeners.set(data.spaceId, new Set());
    }
    
    // Add user to the room's listener list
    this.spaceListeners.get(data.spaceId)!.add({ socketId: client.id, ...data.user });
    
    // Broadcast the updated list to everyone in the room
    this.server.to(data.spaceId).emit('listeners-updated', Array.from(this.spaceListeners.get(data.spaceId)!));
  }

  @SubscribeMessage('leave-space')
  handleLeaveSpace(@ConnectedSocket() client: Socket, @MessageBody() data: { spaceId: string }) {
    client.leave(data.spaceId);
    this.removeListener(client.id, data.spaceId);
  }

  handleDisconnect(client: Socket) {
    // Clean up if a user closes the tab or loses connection
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