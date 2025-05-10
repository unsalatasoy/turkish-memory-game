import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  HStack,
  useToast,
  Heading,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { wordPairs } from "../data";
import { Card as CardType, PairType } from "../types";
import { Card } from "./Card";

const CARD_COLORS = [
  "blue.500",
  "green.500",
  "purple.500",
  "pink.500",
  "orange.500",
  "teal.500",
  "cyan.500",
  "yellow.500",
];

const SinglePlayerGame: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mode, setMode] = useState<PairType | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  console.log("SinglePlayerGame rendered", { gameStarted, mode, cards });

  const generateCards = (mode: PairType) => {
    const filteredPairs = wordPairs.filter((pair) => pair.type === mode);
    const selectedPairs = filteredPairs.slice(0, 8);
    const newCards: CardType[] = [];

    selectedPairs.forEach((pair, index) => {
      newCards.push({
        id: index * 2,
        word: pair.word1,
        isFlipped: false,
        isMatched: false,
        pairId: index,
      });
      newCards.push({
        id: index * 2 + 1,
        word: pair.word2,
        isFlipped: false,
        isMatched: false,
        pairId: index,
      });
    });

    return shuffleArray(newCards);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleCardClick = (index: number) => {
    if (
      flippedCards.length >= 2 ||
      cards[index].isFlipped ||
      cards[index].isMatched
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      if (cards[first].pairId === cards[second].pairId) {
        setMatchedPairs((prev) => prev + 1);
        setCards((prev) =>
          prev.map((card, idx) =>
            idx === first || idx === second
              ? { ...card, isMatched: true }
              : card
          )
        );
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === first || idx === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
        }, 1000);
      }
      setFlippedCards([]);
    } else {
      setCards((prev) =>
        prev.map((card, idx) =>
          idx === index ? { ...card, isFlipped: true } : card
        )
      );
    }
  };

  const startGame = (selectedMode: PairType) => {
    console.log("Starting game with mode:", selectedMode);
    setMode(selectedMode);
    const newCards = generateCards(selectedMode);
    console.log("Generated cards:", newCards);
    setCards(newCards);
    setGameStarted(true);
  };

  useEffect(() => {
    if (matchedPairs === 8) {
      toast({
        title: "Congratulations!",
        description: "You've matched all pairs!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [matchedPairs, toast]);

  if (!gameStarted) {
    return (
      <Box p={4}>
        <VStack spacing={8}>
          <Heading>Oyun Modu Seçin</Heading>
          <HStack spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => startGame("synonym")}
            >
              Eş Anlamı Kelimeler
            </Button>
            <Button
              colorScheme="green"
              size="lg"
              onClick={() => startGame("antonym")}
            >
              Zıt Anlamı Kelimeler
            </Button>
          </HStack>
          <Button
            colorScheme="gray"
            onClick={() => navigate("/")}
            size="md"
          >
            Ana Menüye Geri Dön
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6}>
        <HStack justify="space-between" w="100%" maxW="800px">
          <Text fontSize="xl" fontWeight="bold">
            {mode === "synonym" ? "Synonyms" : "Antonyms"}
          </Text>
          <Text fontSize="xl">
            Eşleşen Çiftler: {matchedPairs}/8
          </Text>
        </HStack>

        <Grid
          templateColumns="repeat(auto-fit, minmax(120px, 1fr))"
          gap={4}
          w="100%"
          maxW="800px"
        >
          {cards.map((card, index) => (
            <Card
              key={index}
              card={card}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </Grid>

        <Button
          colorScheme="gray"
          onClick={() => navigate("/")}
          size="md"
        >
          Ana Menüye Geri Dön
        </Button>
      </VStack>
    </Box>
  );
};

export default SinglePlayerGame; 