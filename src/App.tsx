import React from 'react';
import { ChakraProvider, Box, VStack, Heading, Button } from "@chakra-ui/react";
import { HashRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import SinglePlayerGame from "./components/SinglePlayerGame";
import MultiplayerGame from "./components/MultiplayerGame";

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Routes>
            <Route
              path="/"
              element={
                <VStack spacing={8} py={20}>
                  <Heading>Eş Anlamı/Zıt Anlamı Kelimeler Hafıza Oyunu</Heading>
                  <VStack spacing={4}>
                    <Button
                      as={Link}
                      to="/single"
                      colorScheme="blue"
                      size="lg"
                      w="200px"
                    >
                      Tek Oyunculu Oyun
                    </Button>
                    <Button
                      as={Link}
                      to="/multiplayer"
                      colorScheme="green"
                      size="lg"
                      w="200px"
                    >
                      Çok Oyunculu Oyun
                    </Button>
                  </VStack>
                </VStack>
              }
            />
            <Route path="/single" element={<SinglePlayerGame />} />
            <Route path="/multiplayer" element={<MultiplayerGame />} />
            <Route path="/game/:id" element={<MultiplayerGame />} />
            {/* Redirect any other paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;