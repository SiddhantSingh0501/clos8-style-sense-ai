import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { 
  Outfit, 
  ClothingItem, 
  DayOfWeek,
  OutfitSuggestionCache
} from "@/types";
import { useWardrobe } from "@/hooks/useWardrobeContext";
import { useToast } from "@/hooks/use-toast";
import {
  getOutfitSuggestions,
  findMatchingItems,
  MatchResponse,
} from "@/services/geminiService";
import { supabase, subscribeToTable } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface OutfitContextType {
  weeklyOutfits: Outfit[];
  isLoading: boolean;
  isGenerating: boolean; // Separate state for generation process
  generateWeeklyOutfits: () => Promise<void>;
  getCurrentOutfit: () => Outfit | undefined;
  getOutfitForDay: (day: DayOfWeek) => Outfit | undefined;
  regenerateOutfitForDay: (day: DayOfWeek) => Promise<void>;
  resetCache: () => void;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function OutfitProvider({ children }: { children: ReactNode }) {
  const [weeklyOutfits, setWeeklyOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [suggestionCache, setSuggestionCache] = useState<OutfitSuggestionCache[]>([]);
  const { clothingItems, getItemsByType, categories, subcategories } =
    useWardrobe();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use a ref to track generation requests to prevent multiple simultaneous generations
  const generationInProgress = useRef<boolean>(false);

  // Load cached suggestions from localStorage
  useEffect(() => {
    try {
      if (user) {
        const cachedSuggestions = localStorage.getItem(`outfit-suggestions-${user.id}`);
        if (cachedSuggestions) {
          const parsedCache = JSON.parse(cachedSuggestions) as OutfitSuggestionCache[];
          
          // Filter out expired cache entries
          const now = Date.now();
          const validCacheEntries = parsedCache.filter(
            entry => (now - entry.timestamp) < CACHE_DURATION
          );
          
          setSuggestionCache(validCacheEntries);
          
          // Clean up expired entries if any were removed
          if (validCacheEntries.length < parsedCache.length) {
            localStorage.setItem(
              `outfit-suggestions-${user.id}`, 
              JSON.stringify(validCacheEntries)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading suggestion cache:", error);
      // Clear cache if there's an error
      localStorage.removeItem(`outfit-suggestions-${user.id}`);
    }
  }, [user]);

  // Save cache to localStorage when it changes
  useEffect(() => {
    if (user && suggestionCache.length > 0) {
      localStorage.setItem(
        `outfit-suggestions-${user.id}`, 
        JSON.stringify(suggestionCache)
      );
    }
  }, [suggestionCache, user]);

  // Load saved outfits from Supabase
  const loadSavedOutfits = useCallback(async () => {
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
        .eq("user_id", user.id)
        .order("day", { ascending: true });

      if (error) throw error;

      if (data) {
        // Validate outfit data structure
        const validatedOutfits = data.filter((outfit) => {
          return (
            outfit &&
            outfit.upper && 
            outfit.bottom && 
            outfit.day && 
            DAYS_OF_WEEK.includes(outfit.day as DayOfWeek)
          );
        });
        
        setWeeklyOutfits(validatedOutfits);
      }
    } catch (error) {
      console.error("Error loading saved outfits:", error);
      toast({
        title: "Error loading outfits",
        description: "Could not load your saved outfits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadSavedOutfits();
    
    // Set up real-time subscription to outfits table
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      unsubscribe = subscribeToTable<Outfit>(
        "outfits",
        (newOutfit) => {
          // Handle new outfit - only if it belongs to the current user
          if (newOutfit.user_id === user.id) {
            setWeeklyOutfits(prev => {
              // Check if outfit for this day already exists
              const existingIndex = prev.findIndex(outfit => outfit.day === newOutfit.day);
              if (existingIndex >= 0) {
                // Replace the existing outfit
                const updated = [...prev];
                updated[existingIndex] = newOutfit;
                return updated;
              } else {
                // Add the new outfit
                return [...prev, newOutfit];
              }
            });
          }
        },
        (updatedOutfit) => {
          // Handle updated outfit
          if (updatedOutfit.user_id === user.id) {
            setWeeklyOutfits(prev => 
              prev.map(outfit => outfit.id === updatedOutfit.id ? updatedOutfit : outfit)
            );
          }
        },
        (deletedOutfit) => {
          // Handle deleted outfit
          if (deletedOutfit.user_id === user.id) {
            setWeeklyOutfits(prev => 
              prev.filter(outfit => outfit.id !== deletedOutfit.id)
            );
          }
        },
        user.id
      );
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadSavedOutfits, user]);

  // Get category and subcategory names by their IDs
  const getCategoryName = useCallback((categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  }, [categories]);

  const getSubcategoryName = useCallback((subcategoryId: string): string => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    return subcategory ? subcategory.name : "Unknown";
  }, [subcategories]);

  // Create a mapping for easier access
  const createMappings = useCallback(() => {
    const categoryMapping: Record<string, string> = {};
    const subcategoryMapping: Record<string, string> = {};

    categories.forEach((category) => {
      categoryMapping[category.id] = category.name;
    });

    subcategories.forEach((subcategory) => {
      subcategoryMapping[subcategory.id] = subcategory.name;
    });

    return { categoryMapping, subcategoryMapping };
  }, [categories, subcategories]);

  // Check the suggestion cache for a specific item
  const checkSuggestionCache = useCallback((itemId: string): string[] | null => {
    const cacheEntry = suggestionCache.find(entry => entry.itemId === itemId);
    
    if (cacheEntry) {
      // Check if the entry is still valid (not expired)
      const now = Date.now();
      if ((now - cacheEntry.timestamp) < CACHE_DURATION) {
        return cacheEntry.suggestions;
      }
    }
    
    return null;
  }, [suggestionCache]);

  // Add a suggestion to the cache
  const addToSuggestionCache = useCallback((itemId: string, suggestions: string[]) => {
    setSuggestionCache(prevCache => {
      // Remove any existing entry for this item
      const filteredCache = prevCache.filter(entry => entry.itemId !== itemId);
      
      // Add the new entry
      return [...filteredCache, {
        itemId,
        suggestions,
        timestamp: Date.now()
      }];
    });
  }, []);

  // Reset the suggestion cache
  const resetCache = useCallback(() => {
    setSuggestionCache([]);
    if (user) {
      localStorage.removeItem(`outfit-suggestions-${user.id}`);
    }
  }, [user]);

  // Get outfit suggestions, using cache when available
  const getSuggestions = useCallback(async (
    item: ClothingItem, 
    categoryMapping: Record<string, string>, 
    subcategoryMapping: Record<string, string>
  ): Promise<string[]> => {
    // Check cache first
    const cachedSuggestions = checkSuggestionCache(item.id);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }
    
    // If not in cache, get from API
    try {
      const response = await getOutfitSuggestions(
        item,
        categoryMapping,
        subcategoryMapping
      ) as MatchResponse;
      
      if (response && response.suggestions) {
        // Convert suggestions to strings
        const suggestionStrings = response.suggestions.map(
          suggestion => JSON.stringify(suggestion)
        );
        
        // Add to cache
        addToSuggestionCache(item.id, suggestionStrings);
        
        return suggestionStrings;
      }
    } catch (error) {
      console.error("Error getting outfit suggestions:", error);
      throw error;
    }
    
    return [];
  }, [checkSuggestionCache, addToSuggestionCache]);

  // Generate an outfit for a specific day
  const generateOutfitForDay = useCallback(async (
    day: DayOfWeek,
    upperItems: ClothingItem[],
    bottomItems: ClothingItem[],
    categoryMapping: Record<string, string>,
    subcategoryMapping: Record<string, string>
  ): Promise<Outfit> => {
    // Select a random upper or bottom item to start with
    const startWithUpper = Math.random() > 0.5;
    const items = startWithUpper ? upperItems : bottomItems;
    
    // Ensure we have items to select from
    if (items.length === 0) {
      throw new Error(`No ${startWithUpper ? 'upper' : 'bottom'} items available`);
    }
    
    const randomIndex = Math.floor(Math.random() * items.length);
    const selectedItem = items[randomIndex];

    try {
      // Get suggestions from cache or API
      const suggestionStrings = await getSuggestions(
        selectedItem, 
        categoryMapping, 
        subcategoryMapping
      );
      
      // Parse suggestions back to objects
      const suggestions = suggestionStrings.map(str => {
        try {
          return JSON.parse(str);
        } catch (e) {
          console.error("Error parsing suggestion:", e);
          return null;
        }
      }).filter(Boolean);
      
      // Find matching items from the wardrobe based on suggestions
      const availableItems = startWithUpper ? bottomItems : upperItems;
      const matchedItems = findMatchingItems(suggestions, availableItems);

      // If we found a match, create the outfit
      if (matchedItems.length > 0) {
        const matchedItem = matchedItems[0]; // Take the first match

        return {
          upper: startWithUpper ? selectedItem : matchedItem,
          bottom: startWithUpper ? matchedItem : selectedItem,
          day: day,
          createdAt: new Date().toISOString(),
          user_id: user?.id
        };
      } else {
        // Fallback if no match is found - select a random item
        if (availableItems.length === 0) {
          throw new Error(`No ${startWithUpper ? 'bottom' : 'upper'} items available`);
        }
        
        const randomComplement =
          availableItems[Math.floor(Math.random() * availableItems.length)];

        return {
          upper: startWithUpper ? selectedItem : randomComplement,
          bottom: startWithUpper ? randomComplement : selectedItem,
          day: day,
          createdAt: new Date().toISOString(),
          user_id: user?.id
        };
      }
    } catch (error) {
      console.error(`Error generating outfit for ${day}:`, error);

      // Fallback on error - create a random pairing
      if (upperItems.length === 0 || bottomItems.length === 0) {
        throw new Error("Not enough items to create an outfit");
      }
      
      const randomUpper =
        upperItems[Math.floor(Math.random() * upperItems.length)];
      const randomBottom =
        bottomItems[Math.floor(Math.random() * bottomItems.length)];

      return {
        upper: randomUpper,
        bottom: randomBottom,
        day: day,
        createdAt: new Date().toISOString(),
        user_id: user?.id
      };
    }
  }, [getSuggestions, user]);

  // Generate weekly outfits
  const generateWeeklyOutfits = async () => {
    // Check authentication
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate outfits",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent multiple simultaneous generations
    if (generationInProgress.current) {
      toast({
        title: "Generation in progress",
        description: "Please wait for the current generation to complete",
      });
      return;
    }

    try {
      generationInProgress.current = true;
      setIsGenerating(true);

      // Verify we have enough clothing items
      if (clothingItems.length === 0) {
        toast({
          title: "Not enough clothing items",
          description: "Please add some clothing items to your wardrobe first",
          variant: "destructive",
        });
        return;
      }

      const upperItems = getItemsByType("upper");
      const bottomItems = getItemsByType("bottom");

      if (upperItems.length === 0 || bottomItems.length === 0) {
        toast({
          title: "Incomplete wardrobe",
          description:
            "Please add both upper and bottom clothing items to your wardrobe",
          variant: "destructive",
        });
        return;
      }

      // Create mappings for category and subcategory names
      const { categoryMapping, subcategoryMapping } = createMappings();

      // Generate an outfit for each day of the week
      const newOutfits: Outfit[] = [];
      
      // Show a temporary toast to indicate generation has started
      const generatingToast = toast({
        title: "Generating outfits...",
        description: "This may take a moment",
      });

      // Generate outfits for each day sequentially to avoid overwhelming the API
      for (const day of DAYS_OF_WEEK) {
        try {
          const outfit = await generateOutfitForDay(
            day,
            upperItems,
            bottomItems,
            categoryMapping,
            subcategoryMapping
          );
          newOutfits.push(outfit);
        } catch (error) {
          console.error(`Error generating outfit for ${day}:`, error);
          // Continue to the next day even if one fails
        }
      }

      // Delete existing outfits for the user
      const { error: deleteError } = await supabase
        .from("outfits")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Insert new outfits
      const { data, error: insertError } = await supabase
        .from("outfits")
        .insert(newOutfits)
        .select();

      if (insertError) throw insertError;

      if (data) {
        setWeeklyOutfits(data);
      }

      // Dismiss the generating toast
      toast({
        title: "Weekly outfits generated!",
        description: "Your AI-powered weekly outfit plan is ready",
        variant: "success",
      });
    } catch (error) {
      console.error("Error generating outfits:", error);
      toast({
        title: "Error generating outfits",
        description: "Could not create your weekly outfit plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      generationInProgress.current = false;
    }
  };

  // Regenerate an outfit for a specific day
  const regenerateOutfitForDay = async (day: DayOfWeek) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to regenerate outfits",
        variant: "destructive",
      });
      return;
    }
    
    if (generationInProgress.current) {
      toast({
        title: "Generation in progress",
        description: "Please wait for the current generation to complete",
      });
      return;
    }

    try {
      generationInProgress.current = true;
      setIsGenerating(true);
      
      const upperItems = getItemsByType("upper");
      const bottomItems = getItemsByType("bottom");
      
      if (upperItems.length === 0 || bottomItems.length === 0) {
        toast({
          title: "Incomplete wardrobe",
          description:
            "Please add both upper and bottom clothing items to your wardrobe",
          variant: "destructive",
        });
        return;
      }
      
      // Create mappings for category and subcategory names
      const { categoryMapping, subcategoryMapping } = createMappings();
      
      // Generate a new outfit for the specified day
      const newOutfit = await generateOutfitForDay(
        day,
        upperItems,
        bottomItems,
        categoryMapping,
        subcategoryMapping
      );
      
      // Delete the existing outfit for the day
      const { error: deleteError } = await supabase
        .from("outfits")
        .delete()
        .eq("user_id", user.id)
        .eq("day", day);
        
      if (deleteError) throw deleteError;
      
      // Insert the new outfit
      const { data, error: insertError } = await supabase
        .from("outfits")
        .insert([newOutfit])
        .select();
        
      if (insertError) throw insertError;
      
      if (data && data.length > 0) {
        // Update the local state
        setWeeklyOutfits(prev => {
          const filtered = prev.filter(outfit => outfit.day !== day);
          return [...filtered, data[0]];
        });
        
        toast({
          title: "Outfit regenerated",
          description: `New outfit for ${day} is ready`,
        });
      }
    } catch (error) {
      console.error(`Error regenerating outfit for ${day}:`, error);
      toast({
        title: "Error regenerating outfit",
        description: `Could not create a new outfit for ${day}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      generationInProgress.current = false;
    }
  };

  const getCurrentOutfit = useCallback(() => {
    const currentDay = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as DayOfWeek;
    return weeklyOutfits.find((outfit) => outfit.day === currentDay);
  }, [weeklyOutfits]);

  const getOutfitForDay = useCallback((day: DayOfWeek) => {
    return weeklyOutfits.find((outfit) => outfit.day === day);
  }, [weeklyOutfits]);

  return (
    <OutfitContext.Provider
      value={{
        weeklyOutfits,
        isLoading,
        isGenerating,
        generateWeeklyOutfits,
        getCurrentOutfit,
        getOutfitForDay,
        regenerateOutfitForDay,
        resetCache
      }}
    >
      {children}
    </OutfitContext.Provider>
  );
}

export const useOutfit = () => {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error("useOutfit must be used within an OutfitProvider");
  }
  return context;
};
