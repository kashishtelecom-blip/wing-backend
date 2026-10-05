import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

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
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers.authorization || '').replace('Bearer ', '');

      if (!token) throw new Error('No token provided');

      const payload: any = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;
      if (!userId) throw new Error('Invalid token payload');

      client.data.userId = userId;
      client.join(`user-${userId}`);

      this.logger.log(`✅ User ${userId} connected (${client.id})`);
    } catch (err) {
      this.logger.warn(`❌ Socket auth failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.logger.log(
        `👋 User ${client.data.userId} disconnected (${client.id})`,
      );
    }
  }

  /**
   * Push an event to a specific user (from NotificationsService).
   */
  emitToUser(userId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Server not initialized yet, skipping emit');
      return;
    }
    this.server.to(`user-${userId}`).emit(event, payload);
    this.logger.log(`📤 Emitted "${event}" to user-${userId}`);
  }
}