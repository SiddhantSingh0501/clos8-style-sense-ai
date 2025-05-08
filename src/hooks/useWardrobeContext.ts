
import { useContext } from 'react';
import { WardrobeContext } from '@/context/WardrobeContext';

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
