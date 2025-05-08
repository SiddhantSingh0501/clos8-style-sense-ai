
import { ClothingItem } from '@/types';

// Interface definitions
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

// Function to find matching items based on AI recommendations
export const findMatchingItems = (
  suggestions,
  availableItems
) => {
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

// Function to get outfit suggestions from Gemini API
export const getOutfitSuggestions = async (item, categoryMapping, subcategoryMapping) => {
  try {
    // Use the Gemini API key from environment variables
    const API_KEY = process.env.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY');
    
    if (!API_KEY) {
      console.error('Missing Gemini API key');
      throw new Error('Gemini API key not found');
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

    // For now, return the mock implementation until Gemini API is fully integrated
    return mockGeminiResponse(item, colorName, category);
    
    /* 
    // Uncomment and use this code when your Gemini API integration is ready
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
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
      throw new Error(`Gemini API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response text to extract JSON
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse JSON response from Gemini');
    }
    */
  } catch (error) {
    console.error('Error using Gemini API:', error);
    // Fall back to mock suggestions
    return mockGeminiResponse(item, getColorName(item.color), categoryMapping[item.categoryId] || 'unknown');
  }
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

// Mock function to simulate getting matching suggestions
const mockGeminiResponse = (item, colorName, category) => {
  return new Promise((resolve) => {
    setTimeout(() => {
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
export const setGeminiApiKey = (key) => {
  localStorage.setItem('GEMINI_API_KEY', key);
};

export const getGeminiApiKey = () => {
  return localStorage.getItem('GEMINI_API_KEY');
};

