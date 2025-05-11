import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  ClothingItem,
  ClothingCategory,
  ClothingSubcategory,
  ClothingType,
  WardrobeFilter,
  SortOption,
  PaginationOptions,
  ImageUploadResult,
} from "@/types";
import { supabase, subscribeToTable } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { deleteImage } from "@/utils/imageUpload";
import { initialCategories, initialSubcategories } from "@/data/wardrobeData";

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  categories: ClothingCategory[];
  subcategories: ClothingSubcategory[];
  isLoading: boolean;
  isSubmitting: boolean;
  totalItems: number;
  pagination: PaginationOptions;
  filter: WardrobeFilter;
  sort: SortOption;
  addClothingItem: (
    item: Omit<ClothingItem, "id" | "user_id">
  ) => Promise<ClothingItem | null>;
  updateClothingItem: (item: ClothingItem) => Promise<ClothingItem | null>;
  deleteClothingItem: (id: string) => Promise<boolean>;
  getItemById: (id: string) => ClothingItem | undefined;
  getItemsByType: (type: ClothingType) => ClothingItem[];
  setFilter: (filter: Partial<WardrobeFilter>) => void;
  setSortOption: (sort: SortOption) => void;
  setPagination: (pagination: Partial<PaginationOptions>) => void;
  resetFilters: () => void;
  refreshWardrobe: () => Promise<void>;
}

const defaultFilter: WardrobeFilter = {
  searchTerm: "",
  type: null,
  categoryId: null,
  subcategoryId: null,
  color: null,
  favorite: null,
  season: null,
};
const defaultSort: SortOption = {
  field: "created_at",
  direction: "desc",
};

const defaultPagination: PaginationOptions = {
  page: 1,
  pageSize: 12,
};

