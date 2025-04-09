import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types for our context
interface CharacterContextType {
  characterState: 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing';
  characterMessage: string;
  setCharacterState: (state: 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing') => void;
  setCharacterMessage: (message: string) => void;
  userProgress: number;
  setUserProgress: (progress: number) => void;
}

// Create the context
export const CharacterContext = createContext<CharacterContextType>({
  characterState: 'idle',
  characterMessage: '',
  setCharacterState: () => {},
  setCharacterMessage: () => {},
  userProgress: 0,
  setUserProgress: () => {}
});

// Create provider component
interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const [characterState, setCharacterState] = useState<'idle' | 'talking' | 'thinking' | 'excited' | 'pointing'>('idle');
  const [characterMessage, setCharacterMessage] = useState<string>('');
  const [userProgress, setUserProgress] = useState<number>(0);

  return (
    <CharacterContext.Provider 
      value={{ 
        characterState, 
        characterMessage, 
        setCharacterState, 
        setCharacterMessage,
        userProgress,
        setUserProgress
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

// Create hook for using this context
export const useCharacter = () => useContext(CharacterContext);