# Clos8 Style Sense AI: Code Documentation

## Project Overview

Clos8 Style Sense AI is a React-based web application that helps users manage their wardrobe and receive AI-powered outfit recommendations. The application allows users to:

1. Upload images of their clothing items
2. Categorize items by type (upper/bottom), category, subcategory, and color
3. Receive AI-generated outfit recommendations using Google's Gemini API
4. Plan outfits for the entire week

This document provides a detailed breakdown of the application architecture, focusing on the Supabase integration that replaced the previous localStorage implementation.

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Database/Backend**: Supabase (Auth, Database, Storage)
- **AI Integration**: Google Gemini API

## Project Structure

```
clos8-style-sense-ai/
├── src/
│   ├── components/       # UI components
│   ├── context/          # React context providers
│   ├── data/             # Static data (categories, subcategories)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page components
│   ├── services/         # Service integrations (Gemini API)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper utilities
├── public/               # Static assets
├── supabase-setup.sql    # SQL script for Supabase setup
└── SUPABASE-SETUP.md     # Supabase setup instructions
```

## Supabase Integration

The application initially used localStorage for data persistence. We've migrated it to Supabase for:

1. User authentication
2. Database storage (clothing items and outfits)
3. Image storage (clothing images)

### Supabase Client Configuration (`src/lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";

// Supabase client configuration using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Warning if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

// Create and export Supabase client for use throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Authentication System

### Authentication Context (`src/context/AuthContext.tsx`)

The AuthContext manages user authentication state and provides methods for sign-up, sign-in, and sign-out.

#### Key Components:

1. **Context and Provider Setup**:

   ```typescript
   // AuthContext definition with TypeScript interface
   interface AuthContextType {
     user: User | null;
     session: Session | null;
     loading: boolean;
     signUp: (email: string, password: string) => Promise<void>;
     signIn: (email: string, password: string) => Promise<void>;
     signOut: () => Promise<void>;
   }

   // Context creation and Provider component
   const AuthContext = createContext<AuthContextType | undefined>(undefined);
   ```

2. **Authentication State Management**:

   ```typescript
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   ```

3. **Session Initialization and Listener**:

   ```typescript
   useEffect(() => {
     // Initialize auth state by checking for existing session
     const initializeAuth = async () => {
       try {
         setLoading(true);

         // Get current session from Supabase
         const {
           data: { session: currentSession },
         } = await supabase.auth.getSession();
         setSession(currentSession);
         setUser(currentSession?.user ?? null);

         // Set up auth state listener for changes
         const {
           data: { subscription },
         } = supabase.auth.onAuthStateChange((_event, newSession) => {
           setSession(newSession);
           setUser(newSession?.user ?? null);
         });

         return () => {
           subscription.unsubscribe();
         };
       } catch (error) {
         console.error("Error initializing auth:", error);
       } finally {
         setLoading(false);
       }
     };

     initializeAuth();
   }, []);
   ```

4. **Authentication Methods**:

   ```typescript
   // Sign up with email/password
   const signUp = async (email: string, password: string) => {
     try {
       setLoading(true);

       const { data, error } = await supabase.auth.signUp({
         email,
         password,
       });

       if (error) throw error;

       // Show success toast and navigate to dashboard if successful
       toast({
         title: "Account created successfully!",
         description: "Welcome to Clos8!",
       });

       if (data.user) {
         navigate("/dashboard");
       }
     } catch (error: any) {
       // Error handling with toast notification
       toast({
         title: "Error creating account",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };

   // Similar implementation for signIn and signOut methods
   ```

## Wardrobe Management

### Wardrobe Context (`src/context/WardrobeContext.tsx`)

The WardrobeContext manages the user's clothing items and provides methods for CRUD operations.

#### Key Components:

1. **Context Definition**:

   ```typescript
   interface WardrobeContextType {
     clothingItems: ClothingItem[];
     categories: ClothingCategory[];
     subcategories: ClothingSubcategory[];
     isLoading: boolean;
     addClothingItem: (
       item: Omit<ClothingItem, "id" | "createdAt" | "user_id">
     ) => Promise<void>;
     getItemsByType: (type: ClothingType) => ClothingItem[];
     deleteClothingItem: (id: string) => Promise<void>;
   }

   export const WardrobeContext = createContext<
     WardrobeContextType | undefined
   >(undefined);
   ```

2. **State Management**:

   ```typescript
   const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
   const [categories] = useState<ClothingCategory[]>(initialCategories);
   const [subcategories] =
     useState<ClothingSubcategory[]>(initialSubcategories);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   ```

