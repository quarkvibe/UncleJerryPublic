import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TradeContextType {
  selectedTrade: string;
  setSelectedTrade: (trade: string) => void;
}

const TradeContext = createContext<TradeContextType>({
  selectedTrade: '',
  setSelectedTrade: () => {}
});

export const useTrade = () => useContext(TradeContext);

interface TradeProviderProps {
  children: ReactNode;
}

export const TradeProvider: React.FC<TradeProviderProps> = ({ children }) => {
  const [selectedTrade, setSelectedTrade] = useState<string>('');

  return (
    <TradeContext.Provider value={{ selectedTrade, setSelectedTrade }}>
      {children}
    </TradeContext.Provider>
  );
};

export default TradeProvider;
