import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway inicializado correctamente');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.join(userId);
      console.log(`Cliente conectado y unido a la sala del usuario: ${userId} (${client.id})`);
    } else {
      console.log(`Cliente conectado sin userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(`Evento 'ping' recibido del cliente ${client.id} con datos:`, data);
    return 'pong'; 
  }

  @SubscribeMessage('echo')
  handleEcho(@MessageBody() data: any): any {
    console.log('Evento echo recibido con payload:', data);
    return {
      event: 'echo_reply',
      data: data,
    };
  }
}
