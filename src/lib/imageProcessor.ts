/**
 * Image Processing Utility for Logo Uploads
 * Converts uploaded images to multiple optimized formats and sizes
 * Following web best practices for logo display
 */

export interface ProcessedLogo {
  // Primary logo for display (optimized PNG/WebP)
  primary: string; // Base64 data URL
  // Thumbnail for previews (100x100)
  thumbnail: string; // Base64 data URL
  // High-DPI version (2x resolution)
  retina?: string; // Base64 data URL
  // Favicon sizes (optional)
  favicon16?: string;
  favicon32?: string;
  favicon48?: string;
  // Metadata
  originalSize: number;
  processedSize: number;
  dimensions: { width: number; height: number };
  format: 'png' | 'jpeg' | 'webp';
}

export interface ImageProcessorOptions {
  // Target width for primary logo (height auto-calculated)
  targetWidth?: number;
  // Maximum file size in KB
  maxFileSizeKB?: number;
  // Quality for JPEG/WebP (0-1)
  quality?: number;
  // Generate retina (2x) version
  generateRetina?: boolean;
  // Generate favicon sizes
  generateFavicons?: boolean;
  // Output format
  format?: 'png' | 'jpeg' | 'webp' | 'auto';
  // Maintain aspect ratio
  maintainAspectRatio?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageProcessorOptions> = {
  targetWidth: 400,
  maxFileSizeKB: 200,
  quality: 0.9,
  generateRetina: true,
  generateFavicons: false,
  format: 'auto',
  maintainAspectRatio: true,
};

/**
 * Processes an image file and returns optimized versions
 */
export async function processLogoImage(
  file: File,
  options: ImageProcessorOptions = {}
): Promise<ProcessedLogo> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const img = new Image();
        
