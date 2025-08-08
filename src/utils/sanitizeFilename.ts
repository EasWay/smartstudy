/**
 * Sanitizes a filename by removing or replacing invalid characters
 * @param filename The original filename
 * @returns A sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed_file';
  
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase() // Convert to lowercase for consistency
    .substring(0, 100); // Limit length to 100 characters
}