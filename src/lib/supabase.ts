import {
  createClient,
  SupabaseClient,
  RealtimeChannel,
} from "@supabase/supabase-js";

// Define types for environment variables
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validates environment variables and returns a config object
 * @returns Validated environment configuration
 * @throws Error if required environment variables are missing
 */
function validateEnvironmentVariables(): EnvironmentConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check for development fallback values
  const fallbackUrl = "https://development.supabase.co";
  const fallbackKey = "development-anon-key";

  // Validate URL
  if (!supabaseUrl || typeof supabaseUrl !== "string") {
    const error = new Error(
      "Missing or invalid VITE_SUPABASE_URL environment variable"
    );

    // In development, show a clear warning in the console
    if (import.meta.env.DEV) {
      console.error("🔴 Supabase Configuration Error:", error.message);
      console.error(
        "Please check your .env file and add a valid VITE_SUPABASE_URL"
      );
      console.warn(`⚠️ Using fallback URL for development: ${fallbackUrl}`);

      // Return development fallbacks
      return {
        supabaseUrl: fallbackUrl,
        supabaseAnonKey: fallbackKey,
      };
    }

    throw error;
  }

  // Validate key
  if (!supabaseAnonKey || typeof supabaseAnonKey !== "string") {
    const error = new Error(
      "Missing or invalid VITE_SUPABASE_ANON_KEY environment variable"
    );

    // In development, show a clear warning in the console
    if (import.meta.env.DEV) {
      console.error("🔴 Supabase Configuration Error:", error.message);
      console.error(
        "Please check your .env file and add a valid VITE_SUPABASE_ANON_KEY"
      );
      console.warn(`⚠️ Using fallback anonymous key for development`);

      // Return mixed fallback - real URL if available, but fallback key
      return {
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: fallbackKey,
      };
    }

    throw error;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("🔴 Invalid Supabase URL format:", supabaseUrl);
      console.warn(`⚠️ Using fallback URL for development: ${fallbackUrl}`);
      return {
        supabaseUrl: fallbackUrl,
        supabaseAnonKey,
      };
    }
    throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

// Singleton instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null;
// Track active realtime subscriptions
const activeSubscriptions: Map<string, RealtimeChannel> = new Map();

/**
 * Get the Supabase client instance
 * @returns Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    try {
      const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      if (import.meta.env.DEV) {
        console.log("✅ Supabase client initialized successfully");
      }
    } catch (error) {
      // Fallback for development only
      if (import.meta.env.DEV) {
        console.error(
          "⚠️ Using mock Supabase client due to configuration error:",
          error
        );

        // For development, create a mock client that won't throw errors but won't work either
        return createMockSupabaseClient();
      }

      throw error;
    }
  }

  return supabaseInstance;
}

/**
 * Creates a mock Supabase client for development purposes when the real client cannot be initialized
 * This allows the app to load in development even with missing environment variables
 */
function createMockSupabaseClient(): SupabaseClient {
  // This is a very simplified mock just to prevent crashes in development
  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
      signUp: () =>
        Promise.resolve({
          data: null,
          error: new Error(
            "Mock Supabase client - missing environment variables"
          ),
        }),
      signInWithPassword: () =>
        Promise.resolve({
          data: null,
          error: new Error(
            "Mock Supabase client - missing environment variables"
          ),
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => ({
        select: () =>
          Promise.resolve({
            data: null,
            error: new Error(
              "Mock Supabase client - missing environment variables"
            ),
          }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () =>
          Promise.resolve({
            data: null,
            error: new Error(
              "Mock Supabase client - missing environment variables"
            ),
          }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    // Add mock realtime functionality
    channel: () => ({
      on: () => ({
        subscribe: () => Promise.resolve(),
      }),
    }),
  } as unknown as SupabaseClient;
}

// Export a convenience reference to the client
export const supabase = getSupabaseClient();

/**
 * Subscribe to real-time changes on a table
 * @param tableName The table to subscribe to
 * @param onInsert Callback for INSERT events
 * @param onUpdate Callback for UPDATE events
 * @param onDelete Callback for DELETE events
 * @param userId Optional user ID to filter by
 * @returns A function to unsubscribe
 */
export function subscribeToTable<T>(
  tableName: string,
  onInsert?: (item: T) => void,
  onUpdate?: (item: T) => void,
  onDelete?: (item: T) => void,
  userId?: string
): () => void {
  // Generate a unique channel name
  const channelName = userId
    ? `${tableName}_${userId}_changes`
    : `${tableName}_changes`;

  // Cleanup any existing subscription with the same name
  if (activeSubscriptions.has(channelName)) {
    activeSubscriptions.get(channelName)?.unsubscribe();
    activeSubscriptions.delete(channelName);
  }

  // Set up filter
  let filter = supabase.channel(channelName).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: tableName,
    },
    (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // Filter by user ID if provided
      if (userId && newRecord && newRecord.user_id !== userId) {
        return;
      }

      if (eventType === "INSERT" && onInsert) {
        onInsert(newRecord as T);
      } else if (eventType === "UPDATE" && onUpdate) {
        onUpdate(newRecord as T);
      } else if (eventType === "DELETE" && onDelete && oldRecord) {
        onDelete(oldRecord as T);
      }
    }
  );

  // Subscribe to the channel
  filter.subscribe((status) => {
    if (status !== "SUBSCRIBED") {
      console.warn(`Realtime subscription to ${tableName} status:`, status);
    }
  });

  // Store the subscription for cleanup
  activeSubscriptions.set(channelName, filter);

  // Return unsubscribe function
  return () => {
    if (activeSubscriptions.has(channelName)) {
      activeSubscriptions.get(channelName)?.unsubscribe();
      activeSubscriptions.delete(channelName);
    }
  };
}

/**
 * Unsubscribe from all active subscriptions
 */
export function unsubscribeAll(): void {
  activeSubscriptions.forEach((subscription, key) => {
    subscription.unsubscribe();
  });
  activeSubscriptions.clear();
}

/**
 * Check if the supabase client is initialized properly
 * @returns true if the client is connected properly
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("health_check")
      .select("count")
      .limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}
