
import { ClothingItem } from '@/types';

// This is a placeholder for the actual Gemini API integration
// In production, this would make a real API call to your Gemini endpoint

export interface MatchRequest {
  item: {
    color: string;
    type: string;
    category: string;
    subcategory: string;
  };
}

export interface MatchResponse {
  suggestions: {
    type: string;
    category: string;
    subcategory?: string;
    color?: string;
  }[];
}

// Function to find matching items based on "AI" recommendations
export const findMatchingItems = (
  suggestions,
  availableItems
) => {
  // This is a simplified matching algorithm
  // In production, this would be more sophisticated based on Gemini's actual response
  
  const matchedItems = [];
  
  suggestions.forEach(suggestion => {
    const matchingItems = availableItems.filter(item => 
      item.type === suggestion.type &&
      (suggestion.category ? item.categoryId.toLowerCase().includes(suggestion.category.toLowerCase()) || 
                            getCategoryNameFromId(item.categoryId).toLowerCase().includes(suggestion.category.toLowerCase()) : true) &&
      (suggestion.color ? item.color.toLowerCase().includes(suggestion.color.toLowerCase()) : true)
    );
    
    if (matchingItems.length > 0) {
      // Get a random item from the matches
      const randomIndex = Math.floor(Math.random() * matchingItems.length);
      matchedItems.push(matchingItems[randomIndex]);
    }
  });
  
  return matchedItems;
};

// Helper function to extract category name from ID
const getCategoryNameFromId = (categoryId) => {
  // This would be replaced with a lookup from your actual category data
  // For demo purposes, we're just using a basic mapping
  const categoryMap = {
    'cat-1': 'T-Shirt',
    'cat-2': 'Shirt',
    'cat-3': 'Sweater',
    'cat-4': 'Jeans',
    'cat-5': 'Pants',
    'cat-6': 'Shorts',
  };
  
  return categoryMap[categoryId] || categoryId;
};

// Mock function to simulate getting matching suggestions from Gemini
export const getOutfitSuggestions = async (item, categoryMapping, subcategoryMapping) => {
  // In production, this would call your actual Gemini API endpoint
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get category and subcategory names for context
      const category = categoryMapping[item.categoryId] || 'unknown';
      const subcategory = subcategoryMapping[item.subcategoryId] || 'unknown';
      
      // Convert color hex to a more readable name
      const colorName = getColorName(item.color);
      
      // Generate a mock suggestion based on the input item
      if (item.type === 'upper') {
        // If it's an upper item, suggest a bottom
        const suggestions = [];
        
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
        const suggestions = [];
        
        // Category-based matching
        if (category.toLowerCase().includes('jeans')) {
          suggestions.push({
            type: 'upper',
            category: 'T-Shirt',
            color: 'white'
          });
          suggestions.push({
            type: 'upper',
            category: 'Shirt',
            color: 'blue'
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

// Helper function to convert hex colors to names
const getColorName = (hexColor) => {
  // Simple hex color to name mapping
  const colorMap = {
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
  
  // Normalize hex color (uppercase and full 6 digits)
  const normalizedHex = hexColor.toUpperCase();
  
  // Return the color name if found, otherwise return the hex
  return colorMap[normalizedHex] || 'unknown';
};
