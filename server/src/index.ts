import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { wordPairs } from './data';
import { Card, GameState, PairType, Player } from './types';

dotenv.config();

interface SocketData {
  mode: PairType;
  nickname: string;
  avatar: string;
  roomId: string;
  cardIndices: number[];
}

interface JoinRoomCallback {
  (response: { success: boolean; message: string }): void;
}

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://unsalatasoy.github.io'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://unsalatasoy.github.io'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
});

interface Room {
  players: Player[];
  cards: Card[];
  currentTurn: string;
  gameStarted: boolean;
  gameOver: boolean;
  mode: PairType;
  creator: Player;
}

const rooms: { [key: string]: Room } = {};

function generateCards(mode: PairType): Card[] {
  const filteredPairs = wordPairs.filter((pair) => pair.type === mode);
  const selectedPairs = filteredPairs.slice(0, 8);
  const cards: Card[] = [];

  selectedPairs.forEach((pair, index) => {
    cards.push({
      id: index * 2,
      word: pair.word1,
      isFlipped: false,
      isMatched: false,
      pairId: index,
    });
    cards.push({
      id: index * 2 + 1,
      word: pair.word2,
      isFlipped: false,
      isMatched: false,
      pairId: index,
    });
  });

  return shuffleArray(cards);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function getActiveRooms() {
  return Object.entries(rooms)
    .filter(([_, room]) => !room.gameStarted && !room.gameOver)
    .map(([id, room]) => ({
      id,
      creator: room.creator,
      mode: room.mode,
      playerCount: room.players.length
    }));
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Transport:', socket.conn.transport.name);

  socket.emit('activeRooms', getActiveRooms());

  socket.on('createRoom', ({ mode, nickname, avatar }: SocketData) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    const player: Player = {
      id: socket.id,
      nickname,
      avatar,
      score: 0,
    };

    rooms[roomId] = {
      players: [player],
      cards: generateCards(mode),
      currentTurn: socket.id,
      gameStarted: false,
      gameOver: false,
      mode,
      creator: player,
    };

    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.to(roomId).emit('gameState', rooms[roomId]);
    io.emit('activeRooms', getActiveRooms());
  });

  socket.on('joinRoom', ({ roomId, nickname, avatar }: SocketData, callback: JoinRoomCallback) => {
    if (!rooms[roomId]) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    if (rooms[roomId].players.length >= 2) {
      callback({ success: false, message: 'Room is full' });
      return;
    }

    const player: Player = {
      id: socket.id,
      nickname,
      avatar,
      score: 0,
    };

    rooms[roomId].players.push(player);
    rooms[roomId].gameStarted = true;

    socket.join(roomId);
    callback({ success: true, message: 'Successfully joined room' });
    io.to(roomId).emit('gameState', rooms[roomId]);
    io.emit('activeRooms', getActiveRooms());
  });

  socket.on('checkMatch', ({ roomId, cardIndices }: SocketData) => {
    const room = rooms[roomId];
    if (!room) return;

    const [index1, index2] = cardIndices;
    const card1 = room.cards[index1];
    const card2 = room.cards[index2];

    if (card1.pairId === card2.pairId) {
      const currentPlayer = room.players.find((p) => p.id === socket.id);
      if (currentPlayer) {
        room.cards[index1].isMatched = true;
        room.cards[index2].isMatched = true;
        room.cards[index1].matchedBy = currentPlayer.id;
        room.cards[index2].matchedBy = currentPlayer.id;
        
        currentPlayer.score += 1;
        
        room.currentTurn = currentPlayer.id;

        const allMatched = room.cards.every((card) => card.isMatched);
        if (allMatched) {
          const winner = room.players.reduce((prev, current) =>
            prev.score > current.score ? prev : current
          );
          io.to(roomId).emit('gameOver', winner);
          room.gameOver = true;
        }

        io.to(roomId).emit('gameState', {
          ...room,
          cards: room.cards.map(card => ({
            ...card,
            matchedBy: card.matchedBy || undefined
          }))
        });
      }
    } else {
      io.to(roomId).emit('gameState', room);

      setTimeout(() => {
        room.cards[index1].isFlipped = false;
        room.cards[index2].isFlipped = false;
        room.currentTurn = room.players.find((p) => p.id !== socket.id)?.id || '';
        io.to(roomId).emit('gameState', room);
      }, 3000);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('gameState', room);
        }
        io.emit('activeRooms', getActiveRooms());
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 