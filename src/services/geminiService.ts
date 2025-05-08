import { ClothingItem } from '@/types';

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
    
    // If it's a rate limit error, default retry after 60 seconds
    if (this.isRateLimit) {
      this.retryAfter = 60;
    }
  }
}

// In-memory request tracking to prevent excessive API calls
const requestTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTimer: null as NodeJS.Timeout | null,
  
  // Check if we're within rate limits (max 60 requests per minute)
  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Reset counter if a minute has passed since the first request in this window
    if (this.lastRequestTime < oneMinuteAgo) {
      this.requestCount = 0;
    }
    
    return this.requestCount < 60;
  },
  
  // Track a new request
  trackRequest(): void {
    const now = Date.now();
    this.lastRequestTime = now;
    this.requestCount++;
    
    // Set a timer to reset the counter after 1 minute
    if (!this.resetTimer) {
      this.resetTimer = setTimeout(() => {
        this.requestCount = 0;
        this.resetTimer = null;
      }, 60000);
    }
  }
};

// Function to find matching items based on AI recommendations
export const findMatchingItems = (
  suggestions: (SuggestionItem | null)[],
  availableItems: ClothingItem[]
): ClothingItem[] => {
  if (!suggestions || !availableItems || !Array.isArray(suggestions) || !Array.isArray(availableItems)) {
    return [];
  }

  const matchedItems: ClothingItem[] = [];
  
  suggestions.forEach(suggestion => {
    if (!suggestion) return;
    
    const matchingItems = availableItems.filter(item => {
      // Basic type match
      const typeMatch = item.type === suggestion.type;
      if (!typeMatch) return false;
      
      // Category match - more flexible matching
      let categoryMatch = false;
      if (suggestion.category) {
        const categoryName = getCategoryNameFromId(item.categoryId);
        categoryMatch = 
          item.categoryId.toLowerCase().includes(suggestion.category.toLowerCase()) || 
          categoryName.toLowerCase().includes(suggestion.category.toLowerCase());
      } else {
        categoryMatch = true; // No category constraint
      }
      
      // Color match if specified
      let colorMatch = true;
      if (suggestion.color) {
        colorMatch = item.color.toLowerCase().includes(suggestion.color.toLowerCase());
      }
      
      return typeMatch && categoryMatch && colorMatch;
    });
    
    if (matchingItems.length > 0) {
      // Get a random item from the matches for variety
      const randomIndex = Math.floor(Math.random() * matchingItems.length);
      matchedItems.push(matchingItems[randomIndex]);
    }
  });
  
  return matchedItems;
};

