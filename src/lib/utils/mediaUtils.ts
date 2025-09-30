/**
 * Check if a URL is a video based on Cloudinary URL pattern or file extension
 */
export const isVideoUrl = (url: string): boolean => {
  return url.includes('/video/upload/') || url.match(/\.(mp4|mov|webm)$/i) !== null;
};

/**
 * Get the resource type from a Cloudinary URL
 */
export const getResourceType = (url: string): 'image' | 'video' => {
  return isVideoUrl(url) ? 'video' : 'image';
};