3. **Data Fetching from Supabase**:

   ```typescript
   useEffect(() => {
     const fetchWardrobeData = async () => {
       if (!user) {
         setClothingItems([]);
         setIsLoading(false);
         return;
       }

       try {
         setIsLoading(true);

         // Fetch clothing items for the current user from Supabase
         const { data, error } = await supabase
           .from("clothing_items")
           .select("*")
           .eq("user_id", user.id);

         if (error) throw error;

         if (data) {
           setClothingItems(data);
         }
       } catch (error) {
         // Error handling
         console.error("Error fetching wardrobe data:", error);
         toast({
           title: "Error loading wardrobe",
           description: "Could not load your wardrobe data",
           variant: "destructive",
         });
       } finally {
         setIsLoading(false);
       }
     };

     fetchWardrobeData();
   }, [user, toast]);
   ```

4. **CRUD Operations**:

   ```typescript
   // Add clothing item to Supabase
   const addClothingItem = async (
     item: Omit<ClothingItem, "id" | "createdAt" | "user_id">
   ) => {
     if (!user) {
       toast({
         title: "Authentication required",
         description: "Please log in to add items to your wardrobe",
         variant: "destructive",
       });
       return;
     }

     try {
       setIsLoading(true);

       const newItem = {
         ...item,
         user_id: user.id,
         createdAt: new Date().toISOString(),
       };

       // Insert new clothing item into Supabase
       const { data, error } = await supabase
         .from("clothing_items")
         .insert([newItem])
         .select();

       if (error) throw error;

       if (data && data.length > 0) {
         setClothingItems((prevItems) => [...prevItems, data[0]]);

         toast({
           title: "Item added successfully",
           description:
             "Your new clothing item has been added to your wardrobe",
         });
       }
     } catch (error: any) {
       // Error handling
     } finally {
       setIsLoading(false);
     }
   };

   // Delete clothing item from Supabase
   const deleteClothingItem = async (id: string) => {
     // Similar implementation with Supabase delete operation
   };

   // Filter items by type (upper/bottom)
   const getItemsByType = (type: ClothingType) => {
     return clothingItems.filter((item) => item.type === type);
   };
   ```

## Outfit Management

### Outfit Context (`src/context/OutfitContext.tsx`)

The OutfitContext manages the user's outfit recommendations and provides methods for generating weekly outfit plans.

#### Key Components:

1. **Context Definition**:

   ```typescript
   interface OutfitContextType {
     weeklyOutfits: Outfit[];
     isLoading: boolean;
     generateWeeklyOutfits: () => Promise<void>;
     getCurrentOutfit: () => Outfit | undefined;
     getOutfitForDay: (day: string) => Outfit | undefined;
   }
   ```

2. **Outfit Data Fetching from Supabase**:

   ```typescript
   useEffect(() => {
     const loadSavedOutfits = async () => {
       if (!user) {
         setWeeklyOutfits([]);
         setIsLoading(false);
         return;
       }

       try {
         setIsLoading(true);

         // Fetch outfits for current user from Supabase
         const { data, error } = await supabase
           .from("outfits")
           .select("*")
           .eq("user_id", user.id);

         if (error) throw error;

         if (data) {
           setWeeklyOutfits(data);
         }
       } catch (error) {
         // Error handling
       } finally {
         setIsLoading(false);
       }
     };

     loadSavedOutfits();
   }, [user, toast]);
   ```

3. **AI-Powered Outfit Generation**:

   ```typescript
   const generateWeeklyOutfits = async () => {
     // Authentication check
     if (!user) {
       // Show auth required toast
       return;
     }

     try {
       setIsLoading(true);

       // Verify wardrobe has enough items
       // ...

       // Generate outfits for each day using Gemini AI
       // For each day:
       //   1. Select a random item to start with
       //   2. Get AI suggestions using Gemini API
       //   3. Find matching items from user's wardrobe
       //   4. Create outfit combinations
       //   5. Handle fallbacks if no matches found

       // Save outfits to Supabase
       // 1. Delete existing outfits for this user
       const { error: deleteError } = await supabase
         .from("outfits")
         .delete()
         .eq("user_id", user.id);

       if (deleteError) throw deleteError;

       // 2. Insert new outfits
       const { data, error: insertError } = await supabase
         .from("outfits")
         .insert(newOutfits)
         .select();

       if (insertError) throw insertError;

       if (data) {
         setWeeklyOutfits(data);
       }

       // Success toast
     } catch (error) {
       // Error handling
     } finally {
       setIsLoading(false);
     }
   };
   ```

4. **Helper Methods**:

   ```typescript
   // Get outfit for current day
   const getCurrentOutfit = () => {
     const currentDay = new Date()
       .toLocaleDateString("en-US", { weekday: "long" })
       .toLowerCase();
     return weeklyOutfits.find((outfit) => outfit.day === currentDay);
   };

   // Get outfit for specific day
   const getOutfitForDay = (day) => {
     return weeklyOutfits.find((outfit) => outfit.day === day.toLowerCase());
   };
   ```

## Image Upload with Supabase Storage

