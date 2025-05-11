import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClothingItem } from '@/types';

declare global {
  interface Window {
    __clos8_geminiRateLimitToast?: number;
    __clos8_gemini404Toast?: boolean;
    toast?: (args: any) => void;
  }
}

// Interface definitions with proper typing
export interface MatchResponse {
  suggestions: SuggestionItem[];
}

export interface SuggestionItem {
  type: string;
  category: string;
  subcategory?: string;
  color?: string;
}

// API Error class for handling Gemini API errors
export class GeminiApiError extends Error {
  status?: number;
  isRateLimit: boolean;
  retryAfter?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
    this.isRateLimit = status === 429;
    
    if (this.isRateLimit) {
      this.retryAfter = 60;
    }
  }
}

let geminiRateLimitUntil: number | null = null;
let geminiModelNotFound: boolean = false;

export function isGeminiRateLimited(): boolean {
  return geminiRateLimitUntil !== null && Date.now() < geminiRateLimitUntil;
}

export function isGeminiModelNotFound(): boolean {
  return geminiModelNotFound;
}

// Initialize Gemini API
const initGemini = () => {
  const apiKey = localStorage.getItem('gemini-api-key');
  if (!apiKey) {
    throw new GeminiApiError('Gemini API key not found');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Function to get outfit suggestions from Gemini API
export const getOutfitSuggestions = async (
  item: ClothingItem,
  categoryMapping: Record<string, string>,
  subcategoryMapping: Record<string, string>
): Promise<MatchResponse> => {
  // If globally rate limited or model not found, use mock
  if (isGeminiRateLimited() || isGeminiModelNotFound()) {
    return mockGeminiResponse(item, getColorName(item.color), categoryMapping[item.category_id] || 'unknown');
  }
  try {
    const genAI = initGemini();
    // NOTE: If you get 404 errors, check the model name and endpoint in the Google Gemini API docs.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get category and subcategory names for context
    const category = categoryMapping[item.category_id] || 'unknown';
    const subcategory = subcategoryMapping[item.subcategory_id] || 'unknown';
    const colorName = getColorName(item.color);

    // Create a detailed prompt for better outfit suggestions
    const prompt = `
      As a fashion expert, suggest matching clothing items for the following piece:
      
      Item Details:
      - Type: ${item.type}
      - Category: ${category}
      - Subcategory: ${subcategory}
      - Color: ${colorName}
      
      Please suggest 3 complementary items that would work well with this piece.
      Consider:
      1. Color harmony
      2. Style compatibility
      3. Occasion appropriateness
      4. Seasonal relevance
      
      Respond in JSON format like this:
      {
        "suggestions": [
          {
            "type": "${item.type === 'upper' ? 'bottom' : 'upper'}",
            "category": "category name",
            "subcategory": "subcategory name",
            "color": "suggested color"
          }
        ]
      }
      
      Make sure the suggestions are practical and wearable combinations.
      IMPORTANT: Always include all fields (type, category, subcategory, color) in each suggestion.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Could not find JSON in response:', text);
        throw new Error('Could not find JSON in response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        console.error('Invalid response format:', parsedResponse);
        throw new Error('Invalid response format');
      }

      // Validate each suggestion has required fields
      const validSuggestions = parsedResponse.suggestions.filter(suggestion => {
        const isValid = suggestion && 
          typeof suggestion === 'object' &&
          typeof suggestion.type === 'string' &&
          typeof suggestion.category === 'string' &&
          typeof suggestion.subcategory === 'string' &&
          typeof suggestion.color === 'string';
        
        if (!isValid) {
          console.warn('Invalid suggestion format:', suggestion);
        }
        return isValid;
      });

      if (validSuggestions.length === 0) {
        throw new Error('No valid suggestions found in response');
      }

      return { suggestions: validSuggestions };
    } catch (apiError: any) {
      // If 429, set global cooldown for 1 minute
      if (apiError && apiError.message && apiError.message.includes('429')) {
        geminiRateLimitUntil = Date.now() + 60 * 1000; // 1 minute cooldown
        if (!window.__clos8_geminiRateLimitToast || Date.now() - window.__clos8_geminiRateLimitToast > 60000) {
          if (typeof window !== 'undefined' && window.toast) {
            window.toast({
              title: 'Gemini API Rate Limit',
              description: 'You have hit the Gemini API rate limit. Using offline mode for 1 minute.',
              variant: 'destructive',
              duration: 7000,
            });
          }
          window.__clos8_geminiRateLimitToast = Date.now();
        }
      }
      // If 404, set global model-not-found flag
      if (apiError && apiError.message && apiError.message.includes('404')) {
        geminiModelNotFound = true;
        if (!window?.__clos8_gemini404Toast) {
          if (typeof window !== 'undefined' && window?.toast) {
            window.toast({
              title: 'Gemini API Model Not Found',
              description: 'The Gemini model or endpoint is not available. Using offline mode for this session. Please check your model name and API version.',
              variant: 'destructive',
              duration: 10000,
            });
          }
          window.__clos8_gemini404Toast = true;
        }
      }
      console.error('Error calling Gemini API:', apiError);
      // Fall back to mock implementation
      return mockGeminiResponse(item, colorName, category);
    }
  } catch (error) {
    console.error('Error in getOutfitSuggestions:', error);
    // Fall back to mock implementation
    return mockGeminiResponse(item, getColorName(item.color), categoryMapping[item.category_id] || 'unknown');
  }
};

// Function to find matching items based on AI recommendations
export const findMatchingItems = (
  suggestions: SuggestionItem[],
  availableItems: ClothingItem[]
): ClothingItem[] => {
  // Validate inputs
  if (!Array.isArray(suggestions) || !Array.isArray(availableItems)) {
    console.warn('Invalid inputs to findMatchingItems:', { suggestions, availableItems });
    return [];
  }

  const matchedItems: ClothingItem[] = [];
  
  for (const suggestion of suggestions) {
    // Skip invalid suggestions
    if (!suggestion || typeof suggestion !== 'object') {
      console.warn('Invalid suggestion:', suggestion);
      continue;
    }

    // Ensure suggestion has required properties
    if (!suggestion.type || typeof suggestion.type !== 'string') {
      console.warn('Invalid suggestion type:', suggestion);
      continue;
    }
    
    const matchingItems = availableItems.filter(item => {
      try {
        // Basic type match
        if (item.type !== suggestion.type) return false;
        
        // Category match - more flexible matching
        let categoryMatch = true;
        if (suggestion.category && typeof suggestion.category === 'string') {
          const categoryName = getCategoryNameFromId(item.category_id);
          categoryMatch = 
            (item.category_id && item.category_id.toLowerCase().includes(suggestion.category.toLowerCase())) || 
            (categoryName && categoryName.toLowerCase().includes(suggestion.category.toLowerCase()));
        }
        
        // Subcategory match if specified
        let subcategoryMatch = true;
        if (suggestion.subcategory && typeof suggestion.subcategory === 'string') {
          const subcategoryName = getSubcategoryNameFromId(item.subcategory_id);
          subcategoryMatch = 
            (item.subcategory_id && item.subcategory_id.toLowerCase().includes(suggestion.subcategory.toLowerCase())) || 
            (subcategoryName && subcategoryName.toLowerCase().includes(suggestion.subcategory.toLowerCase()));
        }
        
        // Color match if specified
        let colorMatch = true;
        if (suggestion.color && typeof suggestion.color === 'string' && item.color) {
          const itemColor = getColorName(item.color);
          const suggestionColor = suggestion.color.toLowerCase();
          colorMatch = itemColor.toLowerCase().includes(suggestionColor);
        }
        
        return categoryMatch && subcategoryMatch && colorMatch;
      } catch (error) {
        console.error('Error matching item:', error, { item, suggestion });
        return false;
      }
    });
    
    if (matchingItems.length > 0) {
      // Get a random item from the matches for variety
      const randomIndex = Math.floor(Math.random() * matchingItems.length);
      matchedItems.push(matchingItems[randomIndex]);
    }
  }
  
  return matchedItems;
};

// Helper function to get category name from ID
const getCategoryNameFromId = (categoryId: string): string => {
  const categoryMap: Record<string, string> = {
    'cat-1': 'T-Shirt',
    'cat-2': 'Shirt',
    'cat-3': 'Sweater',
    'cat-4': 'Jeans',
    'cat-5': 'Pants',
    'cat-6': 'Shorts',
  };
  
  return categoryMap[categoryId] || categoryId;
};

// Helper function to get subcategory name from ID
const getSubcategoryNameFromId = (subcategoryId: string): string => {
  const subcategoryMap: Record<string, string> = {
    'sub-1': 'Casual',
    'sub-2': 'Formal',
    'sub-3': 'Sport',
    'sub-4': 'Business',
    'sub-5': 'Party',
  };
  
  return subcategoryMap[subcategoryId] || subcategoryId;
};

// Helper function to convert hex colors to names
const getColorName = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#000000': 'black',
    '#FFFFFF': 'white',
    '#0000FF': 'blue',
    '#FF0000': 'red',
    '#00FF00': 'green',
    '#FFFF00': 'yellow',
    '#FFA500': 'orange',
    '#800080': 'purple',
    '#A52A2A': 'brown',
    '#FFC0CB': 'pink',
    '#808080': 'gray',
    '#F0E68C': 'khaki',
  };
  
  if (!hexColor.startsWith('#')) {
    return hexColor.toLowerCase();
  }
  
  const normalizedHex = hexColor.toUpperCase();
  return colorMap[normalizedHex] || normalizedHex;
};

// Mock function for when API is not available
const mockGeminiResponse = (
  item: ClothingItem, 
  colorName: string, 
  category: string
): Promise<MatchResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suggestions: SuggestionItem[] = [];
      
      if (item.type === 'upper') {
        // Suggest bottoms for upper items
        if (colorName === 'black' || colorName === 'white') {
          suggestions.push({
            type: 'bottom',
            category: 'Jeans',
            subcategory: 'Casual',
            color: 'blue'
          });
        } else if (colorName === 'blue') {
          suggestions.push({
            type: 'bottom',
            category: 'Pants',
            subcategory: 'Casual',
            color: 'black'
          });
        } else {
          suggestions.push({
            type: 'bottom',
            category: 'Jeans',
            subcategory: 'Casual',
            color: 'blue'
          });
        }
      } else {
        // Suggest uppers for bottom items
        if (category.toLowerCase().includes('jeans')) {
          suggestions.push({
            type: 'upper',
            category: 'T-Shirt',
            subcategory: 'Casual',
            color: 'white'
          });
        } else if (category.toLowerCase().includes('pants')) {
          suggestions.push({
            type: 'upper',
            category: 'Shirt',
            subcategory: 'Formal',
            color: 'white'
          });
        } else {
          suggestions.push({
            type: 'upper',
            category: 'T-Shirt',
            subcategory: 'Casual',
            color: 'black'
          });
        }
      }
      
      resolve({ suggestions });
    }, 500);
  });
};

// API Key management functions
export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem('gemini-api-key', key);
};

export const getGeminiApiKey = (): string | null => {
  return localStorage.getItem('gemini-api-key');
};

