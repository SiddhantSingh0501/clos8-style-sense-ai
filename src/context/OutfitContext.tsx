
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Outfit, ClothingItem } from '@/types';
import { useWardrobe } from './WardrobeContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from '@/utils/uuid';
import { getOutfitSuggestions, findMatchingItems } from '@/services/geminiService';

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
  const { clothingItems, getItemsByType, categories, subcategories } = useWardrobe();
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
  
  // Get category and subcategory names by their IDs
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };
  
  const getSubcategoryName = (subcategoryId) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    return subcategory ? subcategory.name : 'Unknown';
  };
  
  // Create a mapping for easier access
  const createMappings = () => {
    const categoryMapping = {};
    const subcategoryMapping = {};
    
    categories.forEach(category => {
      categoryMapping[category.id] = category.name;
    });
    
    subcategories.forEach(subcategory => {
      subcategoryMapping[subcategory.id] = subcategory.name;
    });
    
    return { categoryMapping, subcategoryMapping };
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
      
      // Create mappings for category and subcategory names
      const { categoryMapping, subcategoryMapping } = createMappings();
      
      // Generate an outfit for each day of the week
      const newOutfits = [];
      
      for (const day of DAYS_OF_WEEK) {
        // Select a random upper or bottom item to start with
        const startWithUpper = Math.random() > 0.5;
        const items = startWithUpper ? upperItems : bottomItems;
        const randomIndex = Math.floor(Math.random() * items.length);
        const selectedItem = items[randomIndex];
        
        try {
          // Get AI suggestions from the Gemini service
          const suggestions = await getOutfitSuggestions(
            selectedItem, 
            categoryMapping, 
            subcategoryMapping
          );
          
          // Find matching items from the wardrobe based on AI suggestions
          const availableItems = startWithUpper ? bottomItems : upperItems;
          const matchedItems = findMatchingItems(suggestions.suggestions, availableItems);
          
          // If we found a match, create the outfit
          if (matchedItems.length > 0) {
            const matchedItem = matchedItems[0]; // Take the first match
            
            newOutfits.push({
              id: uuidv4(),
              upper: startWithUpper ? selectedItem : matchedItem,
              bottom: startWithUpper ? matchedItem : selectedItem,
              day: day,
              createdAt: new Date().toISOString(),
            });
          } else {
            // Fallback if no match is found - select a random item
            const randomComplement = availableItems[Math.floor(Math.random() * availableItems.length)];
            
            newOutfits.push({
              id: uuidv4(),
              upper: startWithUpper ? selectedItem : randomComplement,
              bottom: startWithUpper ? randomComplement : selectedItem,
              day: day,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`Error generating outfit for ${day}:`, error);
          
          // Fallback on error - create a random pairing
          const randomUpper = upperItems[Math.floor(Math.random() * upperItems.length)];
          const randomBottom = bottomItems[Math.floor(Math.random() * bottomItems.length)];
          
          newOutfits.push({
            id: uuidv4(),
            upper: randomUpper,
            bottom: randomBottom,
            day: day,
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      setWeeklyOutfits(newOutfits);
      localStorage.setItem('clos8-outfits', JSON.stringify(newOutfits));
      
      toast({
        title: 'Weekly outfits generated!',
        description: 'Your AI-powered weekly outfit plan is ready',
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
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return weeklyOutfits.find(outfit => outfit.day === currentDay);
  };

  const getOutfitForDay = (day) => {
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
