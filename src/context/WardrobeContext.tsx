
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem, ClothingType, ClothingCategory, ClothingSubcategory } from '@/types';
import { v4 as uuidv4 } from '@/utils/uuid';
import { useToast } from '@/hooks/use-toast';

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  categories: ClothingCategory[];
  subcategories: ClothingSubcategory[];
  isLoading: boolean;
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => Promise<void>;
  getItemsByType: (type: ClothingType) => ClothingItem[];
  deleteClothingItem: (id: string) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

// Sample data to start with
const initialCategories: ClothingCategory[] = [
  { id: 'cat-1', name: 'T-Shirt', type: 'upper' },
  { id: 'cat-2', name: 'Shirt', type: 'upper' },
  { id: 'cat-3', name: 'Sweater', type: 'upper' },
  { id: 'cat-4', name: 'Jeans', type: 'bottom' },
  { id: 'cat-5', name: 'Pants', type: 'bottom' },
  { id: 'cat-6', name: 'Shorts', type: 'bottom' },
];

const initialSubcategories: ClothingSubcategory[] = [
  { id: 'subcat-1', name: 'Plain', categoryId: 'cat-1' },
  { id: 'subcat-2', name: 'Graphic', categoryId: 'cat-1' },
  { id: 'subcat-3', name: 'Polo', categoryId: 'cat-2' },
  { id: 'subcat-4', name: 'Button-up', categoryId: 'cat-2' },
  { id: 'subcat-5', name: 'Hoodie', categoryId: 'cat-3' },
  { id: 'subcat-6', name: 'Cardigan', categoryId: 'cat-3' },
  { id: 'subcat-7', name: 'Slim', categoryId: 'cat-4' },
  { id: 'subcat-8', name: 'Regular', categoryId: 'cat-4' },
  { id: 'subcat-9', name: 'Chino', categoryId: 'cat-5' },
  { id: 'subcat-10', name: 'Dress', categoryId: 'cat-5' },
  { id: 'subcat-11', name: 'Cargo', categoryId: 'cat-6' },
  { id: 'subcat-12', name: 'Athletic', categoryId: 'cat-6' },
];

// Sample clothing items
const initialClothingItems: ClothingItem[] = [
  {
    id: 'item-1',
    name: 'White T-Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
    type: 'upper',
    categoryId: 'cat-1',
    subcategoryId: 'subcat-1',
    color: '#FFFFFF',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    name: 'Blue Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&auto=format',
    type: 'bottom',
    categoryId: 'cat-4',
    subcategoryId: 'subcat-7',
    color: '#0000FF',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    name: 'Black Sweater',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format',
    type: 'upper',
    categoryId: 'cat-3',
    subcategoryId: 'subcat-6',
    color: '#000000',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    name: 'Khaki Pants',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format',
    type: 'bottom',
    categoryId: 'cat-5',
    subcategoryId: 'subcat-9',
    color: '#F0E68C',
    createdAt: new Date().toISOString(),
  },
];

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

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