const WardrobeContext = createContext<WardrobeContextType | undefined>(
  undefined
);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [categories, setCategories] = useState<ClothingCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ClothingSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [filter, setFilterState] = useState<WardrobeFilter>(defaultFilter);
  const [sort, setSortState] = useState<SortOption>(defaultSort);
  const [pagination, setPaginationState] =
    useState<PaginationOptions>(defaultPagination);

  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch clothing categories
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clothing_categories")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(initialCategories); // fallback to local sample data
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories(initialCategories); // fallback to local sample data
      toast({
        title: "Error loading categories",
        description: "Could not load clothing categories (using sample data)",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch clothing subcategories
  const loadSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clothing_subcategories")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setSubcategories(data);
      } else {
        setSubcategories(initialSubcategories); // fallback to local sample data
      }
    } catch (error) {
      console.error("Error loading subcategories:", error);
      setSubcategories(initialSubcategories); // fallback to local sample data
      toast({
        title: "Error loading subcategories",
        description:
          "Could not load clothing subcategories (using sample data)",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Construct the query based on active filters and user authentication
  const constructQuery = useCallback(() => {
    if (!user) return null;

    let query = supabase
      .from("clothing_items")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // Apply filters if set
    if (filter.type) {
      query = query.eq("type", filter.type);
    }

    if (filter.categoryId) {
      query = query.eq("categoryId", filter.categoryId);
    }

    if (filter.subcategoryId) {
      query = query.eq("subcategoryId", filter.subcategoryId);
    }

    if (filter.color) {
      query = query.ilike("color", `%${filter.color}%`);
    }

    if (filter.searchTerm) {
      query = query.or(
        `name.ilike.%${filter.searchTerm}%,metadata->>brand.ilike.%${filter.searchTerm}%`
      );
    }

    if (filter.favorite !== null) {
      query = query.eq("favorite", filter.favorite);
    }

    if (filter.season) {
      query = query.contains("seasons", [filter.season]);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === "asc" });

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);

    return query;
  }, [user, filter, sort, pagination]);

  // Load clothing items with pagination, sorting, and filtering
  const loadClothingItems = useCallback(async () => {
    try {
      setIsLoading(true);

      const query = constructQuery();
      if (!query) {
        setClothingItems([]);
        setTotalItems(0);
        return;
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        setClothingItems(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error("Error loading clothing items:", error);
      toast({
        title: "Error loading wardrobe",
        description: "Could not load your clothing items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [constructQuery, toast]);

  // Fetch all data when the component mounts or when user changes
  useEffect(() => {
    if (user) {
      Promise.all([loadCategories(), loadSubcategories()]);
      loadClothingItems();

      // Set up real-time subscriptions
      const unsubscribe = subscribeToTable<ClothingItem>(
        "clothing_items",
        (newItem) => {
          // Handle new item
          setClothingItems((prev) => [...prev, newItem]);
          setTotalItems((prev) => prev + 1);
        },
        (updatedItem) => {
          // Handle updated item
          setClothingItems((prev) =>
            prev.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            )
          );
        },
        (deletedItem) => {
          // Handle deleted item
          setClothingItems((prev) =>
            prev.filter((item) => item.id !== deletedItem.id)
          );
          setTotalItems((prev) => prev - 1);
        },
        user.id
      );

      return () => {
        unsubscribe();
      };
    } else {
      setClothingItems([]);
      setTotalItems(0);
    }
  }, [user, loadCategories, loadSubcategories, loadClothingItems]);

  // Reload clothing items when filters, sorting, or pagination changes
  useEffect(() => {
    if (user) {
      loadClothingItems();
    }
  }, [user, filter, sort, pagination, loadClothingItems]);

  // Add a new clothing item
  const addClothingItem = async (item: Omit<ClothingItem, 'id' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Inserting item:', item); // Debug log
      const { data, error } = await supabase
        .from('clothing_items')
        .insert({
          name: item.name,
          image_url: item.image_url,
          type: item.type,
          category_id: item.category_id,
          subcategory_id: item.subcategory_id,
          color: item.color,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) throw new Error('No data returned from insert');

      setClothingItems(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error in addClothingItem:', error);
      throw error;
    }
  };

  // Update an existing clothing item
  const updateClothingItem = async (
    item: ClothingItem
  ): Promise<ClothingItem | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update clothing items",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from("clothing_items")
        .update(item)
        .eq("id", item.id)
        .eq("user_id", user.id) // Safety check
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Failed to update clothing item");
      }

      toast({
        title: "Item updated",
        description: "Your clothing item has been updated",
      });

      return data;
    } catch (error) {
      console.error("Error updating clothing item:", error);
      toast({
        title: "Error updating item",
        description: "Could not update clothing item",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a clothing item
  const deleteClothingItem = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete clothing items",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSubmitting(true);

      // First, get the item to delete its image
      const { data: itemData } = await supabase
        .from("clothing_items")
        .select("imageUrl")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (itemData?.imageUrl) {
        // Delete the image from storage first
        await deleteImage(itemData.imageUrl);
      }

      // Then delete the item itself
      const { error } = await supabase
        .from("clothing_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Item deleted",
        description: "Your clothing item has been removed from your wardrobe",
      });

      return true;
    } catch (error) {
      console.error("Error deleting clothing item:", error);
      toast({
        title: "Error deleting item",
        description: "Could not delete clothing item",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get item by ID
  const getItemById = useCallback(
    (id: string) => clothingItems.find((item) => item.id === id),
    [clothingItems]
  );

  // Get items by type
  const getItemsByType = useCallback(
    (type: ClothingType) => clothingItems.filter((item) => item.type === type),
    [clothingItems]
  );

  // Set filter
  const setFilter = useCallback((newFilter: Partial<WardrobeFilter>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
    // Reset to the first page when filters change
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Set sort option
  const setSortOption = useCallback((newSort: SortOption) => {
    setSortState(newSort);
  }, []);

  // Set pagination
  const setPagination = useCallback(
    (newPagination: Partial<PaginationOptions>) => {
      setPaginationState((prev) => ({ ...prev, ...newPagination }));
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterState(defaultFilter);
    setSortState(defaultSort);
    setPaginationState(defaultPagination);
  }, []);

  // Manually refresh the wardrobe
  const refreshWardrobe = useCallback(async () => {
    await loadClothingItems();
  }, [loadClothingItems]);

  return (
    <WardrobeContext.Provider
      value={{
        clothingItems,
        categories,
        subcategories,
        isLoading,
        isSubmitting,
        totalItems,
        filter,
        sort,
        pagination,
        addClothingItem,
        updateClothingItem,
        deleteClothingItem,
        getItemById,
        getItemsByType,
        setFilter,
        setSortOption,
        setPagination,
        resetFilters,
        refreshWardrobe,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error("useWardrobe must be used within a WardrobeProvider");
  }
  return context;
};
