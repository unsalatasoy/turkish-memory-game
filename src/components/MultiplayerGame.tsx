import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  useToast,
  Avatar,
  Grid,
  Card,
  CardBody,
  Badge,
  Heading,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { wordPairs } from '../data';
import { Card as CardType, PairType } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot1",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot2",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot3",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot4",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot5",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot6",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot7",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot8",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot9",
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=robot10"
];

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
}

interface GameState {
  players: Player[];
  currentTurn: string;
  cards: CardType[];
  gameStarted: boolean;
  gameOver: boolean;
  mode: PairType | null;
}

interface ActiveRoom {
  id: string;
  creator: Player;
  mode: PairType;
  playerCount: number;
}

const MultiplayerGame: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedMode, setSelectedMode] = useState<PairType | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const toast = useToast();
  const navigate = useNavigate();
  const { id: urlRoomId } = useParams<{ id: string }>();

  // Get available avatars by filtering out already selected ones
  const getAvailableAvatars = () => {
    if (!gameState?.players.length) return AVATAR_OPTIONS;
    const selectedAvatars = gameState.players.map(player => player.avatar);
    return AVATAR_OPTIONS.filter(avatar => !selectedAvatars.includes(avatar));
  };

  useEffect(() => {
    if (urlRoomId) {
      console.log('Setting room ID from URL:', urlRoomId);
      setRoomId(urlRoomId);
    }

    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
      setError('Oyun sunucusuna bağlanılamadı. Lütfen tekrar deneyin.');
      setIsConnecting(false);
    };

    const handleConnect = () => {
      console.log('Connected to server');
      setError(null);
      setIsConnecting(false);
      setRetryCount(0);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    };

    socket.on('connect_error', handleConnectError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Initial connection attempt
    if (!socket.connected) {
      setIsConnecting(true);
      socket.connect();
    }

    socket.on('roomCreated', (id) => {
      console.log('Room created:', id);
      setRoomId(id);
      setShowRoomInfo(true);
      toast({
        title: 'Oda Oluşturuldu',
        description: `Oda ID: ${id}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('activeRooms', (rooms: ActiveRoom[]) => {
      console.log('Active rooms:', rooms);
      setActiveRooms(rooms);
    });

    socket.on('gameState', (state: GameState) => {
      console.log('Game state updated:', state);
      setGameState(state);
      
      // If we were in turn switching and the cards don't match, reset after delay
      if (selectedCards.length === 2) {
        const [card1, card2] = selectedCards;
        const card1State = state.cards[card1];
        const card2State = state.cards[card2];
        
        if (!card1State.isMatched && !card2State.isMatched) {
          setTimeout(() => {
            setSelectedCards([]);
          }, 2000);
        }
      }
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
      toast({
        title: 'Hata',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    socket.on('joinRoomResponse', (response: { success: boolean; message: string }) => {
      console.log('Join room response received:', response);
      if (!response.success) {
        toast({
          title: 'Hata',
          description: response.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    });

    return () => {
      socket.off('connect_error', handleConnectError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('roomCreated');
      socket.off('activeRooms');
      socket.off('gameState');
      socket.off('error');
      socket.off('joinRoomResponse');
    };
  }, [toast, urlRoomId, selectedCards]);

  // Update selected avatar when available avatars change
  useEffect(() => {
    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.includes(selectedAvatar)) {
      setSelectedAvatar(availableAvatars[0]);
    }
  }, [gameState]);

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir takma ad girin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!selectedMode) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir oyun modu seçin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!socket.connected) {
      toast({
        title: 'Hata',
        description: 'Oyun sunucusuna bağlı değil. Lütfen tekrar deneyin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('Creating room with:', { mode: selectedMode, nickname, avatar: selectedAvatar });
    socket.emit('createRoom', { 
      mode: selectedMode,
      nickname,
      avatar: selectedAvatar 
    });
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir takma ad girin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!roomId) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir oda ID girin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('Attempting to join room:', {
      roomId,
      nickname,
      avatar: selectedAvatar
    });

    socket.emit('joinRoom', {
      roomId,
      nickname,
      avatar: selectedAvatar,
    }, (response: { success: boolean; message: string }) => {
      console.log('Join room response:', response);
      if (!response.success) {
        toast({
          title: 'Hata',
          description: response.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    });
  };

  const handleCardClick = (cardId: number) => {
    if (!gameState) return;

    console.log('Card clicked:', cardId);
    console.log('Current turn:', gameState.currentTurn);
    console.log('Socket ID:', socket.id);
    console.log('Selected cards:', selectedCards);
    console.log('Card state:', gameState.cards[cardId]);

    // Allow clicking if it's your turn and the card isn't already matched
    if (
      gameState.currentTurn !== socket.id ||
      gameState.cards[cardId].isMatched ||
      selectedCards.length >= 2
    ) {
      console.log('Card click ignored because:');
      if (gameState.currentTurn !== socket.id) console.log('- Not your turn');
      if (gameState.cards[cardId].isMatched) console.log('- Card is already matched');
      if (selectedCards.length >= 2) console.log('- Already selected 2 cards');
      return;
    }

    // Don't allow clicking the same card twice
    if (selectedCards.includes(cardId)) {
      console.log('Card already selected');
      return;
    }

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Flip the card immediately for better UX
    const updatedCards = [...gameState.cards];
    updatedCards[cardId] = { ...updatedCards[cardId], isFlipped: true };
    setGameState({ ...gameState, cards: updatedCards });

    if (newSelectedCards.length === 2) {
      console.log('Checking match for cards:', newSelectedCards);
      socket.emit('checkMatch', {
        roomId,
        cardIndices: newSelectedCards
      });
    }
  };

  const copyRoomLink = () => {
    const baseUrl = process.env.PUBLIC_URL || '';
    const roomLink = `${window.location.origin}${baseUrl}/#/game/${roomId}`;
    navigator.clipboard.writeText(roomLink).then(() => {
      toast({
        title: 'Link Kopyalandı!',
        description: 'Oda linki panoya kopyalandı',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: 'Hata',
        description: 'Link kopyalanamadı',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
  };

  // Update the avatar selection UI in both create and join forms
  const renderAvatarSelection = () => (
    <>
      <Text fontSize="sm" mb={2}>Avatarınızı seçin:</Text>
      <HStack spacing={4} wrap="wrap" justify="center">
        {getAvailableAvatars().map((avatar, index) => (
          <Box
            key={index}
            cursor="pointer"
            onClick={() => setSelectedAvatar(avatar)}
            border="2px solid"
            borderColor={selectedAvatar === avatar ? "blue.500" : "transparent"}
            borderRadius="md"
            p={1}
            transition="all 0.2s"
            _hover={{ transform: "scale(1.1)" }}
            bg="white"
            boxShadow="sm"
          >
            <Box
              w="60px"
              h="60px"
              borderRadius="md"
              overflow="hidden"
            >
              <img
                src={avatar}
                alt={`Avatar ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Box>
        ))}
      </HStack>
    </>
  );

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setIsConnecting(true);
      setError(null);
      socket.connect();
    } else {
      setError('Maksimum yeniden deneme sayısına ulaşıldı. Lütfen sayfayı yenileyin.');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Bağlantı Hatası</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          {retryCount < maxRetries ? (
            <button
              onClick={handleRetry}
              disabled={isConnecting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Bağlanıyor...' : 'Tekrar Dene'}
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Sayfayı Yenile
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <Box p={4}>
        <VStack spacing={8}>
          <Heading>Çok Oyunculu Oyun</Heading>
          {showRoomInfo ? (
            <VStack spacing={4} w="100%" maxW="400px">
              <Card w="100%" p={4}>
                <VStack spacing={4}>
                  <Text fontSize="lg" fontWeight="bold">Oda Oluşturuldu!</Text>
                  <Text>Bu linki arkadaşınızla paylaşın:</Text>
                  <InputGroup size="md">
                    <Input
                      value={`${window.location.origin}${process.env.PUBLIC_URL || ''}/#/game/${roomId}`}
                      isReadOnly
                      pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={copyRoomLink}>
                        Kopyala
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Text fontSize="sm" color="gray.500">
                    Diğer oyuncunun katılması bekleniyor...
                  </Text>
                  <Button
                    colorScheme="gray"
                    onClick={() => navigate("/multiplayer")}
                    size="md"
                  >
                    Menüye Dön
                  </Button>
                </VStack>
              </Card>
            </VStack>
          ) : urlRoomId ? (
            // Join Room Form
            <VStack spacing={4} w="100%" maxW="400px">
              <Text fontSize="lg" fontWeight="bold">Oyuna Katıl</Text>
              <Input
                placeholder="Takma adınızı girin"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              {renderAvatarSelection()}
              <Button
                colorScheme="blue"
                size="lg"
                w="100%"
                onClick={handleJoinRoom}
              >
                Odaya Katıl
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => navigate("/multiplayer")}
                size="md"
              >
                Menüye Dön
              </Button>
            </VStack>
          ) : (
            // Create Room Form
            <VStack spacing={4} w="100%" maxW="400px">
              <Text fontSize="lg" fontWeight="bold">Yeni Oyun Oluştur</Text>
              <Input
                placeholder="Takma adınızı girin"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              {renderAvatarSelection()}
              <Select
                placeholder="Oyun modunu seçin"
                value={selectedMode || ''}
                onChange={(e) => setSelectedMode(e.target.value as PairType)}
              >
                <option value="synonym">Eş Anlamlılar</option>
                <option value="antonym">Zıt Anlamlılar</option>
              </Select>
              <Button
                colorScheme="green"
                size="lg"
                w="100%"
                onClick={handleCreateRoom}
              >
                Oda Oluştur
              </Button>
            </VStack>
          )}

          {/* Active Rooms List */}
          {!urlRoomId && !showRoomInfo && activeRooms.length > 0 && (
            <VStack spacing={4} w="100%" maxW="400px" mt={8}>
              <Text fontSize="lg" fontWeight="bold">Aktif Odalar</Text>
              {activeRooms.map((room) => (
                <Card key={room.id} w="100%" p={4}>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Avatar src={room.creator.avatar} size="sm" />
                      <Text>{room.creator.nickname}'nin Odası</Text>
                    </HStack>
                    <Text>Mod: {room.mode === "synonym" ? "Eş Anlamlılar" : "Zıt Anlamlılar"}</Text>
                    <Text>Oyuncular: {room.playerCount}/2</Text>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => navigate(`/game/${room.id}`)}
                    >
                      Odaya Katıl
                    </Button>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>
    );
  }

  if (gameState.gameStarted) {
    return (
      <Box p={4}>
        <VStack spacing={6}>
          <HStack spacing={4} wrap="wrap" justify="center">
            {gameState.players.map((player) => (
              <Card
                key={player.id}
                bg={player.id === gameState.currentTurn ? "blue.100" : "white"}
                p={2}
                borderRadius="md"
                transition="all 0.3s"
                transform={player.id === gameState.currentTurn ? "scale(1.05)" : "scale(1)"}
                opacity={selectedCards.length === 2 ? 0.7 : 1}
              >
                <CardBody>
                  <VStack>
                    <Box
                      w="60px"
                      h="60px"
                      borderRadius="md"
                      overflow="hidden"
                    >
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Text fontWeight="bold">{player.nickname}</Text>
                    <Badge colorScheme="green">Puan: {player.score}</Badge>
                    {player.id === gameState.currentTurn && (
                      <Badge colorScheme="blue">Sıra Sizde</Badge>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </HStack>

          <Text className="text-lg font-medium text-gray-700">
            Oyun Modu: {gameState.mode === "synonym" ? "Eş Anlamlılar" : "Zıt Anlamlılar"}
          </Text>

          <Grid
            templateColumns="repeat(auto-fit, minmax(120px, 1fr))"
            gap={4}
            w="100%"
            maxW="800px"
          >
            {gameState.cards.map((card, index) => {
              const matchedPlayer = card.isMatched && card.matchedBy
                ? gameState.players.find(player => player.id === card.matchedBy)
                : null;

              return (
                <Box
                  key={index}
                  h="100px"
                  bg={card.isMatched ? "green.500" : card.isFlipped ? "blue.500" : "gray.200"}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={gameState.currentTurn === socket.id && selectedCards.length < 2 ? "pointer" : "not-allowed"}
                  onClick={() => handleCardClick(index)}
                  _hover={gameState.currentTurn === socket.id && selectedCards.length < 2 ? { transform: "scale(1.05)" } : {}}
                  opacity={card.isMatched ? 0.8 : 1}
                  position="relative"
                >
                  {card.isFlipped && (
                    <VStack spacing={2}>
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {card.word}
                      </Text>
                      {card.isMatched && matchedPlayer && (
                        <VStack spacing={1}>
                          <Avatar 
                            src={matchedPlayer.avatar} 
                            size="sm" 
                            border="2px solid white"
                          />
                          <Text color="white" fontSize="xs">
                            {matchedPlayer.nickname}
                          </Text>
                        </VStack>
                      )}
                    </VStack>
                  )}
                  {selectedCards.includes(index) && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      border="2px solid"
                      borderColor="yellow.400"
                      borderRadius="md"
                    />
                  )}
                </Box>
              );
            })}
          </Grid>

          {gameState.gameOver && (
            <Button
              colorScheme="blue"
              onClick={() => navigate("/multiplayer")}
              size="lg"
            >
              Tekrar Oyna
            </Button>
          )}
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6}>
        <HStack spacing={4} wrap="wrap" justify="center">
          {gameState.players.map((player) => (
            <Card
              key={player.id}
              bg={player.id === gameState.currentTurn ? "blue.100" : "white"}
              p={2}
              borderRadius="md"
              transition="all 0.3s"
              transform={player.id === gameState.currentTurn ? "scale(1.05)" : "scale(1)"}
              opacity={selectedCards.length === 2 ? 0.7 : 1}
            >
              <CardBody>
                <VStack>
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                  <Text fontWeight="bold">{player.nickname}</Text>
                  <Badge colorScheme="green">Puan: {player.score}</Badge>
                  {player.id === gameState.currentTurn && (
                    <Badge colorScheme="blue">Sıra Sizde</Badge>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </HStack>

        <Text className="text-lg font-medium text-gray-700">
          Oyun Modu: {gameState.mode === "synonym" ? "Eş Anlamlılar" : "Zıt Anlamlılar"}
        </Text>

        <Grid
          templateColumns="repeat(auto-fit, minmax(120px, 1fr))"
          gap={4}
          w="100%"
          maxW="800px"
        >
          {gameState.cards.map((card, index) => {
            const matchedPlayer = card.isMatched && card.matchedBy
              ? gameState.players.find(player => player.id === card.matchedBy)
              : null;

            return (
              <Box
                key={index}
                h="100px"
                bg={card.isMatched ? "green.500" : card.isFlipped ? "blue.500" : "gray.200"}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor={gameState.currentTurn === socket.id && selectedCards.length < 2 ? "pointer" : "not-allowed"}
                onClick={() => handleCardClick(index)}
                _hover={gameState.currentTurn === socket.id && selectedCards.length < 2 ? { transform: "scale(1.05)" } : {}}
                opacity={card.isMatched ? 0.8 : 1}
                position="relative"
              >
                {card.isFlipped && (
                  <VStack spacing={2}>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      {card.word}
                    </Text>
                    {card.isMatched && matchedPlayer && (
                      <VStack spacing={1}>
                        <Avatar 
                          src={matchedPlayer.avatar} 
                          size="sm" 
                          border="2px solid white"
                        />
                        <Text color="white" fontSize="xs">
                          {matchedPlayer.nickname}
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                )}
                {selectedCards.includes(index) && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    border="2px solid"
                    borderColor="yellow.400"
                    borderRadius="md"
                  />
                )}
              </Box>
            );
          })}
        </Grid>

        {gameState.gameOver && (
          <Button
            colorScheme="blue"
            onClick={() => navigate("/multiplayer")}
            size="lg"
          >
            Tekrar Oyna
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default MultiplayerGame; 