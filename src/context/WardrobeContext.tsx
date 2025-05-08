
import { createContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem, ClothingType, ClothingCategory, ClothingSubcategory } from '@/types';
import { v4 as uuidv4 } from '@/utils/uuid';
import { useToast } from '@/hooks/use-toast';
import { initialCategories, initialSubcategories, initialClothingItems } from '@/data/wardrobeData';

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  categories: ClothingCategory[];
  subcategories: ClothingSubcategory[];
  isLoading: boolean;
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => Promise<void>;
  getItemsByType: (type: ClothingType) => ClothingItem[];
  deleteClothingItem: (id: string) => Promise<void>;
}

export const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [categories] = useState<ClothingCategory[]>(initialCategories);
  const [subcategories] = useState<ClothingSubcategory[]>(initialSubcategories);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchWardrobeData = async () => {
      try {
        // In a real implementation, we would fetch from Supabase here
        // For now, we'll use our mock data
        const storedItems = localStorage.getItem('clos8-wardrobe');
        if (storedItems) {
          setClothingItems(JSON.parse(storedItems));
        } else {
          setClothingItems(initialClothingItems);
          localStorage.setItem('clos8-wardrobe', JSON.stringify(initialClothingItems));
        }
      } catch (error) {
        console.error('Error fetching wardrobe data:', error);
        toast({
          title: 'Error loading wardrobe',
          description: 'Could not load your wardrobe data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWardrobeData();
  }, [toast]);

  const addClothingItem = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      // In a real implementation, we would save to Supabase here
      const newItem: ClothingItem = {
        ...item,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };

      const updatedItems = [...clothingItems, newItem];
      setClothingItems(updatedItems);
      localStorage.setItem('clos8-wardrobe', JSON.stringify(updatedItems));
      
      toast({
        title: 'Item added successfully',
        description: 'Your new clothing item has been added to your wardrobe',
      });
    } catch (error) {
      console.error('Error adding clothing item:', error);
      toast({
        title: 'Error adding item',
        description: 'Could not add your clothing item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getItemsByType = (type: ClothingType) => {
    return clothingItems.filter((item) => item.type === type);
  };

  const deleteClothingItem = async (id: string) => {
    try {
      setIsLoading(true);
      // In a real implementation, we would delete from Supabase here
      const updatedItems = clothingItems.filter((item) => item.id !== id);
      setClothingItems(updatedItems);
      localStorage.setItem('clos8-wardrobe', JSON.stringify(updatedItems));
      
      toast({
        title: 'Item deleted successfully',
        description: 'The clothing item has been removed from your wardrobe',
      });
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      toast({
        title: 'Error deleting item',
        description: 'Could not delete the clothing item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WardrobeContext.Provider
      value={{
        clothingItems,
        categories,
        subcategories,
        isLoading,
        addClothingItem,
        getItemsByType,
        deleteClothingItem,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

// Export moved to a separate hook file
export { useWardrobe } from '@/hooks/useWardrobeContext';
