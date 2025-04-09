import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Speech bubble effects
export type SpeechEffect = 'normal' | 'thinking' | 'excited' | 'warning' | 'technical';

// Message queue for handling complex interactions
export interface QueuedMessage {
  content: string;
  effect?: SpeechEffect;
  duration?: number; // How long should the message be displayed (ms)
  onComplete?: () => void;
}

// Character state type
export type CharacterState = 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing' | 'confused' | 'concerned' | 'approving';

// Pointing direction
export type PointingDirection = 'left' | 'right' | 'up' | 'down' | 'none';

// Define types for our context
interface CharacterContextType {
  // Basic character state
  characterState: CharacterState;
  characterMessage: string;
  messageEffect: SpeechEffect;
  userProgress: number;
  pointingDirection: PointingDirection;

  // Setters
  setCharacterState: (state: CharacterState) => void;
  setCharacterMessage: (message: string, effect?: SpeechEffect) => void;
  setUserProgress: (progress: number) => void;
  setPointingDirection: (direction: PointingDirection) => void;

  // Advanced message handling
  messageQueue: QueuedMessage[];
  addMessageToQueue: (message: QueuedMessage) => void;
  clearMessageQueue: () => void;

  // Complex interactions
  sayAndDo: (message: string, state: CharacterState, effect?: SpeechEffect, duration?: number) => Promise<void>;
  pointAt: (direction: PointingDirection, message?: string) => void;
  showThinking: (message?: string) => void;
  showApproval: (message?: string) => void;
  showConcern: (message?: string) => void;
}

// Default values for context
const defaultContextValues: CharacterContextType = {
  characterState: 'idle',
  characterMessage: '',
  messageEffect: 'normal',
  userProgress: 0,
  pointingDirection: 'none',
  
  setCharacterState: () => {},
  setCharacterMessage: () => {},
  setUserProgress: () => {},
  setPointingDirection: () => {},
  
  messageQueue: [],
  addMessageToQueue: () => {},
  clearMessageQueue: () => {},
  
  sayAndDo: async () => {},
  pointAt: () => {},
  showThinking: () => {},
  showApproval: () => {},
  showConcern: () => {}
};

// Create the context
export const CharacterContext = createContext<CharacterContextType>(defaultContextValues);

// Create provider component
interface CharacterProviderProps {
  children: ReactNode;
  initialMessage?: string;
  initialState?: CharacterState;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ 
  children,
  initialMessage = '',
  initialState = 'idle' 
}) => {
  const [characterState, setCharacterState] = useState<CharacterState>(initialState);
  const [characterMessage, setCharacterMessageState] = useState<string>(initialMessage);
  const [messageEffect, setMessageEffect] = useState<SpeechEffect>('normal');
  const [userProgress, setUserProgress] = useState<number>(0);
  const [pointingDirection, setPointingDirection] = useState<PointingDirection>('none');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

  // Helper to set both message and effect
  const setCharacterMessage = useCallback((message: string, effect: SpeechEffect = 'normal') => {
    setCharacterMessageState(message);
    setMessageEffect(effect);
  }, []);

  // Add a message to the queue
  const addMessageToQueue = useCallback((message: QueuedMessage) => {
    setMessageQueue(prevQueue => [...prevQueue, message]);
  }, []);

  // Clear the message queue
  const clearMessageQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Say a message and change state with optional duration
  const sayAndDo = useCallback(
    (message: string, state: CharacterState, effect: SpeechEffect = 'normal', duration: number = 0): Promise<void> => {
      return new Promise((resolve) => {
        setCharacterState(state);
        setCharacterMessage(message, effect);
        
        if (duration > 0) {
          setTimeout(resolve, duration);
        } else {
          // For auto-resolving based on message length
          const estimatedReadTime = Math.max(2000, message.length * 50);
          setTimeout(resolve, estimatedReadTime);
        }
      });
    },
    [setCharacterMessage]
  );

  // Shorthand for pointing at something
  const pointAt = useCallback(
    (direction: PointingDirection, message?: string) => {
      setCharacterState('pointing');
      setPointingDirection(direction);
      
      if (message) {
        setCharacterMessage(message, 'normal');
      }
    },
    [setCharacterMessage]
  );

  // Shorthand for thinking state
  const showThinking = useCallback(
    (message?: string) => {
      setCharacterState('thinking');
      
      if (message) {
        setCharacterMessage(message, 'thinking');
      }
    },
    [setCharacterMessage]
  );

  // Shorthand for approval state
  const showApproval = useCallback(
    (message?: string) => {
      setCharacterState('approving');
      
      if (message) {
        setCharacterMessage(message, 'normal');
      }
    },
    [setCharacterMessage]
  );

  // Shorthand for concern state
  const showConcern = useCallback(
    (message?: string) => {
      setCharacterState('concerned');
      
      if (message) {
        setCharacterMessage(message, 'warning');
      }
    },
    [setCharacterMessage]
  );

  return (
    <CharacterContext.Provider 
      value={{ 
        characterState, 
        characterMessage,
        messageEffect,
        userProgress,
        pointingDirection,
        
        setCharacterState, 
        setCharacterMessage,
        setUserProgress,
        setPointingDirection,
        
        messageQueue,
        addMessageToQueue,
        clearMessageQueue,
        
        sayAndDo,
        pointAt,
        showThinking,
        showApproval,
        showConcern
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

// Create hook for using this context
export const useCharacter = () => useContext(CharacterContext);