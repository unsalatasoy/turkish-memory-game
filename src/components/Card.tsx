import { Box, Text } from "@chakra-ui/react";
import { Card as CardType } from "../types";

interface CardProps {
  card: CardType;
  onClick: () => void;
}

export const Card: React.FC<CardProps> = ({ card, onClick }) => {
  return (
    <Box
      w="100%"
      h="100px"
      bg={card.isFlipped ? "blue.500" : "gray.200"}
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.3s"
      _hover={{ transform: "scale(1.05)" }}
      boxShadow="md"
    >
      <Text
        fontSize="xl"
        fontWeight="bold"
        color={card.isFlipped ? "white" : "transparent"}
        userSelect="none"
      >
        {card.word}
      </Text>
    </Box>
  );
};

export {}; 