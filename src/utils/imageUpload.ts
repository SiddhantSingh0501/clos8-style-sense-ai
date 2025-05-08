
export const uploadImage = async (file: File): Promise<string> => {
  // In a real implementation with Supabase, we would upload the file to Supabase Storage
  // For now, we'll create a data URL for the demo
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};
