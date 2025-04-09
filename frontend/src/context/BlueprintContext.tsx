import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types for our context
interface Blueprint {
  id: string;
  name: string;
  url: string;
  type: string;
  scale?: string;
  uploadDate: Date;
}

interface BlueprintContextType {
  blueprints: Blueprint[];
  selectedBlueprints: Blueprint[];
  addBlueprint: (blueprint: Blueprint) => void;
  removeBlueprint: (id: string) => void;
  selectBlueprint: (id: string) => void;
  deselectBlueprint: (id: string) => void;
  clearSelectedBlueprints: () => void;
}

// Create the context
export const BlueprintContext = createContext<BlueprintContextType>({
  blueprints: [],
  selectedBlueprints: [],
  addBlueprint: () => {},
  removeBlueprint: () => {},
  selectBlueprint: () => {},
  deselectBlueprint: () => {},
  clearSelectedBlueprints: () => {}
});

// Create provider component
interface BlueprintProviderProps {
  children: ReactNode;
}

export const BlueprintProvider: React.FC<BlueprintProviderProps> = ({ children }) => {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprints, setSelectedBlueprints] = useState<Blueprint[]>([]);

  const addBlueprint = (blueprint: Blueprint) => {
    setBlueprints(prev => [...prev, blueprint]);
  };

  const removeBlueprint = (id: string) => {
    setBlueprints(prev => prev.filter(blueprint => blueprint.id !== id));
    setSelectedBlueprints(prev => prev.filter(blueprint => blueprint.id !== id));
  };

  const selectBlueprint = (id: string) => {
    const blueprint = blueprints.find(bp => bp.id === id);
    if (blueprint && !selectedBlueprints.some(bp => bp.id === id)) {
      setSelectedBlueprints(prev => [...prev, blueprint]);
    }
  };

  const deselectBlueprint = (id: string) => {
    setSelectedBlueprints(prev => prev.filter(blueprint => blueprint.id !== id));
  };

  const clearSelectedBlueprints = () => {
    setSelectedBlueprints([]);
  };

  return (
    <BlueprintContext.Provider 
      value={{ 
        blueprints, 
        selectedBlueprints, 
        addBlueprint, 
        removeBlueprint, 
        selectBlueprint, 
        deselectBlueprint, 
        clearSelectedBlueprints 
      }}
    >
      {children}
    </BlueprintContext.Provider>
  );
};

// Create hook for using this context
export const useBlueprints = () => useContext(BlueprintContext);