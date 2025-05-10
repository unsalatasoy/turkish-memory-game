import { Express, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

declare module 'express' {
  export interface Express {
    use: (middleware: any) => Express;
    listen: (port: number, callback?: () => void) => HttpServer;
  }
  export interface Request {
    body: any;
    params: any;
    query: any;
  }
  export interface Response {
    json: (data: any) => void;
    send: (data: any) => void;
    status: (code: number) => Response;
  }
  const express: () => Express;
  export default express;
}

declare module 'socket.io' {
  export class Server {
    constructor(httpServer: HttpServer, options?: any);
    on(event: string, callback: (socket: any) => void): void;
    emit(event: string, data: any): void;
    to(room: string): {
      emit: (event: string, data: any) => void;
    };
  }
}

declare module 'uuid' {
  export function v4(): string;
}

declare module 'cors' {
  const cors: (options?: any) => any;
  export default cors;
} 