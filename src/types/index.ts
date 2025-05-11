export type ClothingType = "upper" | "bottom";

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
  name: string;
  image_url: string;
  type: 'upper' | 'bottom';
  category_id: string;
  subcategory_id: string;
  color: string;
  created_at: string;
  user_id: string;
  favorite?: boolean; // Flag for favorite items
  seasons?: string[]; // Seasons when item can be worn
  lastWorn?: string; // Date when item was last worn
  metadata?: ClothingItemMetadata; // Additional metadata
}

// Additional metadata for clothing items
export interface ClothingItemMetadata {
  brand?: string;
  purchaseDate?: string;
  price?: number;
  notes?: string;
  tags?: string[];
  weatherConditions?: WeatherCondition[];
}

export type WeatherCondition =
  | "hot"
  | "warm"
  | "cool"
  | "cold"
  | "rainy"
  | "snowy";
export type Season = "spring" | "summer" | "fall" | "winter";

export interface Outfit {
  id?: string; // Optional for creation
  upper: ClothingItem;
  bottom: ClothingItem;
  day: DayOfWeek; // Typed day of week
  createdAt?: string;
  user_id?: string; // Added for Supabase
  favorite?: boolean; // Flag for favorite outfits
  occasion?: string; // What the outfit is for
  rating?: number; // User rating of outfit
  weatherTags?: WeatherCondition[]; // Weather conditions
}

export interface WeeklyOutfitPlan {
  id: string;
  outfits: Outfit[];
  createdAt: string;
  user_id?: string; // Added for Supabase
  startDate?: string; // Start date of the week
  endDate?: string; // End date of the week
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferences?: UserPreferences;
  metadata?: UserMetadata;
  createdAt?: string;
  lastLogin?: string;
}

// User preferences for personalization
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  suggestionsFrequency: "daily" | "weekly" | "never";
  preferredCategories?: string[]; // IDs of preferred categories
  preferredColors?: string[]; // Preferred colors
  autoSaveOutfits?: boolean;
}

// Additional user metadata
export interface UserMetadata {
  profileComplete: boolean;
  onboardingComplete: boolean;
  wardrobeSize: number;
  lastGeneratedOutfit?: string; // Date
}

// New type definitions for wardrobe management
export interface WardrobeFilter {
  searchTerm: string;
  type: ClothingType | null;
  categoryId: string | null;
  subcategoryId: string | null;
  color: string | null;
  favorite?: boolean | null;
  season?: Season | null;
}

export interface SortOption {
  field: keyof ClothingItem;
  direction: "asc" | "desc";
}

// Pagination options
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Type for AI-generated outfit suggestion cache
export interface OutfitSuggestionCache {
  itemId: string;
  suggestions: string[];
  timestamp: number; // Unix timestamp for cache expiration check
}

// Types for Supabase responses
export interface SupabaseClothingResponse {
  data: ClothingItem[] | null;
  error: Error | null;
  count?: number;
}

export interface SupabaseOutfitResponse {
  data: Outfit[] | null;
  error: Error | null;
  count?: number;
}

export interface SupabaseDeleteResponse {
  error: Error | null;
}

export interface SupabaseSingleResponse<T> {
  data: T | null;
  error: Error | null;
}

// Type for subscription event handlers
export interface SubscriptionHandlers<T> {
  onInsert?: (item: T) => void;
  onUpdate?: (item: T) => void;
  onDelete?: (item: T) => void;
}

// Type for image upload response
export interface ImageUploadResult {
  url: string;
  error: Error | null;
}

// Types for tracking upload progress
export interface UploadProgress {
  progress: number; // 0-100
  isUploading: boolean;
  error: Error | null;
}

// Days of week type
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// API Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

// Real-time subscription status
export type SubscriptionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

// Authentication states
export type AuthState = "authenticated" | "unauthenticated" | "loading";

// Color palette type
export interface ColorPalette {
  name: string;
  colors: string[];
}

// Weekly weather forecast for outfit recommendations
export interface WeatherForecast {
  day: DayOfWeek;
  condition: WeatherCondition;
  temperature: number;
  precipitation: number;
}

// Outfit generation prompt options
export interface OutfitPromptOptions {
  occasion?: string;
  weather?: WeatherCondition;
  preferences?: string[];
  avoidItems?: string[]; // IDs of items to avoid
}
