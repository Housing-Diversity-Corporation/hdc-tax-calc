import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LayerHierarchyContextType {
  layerHierarchy: Map<string, number>;
  setLayerPriority: (layerId: string, priority: number) => void;
  getLayerPriority: (layerId: string) => number;
  resetHierarchy: () => void;
}

const LayerHierarchyContext = createContext<LayerHierarchyContextType | undefined>(undefined);

export const useLayerHierarchy = () => {
  const context = useContext(LayerHierarchyContext);
  if (!context) {
    throw new Error('useLayerHierarchy must be used within a LayerHierarchyProvider');
  }
  return context;
};

interface LayerHierarchyProviderProps {
  children: ReactNode;
}

export const LayerHierarchyProvider: React.FC<LayerHierarchyProviderProps> = ({ children }) => {
  const [layerHierarchy, setLayerHierarchy] = useState<Map<string, number>>(new Map());

  const setLayerPriority = useCallback((layerId: string, priority: number) => {
    console.log('📊 [CONTEXT] setLayerPriority called for', layerId, 'with priority', priority);
    setLayerHierarchy(prev => {
      const newMap = new Map(prev);
      newMap.set(layerId, priority);
      console.log('📊 [CONTEXT] Updated layerHierarchy:', Array.from(newMap.entries()));
      return newMap;
    });
  }, []);

  const getLayerPriority = useCallback((layerId: string): number => {
    return layerHierarchy.get(layerId) || 0;
  }, [layerHierarchy]);

  const resetHierarchy = useCallback(() => {
    setLayerHierarchy(new Map());
  }, []);

  const value: LayerHierarchyContextType = {
    layerHierarchy,
    setLayerPriority,
    getLayerPriority,
    resetHierarchy
  };

  return (
    <LayerHierarchyContext.Provider value={value}>
      {children}
    </LayerHierarchyContext.Provider>
  );
};
