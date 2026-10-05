import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:4200',
      'https://wing-frontend.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Called by the frontend when a user opens a conversation.
   * Joins the socket to a room named `conversation-<id>`.
   */
  @SubscribeMessage('join-conversation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const room = `conversation-${data.conversationId}`;
    client.join(room);
    this.logger.log(`👥 ${client.id} joined ${room}`);
    return { joined: true, room };
  }

  @SubscribeMessage('leave-conversation')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const room = `conversation-${data.conversationId}`;
    client.leave(room);
    this.logger.log(`👋 ${client.id} left ${room}`);
  }

  /**
   * Called by ChatService after saving a message — pushes to everyone in the room.
   */
  emitToConversation(conversationId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Chat gateway server not ready');
      return;
    }
    const room = `conversation-${conversationId}`;
    this.server.to(room).emit(event, payload);
    this.logger.log(`📤 Emitted "${event}" to ${room}`);
  }
}