// Helper function to extract category name from ID
const getCategoryNameFromId = (categoryId: string): string => {
  // This would be replaced with a lookup from your actual category data
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

// Function to get outfit suggestions from Gemini API
export const getOutfitSuggestions = async (
  item: ClothingItem,
  categoryMapping: Record<string, string>,
  subcategoryMapping: Record<string, string>
): Promise<MatchResponse> => {
  try {
    // Check rate limits before making a request
    if (!requestTracker.canMakeRequest()) {
      throw new GeminiApiError('Rate limit exceeded. Try again later.', 429);
    }
    
    // Use the Gemini API key from environment variables or localStorage
    const apiKey = localStorage.getItem('gemini-api-key');
    
    if (!apiKey) {
      console.warn('Missing Gemini API key, using mock implementation');
      return mockGeminiResponse(item, getColorName(item.color), categoryMapping[item.categoryId] || 'unknown');
    }
    
    // Get category and subcategory names for context
    const category = categoryMapping[item.categoryId] || 'unknown';
    const subcategory = subcategoryMapping[item.subcategoryId] || 'unknown';
    
    // Convert color hex to a more readable name
    const colorName = getColorName(item.color);
    
    // Create prompt for Gemini API
    const prompt = `
      I have a ${colorName} ${subcategory} ${category} which is an ${item.type} body garment. 
      Please suggest what would be a good matching ${item.type === 'upper' ? 'bottom' : 'upper'} to pair with it.
      Respond in JSON format like this:
      {
        "suggestions": [
          {
            "type": "${item.type === 'upper' ? 'bottom' : 'upper'}",
            "category": "category name",
            "color": "suggested color"
          }
        ]
      }
    `;

    // Track this request
    requestTracker.trackRequest();

    try {
      // Make API request to Gemini
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });
      
      if (!response.ok) {
        // Handle specific error status codes
        if (response.status === 429) {
          // Rate limit hit - get retry-after header if available
          const retryAfter = response.headers.get('retry-after');
          const error = new GeminiApiError('Gemini API rate limit exceeded', 429);
          if (retryAfter) {
            error.retryAfter = parseInt(retryAfter, 10);
          }
          throw error;
        }
        
        throw new GeminiApiError(`Gemini API request failed: ${response.status}`, response.status);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new GeminiApiError('Invalid response format from Gemini API');
      }
      
      // Parse the response text to extract JSON
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Validate the parsed response has the expected structure
          if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
            throw new Error('Response missing suggestions array');
          }
          
          return parsedResponse;
        } catch (parseError) {
          console.error('Error parsing Gemini API response:', parseError);
          throw new GeminiApiError('Could not parse JSON response from Gemini');
        }
      } else {
        throw new GeminiApiError('Could not find JSON in Gemini response');
      }
    } catch (apiError) {
      // If the API call fails, fall back to mock implementation
      console.error('Error calling Gemini API:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error using Gemini API:', error);
    
    // Fall back to mock suggestions
    return mockGeminiResponse(
      item, 
      getColorName(item.color), 
      categoryMapping[item.categoryId] || 'unknown'
    );
  }
};

// Helper function to convert hex colors to names
const getColorName = (hexColor: string): string => {
  // Simple hex color to name mapping
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
  
  // For non-hex colors, assume it's already a name
  if (!hexColor.startsWith('#')) {
    return hexColor.toLowerCase();
  }
  
  // Normalize hex color (uppercase and full 6 digits)
  const normalizedHex = hexColor.toUpperCase();
  
  // Return the color name if found, otherwise return the hex
  return colorMap[normalizedHex] || normalizedHex;
};

// Mock function to simulate getting matching suggestions
const mockGeminiResponse = (
  item: ClothingItem, 
  colorName: string, 
  category: string
): Promise<MatchResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a mock suggestion based on the input item
      if (item.type === 'upper') {
        // If it's an upper item, suggest a bottom
        const suggestions: SuggestionItem[] = [];
        
        // Color-based matching
        if (colorName === 'black' || colorName === 'white') {
          // Black or white tops go well with almost anything
          suggestions.push({
            type: 'bottom',
            category: Math.random() > 0.5 ? 'Jeans' : 'Pants',
            color: ['blue', 'black', 'beige', 'gray'][Math.floor(Math.random() * 4)]
          });
        } else if (colorName === 'blue') {
          // Blue tops often pair with neutral bottoms
          suggestions.push({
            type: 'bottom',
            category: 'Jeans',
            color: 'blue'
          });
        } else {
          // For other colors, suggest neutral bottoms
          suggestions.push({
            type: 'bottom',
            category: 'Pants',
            color: 'black'
          });
        }
        
        resolve({
          suggestions: suggestions
        });
      } else {
        // If it's a bottom item, suggest an upper
        const suggestions: SuggestionItem[] = [];
        
        // Category-based matching
        if (category.toLowerCase().includes('jeans')) {
          suggestions.push({
            type: 'upper',
            category: 'T-Shirt',
            color: 'white'
          });
        } else if (category.toLowerCase().includes('pants')) {
          suggestions.push({
            type: 'upper',
            category: 'Sweater',
            color: 'black'
          });
        } else {
          suggestions.push({
            type: 'upper',
            category: 'T-Shirt',
            color: colorName === 'black' ? 'white' : 'black'
          });
        }
        
        resolve({
          suggestions: suggestions
        });
      }
    }, 500); // Simulate API delay
  });
};

// Add a function to store Gemini API Key in localStorage
export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem('gemini-api-key', key);
};

export const getGeminiApiKey = (): string | null => {
  return localStorage.getItem('gemini-api-key');
};

