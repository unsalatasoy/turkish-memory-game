export type PairType = "synonym" | "antonym";

export interface WordPair {
  word1: string;
  word2: string;
  type: PairType;
}

export interface Card {
  id: number;
  word: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: number;
  matchedBy?: string;  // Player ID who matched this card
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
}

export interface GameState {
  players: Player[];
  currentTurn: string;
  cards: Card[];
  gameStarted: boolean;
  gameOver: boolean;
  mode: PairType | null;
}