export type PairType = 'synonym' | 'antonym';

export interface WordPair {
  word1: string;
  word2: string;
  type: PairType;
}

export interface Card {
  id: number;
  word: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}