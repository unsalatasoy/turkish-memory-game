declare module 'express' {
  export * from 'express';
}

declare module 'uuid' {
  export function v4(): string;
}

declare module 'socket.io' {
  export * from 'socket.io';
}

declare module 'cors' {
  const cors: any;
  export default cors;
} 