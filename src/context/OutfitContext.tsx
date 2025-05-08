
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Outfit, ClothingItem } from '@/types';
import { useWardrobe } from './WardrobeContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from '@/utils/uuid';

interface OutfitContextType {
  weeklyOutfits: Outfit[];
  isLoading: boolean;
  generateWeeklyOutfits: () => Promise<void>;
  getCurrentOutfit: () => Outfit | undefined;
  getOutfitForDay: (day: string) => Outfit | undefined;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function OutfitProvider({ children }: { children: ReactNode }) {
  const [weeklyOutfits, setWeeklyOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { clothingItems, getItemsByType } = useWardrobe();
  const { toast } = useToast();

  useEffect(() => {
    const loadSavedOutfits = () => {
      try {
        const savedOutfits = localStorage.getItem('clos8-outfits');
        if (savedOutfits) {
          setWeeklyOutfits(JSON.parse(savedOutfits));
        }
      } catch (error) {
        console.error('Error loading saved outfits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedOutfits();
  }, []);
  
  // Function to simulate Gemini AI outfit matching - this would call our actual Gemini API in production
  const matchOutfitWithAI = async (upperItem: ClothingItem, bottomItems: ClothingItem[]) => {
    // In production, we would send a request to our Gemini API endpoint
    // For now, we'll simulate a response by randomly selecting a compatible bottom
    return new Promise<ClothingItem>((resolve) => {
      setTimeout(() => {
        // Simple randomization for now
        const randomIndex = Math.floor(Math.random() * bottomItems.length);
        resolve(bottomItems[randomIndex]);
      }, 500);
    });
  };

  const generateWeeklyOutfits = async () => {
    try {
      setIsLoading(true);
      
      if (clothingItems.length === 0) {
        toast({
          title: 'Not enough clothing items',
          description: 'Please add some clothing items to your wardrobe first',
          variant: 'destructive',
        });
        return;
      }
      
      const upperItems = getItemsByType('upper');
      const bottomItems = getItemsByType('bottom');
      
      if (upperItems.length === 0 || bottomItems.length === 0) {
        toast({
          title: 'Incomplete wardrobe',
          description: 'Please add both upper and bottom clothing items to your wardrobe',
          variant: 'destructive',
        });
        return;
      }
      
      // Generate an outfit for each day of the week
      const newOutfits: Outfit[] = [];
      
      for (const day of DAYS_OF_WEEK) {
        // Randomly select an upper item
        const randomUpperIndex = Math.floor(Math.random() * upperItems.length);
        const upperItem = upperItems[randomUpperIndex];
        
        // Use our "AI" function to find a matching bottom
        const matchedBottomItem = await matchOutfitWithAI(upperItem, bottomItems);
        
        newOutfits.push({
          id: uuidv4(),
          upper: upperItem,
          bottom: matchedBottomItem,
          day: day,
          createdAt: new Date().toISOString(),
        });
      }
      
      setWeeklyOutfits(newOutfits);
      localStorage.setItem('clos8-outfits', JSON.stringify(newOutfits));
      
      toast({
        title: 'Weekly outfits generated!',
        description: 'Your weekly outfit plan is ready',
      });
    } catch (error) {
      console.error('Error generating outfits:', error);
      toast({
        title: 'Error generating outfits',
        description: 'Could not create your weekly outfit plan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentOutfit = () => {
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    return weeklyOutfits.find(outfit => outfit.day === currentDay);
  };

  const getOutfitForDay = (day: string) => {
    return weeklyOutfits.find(outfit => outfit.day === day.toLowerCase());
  };

  return (
    <OutfitContext.Provider
      value={{
        weeklyOutfits,
        isLoading,
        generateWeeklyOutfits,
        getCurrentOutfit,
        getOutfitForDay,
      }}
    >
      {children}
    </OutfitContext.Provider>
  );
}

export const useOutfit = () => {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error('useOutfit must be used within an OutfitProvider');
  }
  return context;
};
