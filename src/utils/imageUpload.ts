import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "@/utils/uuid";
import { ImageUploadResult, UploadProgress } from "@/types";

// Maximum file size in bytes (3MB)
const MAX_FILE_SIZE = 3 * 1024 * 1024;

// Allowed image formats
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Image compression quality (0-1)
const COMPRESSION_QUALITY = 0.8;

// Bucket name for Supabase storage
const BUCKET_NAME = "images";

/**
 * Validates an image file before upload
 * @param file The file to validate
 * @throws Error if validation fails
 */
export const validateImage = (file: File): void => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file type
  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error(
      `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.map(format => format.split('/')[1]).join(', ')}`
    );
  }
};

/**
 * Compresses an image file to reduce size while maintaining quality
 * @param file Original file to compress
 * @returns Promise resolving to compressed Blob
 */
export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // If the file is already small or if it's GIF (can't compress easily), skip compression
    if (file.size < 500 * 1024 || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        // Limit to max 1200px width/height while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context for compression'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to desired format - prefer WebP if supported
        const supportsWebP = file.type !== 'image/gif'; // Don't convert GIFs to WebP
        const mimeType = supportsWebP ? 'image/webp' : file.type;
        
        // Get blob from canvas
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            resolve(blob);
          },
          mimeType,
          COMPRESSION_QUALITY
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image for compression'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file for compression'));
    };
  });
};

/**
 * Reads a file as a data URL (fallback method)
 * @param file File to read
 * @returns Promise resolving to data URL
 */
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image to data URL"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Uploads an image to Supabase Storage with progress tracking
 * @param file File to upload
 * @param userId User ID for organization
 * @param progressCallback Optional callback for upload progress updates
 * @returns Promise resolving to the URL of the uploaded image
 */
export const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;

  console.log("HELLLOOOO 1");
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  console.log("DATA", data);
  console.log("HELLLOOOO 2");

  if (error){
    console.log("HELLLOOOO 3");
    throw error;
  }

  console.log("HELLLOOOO 4");
  const { data: urlData } = supabase.storage
  .from(BUCKET_NAME)
  .getPublicUrl(fileName);
  console.log("HELLLOOOO 5");

  console.log("URLData :", urlData)

  return urlData.publicUrl;
};

/**
 * Deletes an image from Supabase Storage
 * @param url The public URL of the image to delete
 * @returns Promise resolving to success boolean
 */
export const deleteImage = async (url: string): Promise<boolean> => {
  try {
    // Skip deletion for data URLs or placeholder images
    if (url.startsWith('data:') || url.startsWith('/placeholder')) {
      return true;
    }
    
    // Extract the path from the URL
    const baseStorageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl;
    
    // Skip if the URL is not from our storage
    if (!url.includes(baseStorageUrl)) {
      return true;
    }
    
    let filePath = url.replace(baseStorageUrl, '');
    
    // Remove any leading slash
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
