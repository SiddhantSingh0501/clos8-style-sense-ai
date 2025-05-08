
export type ClothingType = 'upper' | 'bottom';

export type ClothingCategory = {
  id: string;
  name: string;
  type: ClothingType;
};

export type ClothingSubcategory = {
  id: string;
  name: string;
  categoryId: string;
};

export interface ClothingItem {
  id: string;
  name?: string;
  imageUrl: string;
  type: ClothingType;
  categoryId: string;
  subcategoryId: string;
  color: string;
  createdAt: string;
}

export interface Outfit {
  id: string;
  upper: ClothingItem;
  bottom: ClothingItem;
  day: string; // 'monday', 'tuesday', etc.
  createdAt: string;
}

export interface WeeklyOutfitPlan {
  id: string;
  outfits: Outfit[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
