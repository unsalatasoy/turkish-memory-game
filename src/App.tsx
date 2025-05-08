import React, { useEffect, useState } from "react";
import { wordPairs } from "./data";
import { Card as CardType, PairType } from "./types";

const CARD_COLORS = [
  "bg-pink-200",
  "bg-blue-200",
  "bg-green-200",
  "bg-yellow-200",
  "bg-purple-200",
  "bg-orange-200",
  "bg-teal-200",
  "bg-red-200",
  "bg-indigo-200",
  "bg-lime-200",
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<PairType | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (mode) {
      // Prepare cards for the selected mode
      const filteredPairs = wordPairs.filter((pair) => pair.type === mode);
      // Randomly select 8 pairs
      const selectedPairs = shuffle(filteredPairs).slice(0, 8);
      let cardList: CardType[] = [];
      selectedPairs.forEach((pair, idx) => {
        cardList.push(
          {
            id: idx * 2,
            word: pair.word1,
            pairId: idx,
            isFlipped: false,
            isMatched: false,
          },
          {
            id: idx * 2 + 1,
            word: pair.word2,
            pairId: idx,
            isFlipped: false,
            isMatched: false,
          }
        );
      });
      cardList = shuffle(cardList);
      setCards(cardList);
      setFlipped([]);
      setMatchedCount(0);

      setTimeLeft(240);
      setTimerActive(true);
      setTimeUp(false);
    }
  }, [mode]);

  useEffect(() => {
    if (flipped.length === 2) {
      const [firstIdx, secondIdx] = flipped;
      if (
        cards[firstIdx].pairId === cards[secondIdx].pairId &&
        cards[firstIdx].id !== cards[secondIdx].id
      ) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...card, isMatched: true }
                : card
            )
          );
          setFlipped([]);
          setMatchedCount((count) => count + 1);
        }, 800);
      } else {
        // Not a match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlipped([]);
        }, 1000);
      }
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft === 0) {
      setTimeUp(true);
      setTimerActive(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (cards.length > 0 && matchedCount === cards.length / 2 && timerActive) {
      setTimerActive(false);
    }
  }, [matchedCount, cards, timerActive]);

  const handleCardClick = (idx: number) => {
    if (flipped.length < 2 && !cards[idx].isFlipped && !cards[idx].isMatched) {
      setCards((prev) =>
        prev.map((card, i) =>
          i === idx ? { ...card, isFlipped: true } : card
        )
      );
      setFlipped((prev) => [...prev, idx]);
    }
  };

  const handleRestart = () => {
    setMode(null);
    setCards([]);
    setFlipped([]);
    setMatchedCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-pink-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4 text-pink-700 drop-shadow">
        Türkçe Eş Anlamlı & Zıt Anlamlı Hafıza Oyunu
      </h1>
      {!mode ? (
        <div className="flex flex-col gap-4 items-center">
          <button
            className="px-6 py-3 bg-green-400 text-white rounded-lg text-xl font-semibold shadow hover:bg-green-500 transition"
            onClick={() => setMode("synonym")}
          >
            Eş Anlamlılar
          </button>
          <button
            className="px-6 py-3 bg-blue-400 text-white rounded-lg text-xl font-semibold shadow hover:bg-blue-500 transition"
            onClick={() => setMode("antonym")}
          >
            Zıt Anlamlılar
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="mb-4 flex justify-between w-full">
            <span className="text-lg font-medium text-gray-700">
              Oyun: {mode === "synonym" ? "Eş Anlamlılar" : "Zıt Anlamlılar"}
            </span>
            <button
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              onClick={handleRestart}
            >
              Yeniden Başla
            </button>
          </div>
          <div className="mb-2 text-lg font-bold text-blue-700">
            Kalan Süre: {Math.floor(timeLeft / 60)
              .toString()
              .padStart(2, "0")}
            :{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          <div className="grid gap-4 grid-cols-4">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                className={`w-24 h-24 rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold transition-all duration-300 ${card.isMatched
                  ? "bg-gray-200 text-gray-400"
                  : card.isFlipped
                    ? CARD_COLORS[card.pairId % CARD_COLORS.length] +
                    " text-pink-700 scale-105"
                    : "bg-white text-white hover:bg-yellow-100"
                  }`}
                onClick={() => handleCardClick(idx)}
                disabled={card.isFlipped || card.isMatched || flipped.length === 2 || timeUp}
                style={{ userSelect: "none" }}
              >
                {card.isFlipped || card.isMatched ? card.word : "?"}
              </button>
            ))}

          </div>
          {timeUp && (
            <div className="mt-6 text-2xl font-bold text-red-600 animate-bounce">
              Süre doldu! Tekrar dene!
            </div>
          )}
          {matchedCount === cards.length / 2 && (
            <div className="mt-6 text-2xl font-bold text-green-600 animate-bounce">
              Tebrikler! Tüm eşleşmeleri buldun! 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;