### Image Upload Utility (`src/utils/imageUpload.ts`)

This utility handles file uploads to Supabase Storage:

```typescript
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "@/utils/uuid";

export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Generate unique filename with UUID
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `clothing/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL of the uploaded file
    const { data } = supabase.storage.from("images").getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);

    // Fallback to data URL method if Supabase upload fails
    // ...implementation of data URL fallback...
  }
};
```

## AI Integration with Google Gemini

### Gemini Service (`src/services/geminiService.ts`)

This service integrates with Google's Gemini API to generate outfit recommendations:

```typescript
// Interface definitions for API responses
export interface MatchResponse {
  suggestions: string[];
}

// Sends item data to Gemini API and gets outfit suggestions
export const getOutfitSuggestions = async (
  item: ClothingItem,
  categoryMapping: Record<string, string>,
  subcategoryMapping: Record<string, string>
): Promise<MatchResponse | null> => {
  try {
    // Check if Gemini API key is available
    const apiKey = localStorage.getItem("gemini-api-key");

    if (!apiKey) {
      // Use mock implementation if API key is not available
      return getMockSuggestions(item);
    }

    // Prepare item description for the AI prompt
    const itemType = item.type;
    const category = categoryMapping[item.categoryId] || "Unknown";
    const subcategory = subcategoryMapping[item.subcategoryId] || "Unknown";
    const color = item.color;

    // Create AI prompt for outfit suggestions
    const prompt = `...`;

    // Make API request to Gemini
    // Process response
    // Return suggestions
  } catch (error) {
    console.error("Error getting outfit suggestions:", error);
    return null;
  }
};

// Helper function to match suggestions with available items
export const findMatchingItems = (
  suggestions: string[],
  availableItems: ClothingItem[]
): ClothingItem[] => {
  if (!suggestions || !availableItems) return [];

  // Match algorithm implementation
  // ...
};
```

## Routes and Pages

The application uses React Router for navigation and has the following main pages:

1. **Landing Page** (`src/pages/LandingPage.tsx`): Introduction for new users
2. **Auth Pages** (`src/pages/AuthPages.tsx`): Login and signup functionality
3. **Dashboard** (`src/pages/DashboardPage.tsx`): Overview of wardrobe statistics
4. **Wardrobe Page** (`src/pages/WardrobePage.tsx`): Catalog and manage clothing items
5. **Outfits Page** (`src/pages/OutfitsPage.tsx`): View and generate outfit recommendations
6. **Settings Page** (`src/pages/SettingsPage.jsx`): App configuration, including Gemini API setup
7. **About Page** (`src/pages/AboutPage.tsx`): Information about the app

## Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Supabase Database Schema

The application uses two main tables in Supabase:

### 1. clothing_items Table

```sql
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  imageUrl TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upper', 'bottom')),
  categoryId TEXT NOT NULL,
  subcategoryId TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### 2. outfits Table

```sql
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  upper JSONB NOT NULL, -- JSON object representing upper ClothingItem
  bottom JSONB NOT NULL, -- JSON object representing bottom ClothingItem
  day TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Row-Level Security (RLS)

Both tables have Row-Level Security enabled to ensure users can only access their own data:

```sql
-- Policy example for clothing_items table
CREATE POLICY "Users can view their own clothing items"
  ON public.clothing_items
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Supabase Storage Configuration

The application uses a storage bucket for clothing images:

```sql
-- Create storage bucket for clothing images
CREATE BUCKET IF NOT EXISTS images;

-- Enable public access to the images bucket
UPDATE storage.buckets
SET public = true
WHERE name = 'images';
```

## TypeScript Types

The application uses TypeScript for type safety:

```typescript
// src/types/index.ts
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
  name?: string;
  imageUrl: string;
  type: ClothingType;
  categoryId: string;
  subcategoryId: string;
  color: string;
  createdAt: string;
  user_id?: string; // Added for Supabase integration
}

export interface Outfit {
  id?: string; // Optional as Supabase generates this
  upper: ClothingItem;
  bottom: ClothingItem;
  day: string; // 'monday', 'tuesday', etc.
  createdAt: string;
  user_id?: string; // Added for Supabase integration
}
```

## Environment Variables

The application uses environment variables for Supabase configuration:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Conclusion

The Clos8 Style Sense AI application has been successfully migrated from localStorage to Supabase, providing:

1. **Persistent Authentication**: Users can log in across devices and sessions
2. **Secure Data Storage**: Database tables with Row-Level Security
3. **Cloud Image Storage**: Images stored in Supabase Storage
4. **Improved Scalability**: Ready for production use with many users

The code is structured in a modular way with clear separation of concerns:

- Context providers for state management
- Service modules for external API integration
- Utility functions for common tasks
- React components for UI rendering

The migration was completed without changing the core functionality of the application, maintaining the same user experience while significantly improving the backend infrastructure.
