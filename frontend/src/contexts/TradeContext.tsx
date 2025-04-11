import React, { createContext, useState, useContext } from 'react';
import { ContextProviderProps } from '../types/components';

interface TradeContextType {
  selectedTrade: string;
  setSelectedTrade: (trade: string) => void;
}

const TradeContext = createContext<TradeContextType>({
  selectedTrade: '',
  setSelectedTrade: () => {}
});

export const useTrade = () => useContext(TradeContext);

export const TradeProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [selectedTrade, setSelectedTrade] = useState<string>('');

  return (
    <TradeContext.Provider value={{ selectedTrade, setSelectedTrade }}>
      {children}
    </TradeContext.Provider>
  );
};

export default TradeProvider;
