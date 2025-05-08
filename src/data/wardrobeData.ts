
import { ClothingItem, ClothingCategory, ClothingSubcategory } from '@/types';

// Sample data to start with
export const initialCategories: ClothingCategory[] = [
  { id: 'cat-1', name: 'T-Shirt', type: 'upper' },
  { id: 'cat-2', name: 'Shirt', type: 'upper' },
  { id: 'cat-3', name: 'Sweater', type: 'upper' },
  { id: 'cat-4', name: 'Jeans', type: 'bottom' },
  { id: 'cat-5', name: 'Pants', type: 'bottom' },
  { id: 'cat-6', name: 'Shorts', type: 'bottom' },
];

export const initialSubcategories: ClothingSubcategory[] = [
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
export const initialClothingItems: ClothingItem[] = [
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