        img.onload = async () => {
          try {
            const result = await processImage(img, file, opts);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Crops an image based on crop coordinates and returns optimized versions
 */
export async function processCroppedLogo(
  imageElement: HTMLImageElement,
  cropData: { x: number; y: number; width: number; height: number },
  options: ImageProcessorOptions = {}
): Promise<ProcessedLogo> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create canvas with cropped area
  const canvas = document.createElement('canvas');
  const scaleX = imageElement.naturalWidth / imageElement.width;
  const scaleY = imageElement.naturalHeight / imageElement.height;

  const sx = cropData.x * scaleX;
  const sy = cropData.y * scaleY;
  const sw = cropData.width * scaleX;
  const sh = cropData.height * scaleY;

  // Calculate target dimensions
  const aspectRatio = sw / sh;
  let targetWidth = opts.targetWidth;
  let targetHeight = Math.round(targetWidth / aspectRatio);

  // Ensure reasonable dimensions for logos
  if (targetHeight > 200) {
    targetHeight = 200;
    targetWidth = Math.round(targetHeight * aspectRatio);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageElement, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  // Determine best format
  const format = determineOptimalFormat(opts.format, canvas);

  // Generate primary logo
  const primary = await optimizeCanvas(canvas, format, opts.quality, opts.maxFileSizeKB);

  // Generate thumbnail (100x100)
  const thumbnail = await generateThumbnail(canvas, 100);

  // Generate retina version (2x)
  let retina: string | undefined;
  if (opts.generateRetina) {
    retina = await generateRetinaVersion(imageElement, { x: sx, y: sy, width: sw, height: sh }, targetWidth * 2, targetHeight * 2, format, opts.quality);
  }

  // Generate favicons
  let favicon16: string | undefined;
  let favicon32: string | undefined;
  let favicon48: string | undefined;
  
  if (opts.generateFavicons) {
    favicon16 = await generateFavicon(canvas, 16);
    favicon32 = await generateFavicon(canvas, 32);
    favicon48 = await generateFavicon(canvas, 48);
  }

  // Calculate sizes
  const originalSize = estimateBase64Size(imageElement.src);
  const processedSize = estimateBase64Size(primary);

  return {
    primary,
    thumbnail,
    retina,
    favicon16,
    favicon32,
    favicon48,
    originalSize,
    processedSize,
    dimensions: { width: targetWidth, height: targetHeight },
    format: format as 'png' | 'jpeg' | 'webp',
  };
}

/**
 * Internal function to process the loaded image
 */
async function processImage(
  img: HTMLImageElement,
  file: File,
  opts: Required<ImageProcessorOptions>
): Promise<ProcessedLogo> {
  // Calculate target dimensions
  const aspectRatio = img.width / img.height;
  let targetWidth = opts.targetWidth;
  let targetHeight = Math.round(targetWidth / aspectRatio);

  // Ensure reasonable dimensions for logos
  if (targetHeight > 200) {
    targetHeight = 200;
    targetWidth = Math.round(targetHeight * aspectRatio);
  }

  // Create canvas for primary logo
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Determine best format
  const format = determineOptimalFormat(opts.format, canvas);

  // Generate primary logo
  const primary = await optimizeCanvas(canvas, format, opts.quality, opts.maxFileSizeKB);

  // Generate thumbnail (100x100)
  const thumbnail = await generateThumbnail(canvas, 100);

  // Generate retina version (2x)
  let retina: string | undefined;
  if (opts.generateRetina) {
    retina = await generateRetinaVersion(img, { x: 0, y: 0, width: img.width, height: img.height }, targetWidth * 2, targetHeight * 2, format, opts.quality);
  }

  // Generate favicons
  let favicon16: string | undefined;
  let favicon32: string | undefined;
  let favicon48: string | undefined;
  
  if (opts.generateFavicons) {
    favicon16 = await generateFavicon(canvas, 16);
    favicon32 = await generateFavicon(canvas, 32);
    favicon48 = await generateFavicon(canvas, 48);
  }

  return {
    primary,
    thumbnail,
    retina,
    favicon16,
    favicon32,
    favicon48,
    originalSize: file.size,
    processedSize: estimateBase64Size(primary),
    dimensions: { width: targetWidth, height: targetHeight },
    format: format as 'png' | 'jpeg' | 'webp',
  };
}

/**
 * Determines the optimal image format based on content
 */
function determineOptimalFormat(
  requestedFormat: 'png' | 'jpeg' | 'webp' | 'auto',
  canvas: HTMLCanvasElement
): string {
  if (requestedFormat !== 'auto') {
    return requestedFormat === 'png' ? 'image/png' : requestedFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
  }

  // Check if browser supports WebP
  const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  
  if (supportsWebP) {
    return 'image/webp'; // Best compression with quality
  }

  // Check for transparency
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasTransparency = checkTransparency(imageData);
    
    if (hasTransparency) {
      return 'image/png'; // PNG for transparency
    }
  }

  return 'image/jpeg'; // JPEG for photos without transparency
}

/**
 * Checks if image has transparency
 */
function checkTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Optimizes canvas output to meet size requirements
 */
async function optimizeCanvas(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
  maxFileSizeKB: number
): Promise<string> {
  let currentQuality = quality;
  let dataUrl = canvas.toDataURL(format, currentQuality);
  
  // Iteratively reduce quality if file is too large
  while (estimateBase64Size(dataUrl) > maxFileSizeKB * 1024 && currentQuality > 0.5) {
    currentQuality -= 0.1;
    dataUrl = canvas.toDataURL(format, currentQuality);
  }

  return dataUrl;
}

/**
 * Generates a square thumbnail
 */
async function generateThumbnail(sourceCanvas: HTMLCanvasElement, size: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Calculate scaling to fit within square while maintaining aspect ratio
  const scale = Math.min(size / sourceCanvas.width, size / sourceCanvas.height);
  const scaledWidth = sourceCanvas.width * scale;
  const scaledHeight = sourceCanvas.height * scale;
  const x = (size - scaledWidth) / 2;
  const y = (size - scaledHeight) / 2;

  ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);

  return canvas.toDataURL('image/png', 0.9);
}

/**
 * Generates a high-DPI (retina) version
 */
async function generateRetinaVersion(
  img: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  targetWidth: number,
  targetHeight: number,
  format: string,
  quality: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL(format, quality);
}

/**
 * Generates a favicon at specific size
 */
async function generateFavicon(sourceCanvas: HTMLCanvasElement, size: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Scale to fit within square
  const scale = Math.min(size / sourceCanvas.width, size / sourceCanvas.height);
  const scaledWidth = sourceCanvas.width * scale;
  const scaledHeight = sourceCanvas.height * scale;
  const x = (size - scaledWidth) / 2;
  const y = (size - scaledHeight) / 2;

  ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Estimates the size of a base64 string in bytes
 */
function estimateBase64Size(base64String: string): number {
  if (!base64String) return 0;
  
  // Remove data URL prefix
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Calculate size: base64 is ~4/3 the size of original binary
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Validates image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 5MB for upload, will be optimized)
  const maxUploadSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxUploadSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format. Please use PNG, JPEG, WebP, or SVG' };
  }

  return { valid: true };
}

/**
 * Gets recommended dimensions based on logo type
 */
export function getRecommendedDimensions(logoType: 'horizontal' | 'square' | 'vertical'): { width: number; height: number }[] {
  switch (logoType) {
    case 'horizontal':
      return [
        { width: 400, height: 100 },
        { width: 350, height: 75 },
        { width: 250, height: 150 },
      ];
    case 'square':
    case 'vertical':
      return [
        { width: 160, height: 160 },
        { width: 100, height: 100 },
      ];
    default:
      return [{ width: 400, height: 100 }];
  }
}
