/**
 * Path utilities for Supabase Storage
 * Handles path validation and sanitization for storage uploads
 */

/**
 * Sanitize a filename to be compatible with Supabase Storage
 * Follows strict ASCII-only rules to prevent InvalidKey errors
 */
export function sanitizeFilename(filename: string): string {
  return filename
    // Normalize Unicode characters to ASCII (é → e, ñ → n, etc.)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Remove non-ASCII characters (anything outside 0x00-0x7F range)
    .replace(/[^\x00-\x7F]/g, '_')
    // Remove forbidden characters: %, !, *, ', (, ), ;, :, @, &, =, +, $, ,, /, ?, #, [, ]
    .replace(/[%!*'();:@&=+$,/?#[\]]/g, '_')
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores and dots
    .replace(/^[._]+|[._]+$/g, '')
    // Limit length to 255 characters (common filesystem limit)
    .substring(0, 255)
    // Ensure it's not empty
    || 'file';
}

/**
 * Sanitize a path segment (folder name) for Supabase Storage
 * More permissive than filename sanitization but still ASCII-safe
 */
export function sanitizePathSegment(segment: string): string {
  return segment
    // Normalize Unicode to ASCII
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Remove non-ASCII characters
    .replace(/[^\x00-\x7F]/g, '')
    // Remove forbidden characters but allow dots for UUIDs
    .replace(/[%!*'();:@&=+$,/?#[\]]/g, '')
    // Replace spaces with hyphens for readability
    .replace(/\s+/g, '-')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    || 'folder';
}

/**
 * Validate if a storage path is valid for Supabase
 */
export function validateStoragePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check total length (Supabase has limits)
  if (path.length > 1024) {
    return { valid: false, error: 'Path too long (max 1024 characters)' };
  }

  // Split into segments
  const segments = path.split('/');
  
  if (segments.length === 0) {
    return { valid: false, error: 'Invalid path format' };
  }

  // Validate each segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    if (segment === '') {
      return { valid: false, error: `Empty path segment at position ${i}` };
    }

    // Check for invalid characters in path segments
    if (!/^[a-zA-Z0-9._-]+$/.test(segment)) {
      return { valid: false, error: `Invalid characters in path segment: ${segment}` };
    }

    // Check segment length
    if (segment.length > 255) {
      return { valid: false, error: `Path segment too long: ${segment}` };
    }
  }

  return { valid: true };
}

/**
 * Create a valid storage path for gfiles bucket
 */
export function createGFilesPath(groupId: string, userId: string, filename: string): string {
  const sanitizedGroupId = sanitizePathSegment(groupId);
  const sanitizedUserId = sanitizePathSegment(userId);
  const sanitizedFilename = sanitizeFilename(filename);
  
  return `${sanitizedGroupId}/${sanitizedUserId}/${sanitizedFilename}`;
}

/**
 * Create a valid storage path with timestamp
 */
export function createTimestampedPath(groupId: string, userId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || '';
  const baseName = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension
  
  const sanitizedBaseName = sanitizeFilename(baseName);
  const sanitizedExtension = sanitizeFilename(extension);
  
  const filename = sanitizedExtension 
    ? `${timestamp}_${sanitizedBaseName}.${sanitizedExtension}`
    : `${timestamp}_${sanitizedBaseName}`;
  
  return createGFilesPath(groupId, userId, filename);
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Generate a safe filename with UUID
 */
export function generateSafeFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.replace(/\.[^/.]+$/, '');
  const sanitizedBaseName = sanitizeFilename(baseName);
  
  // Generate a simple timestamp-based ID instead of UUID for simplicity
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  return extension 
    ? `${sanitizedBaseName}_${id}.${extension}`
    : `${sanitizedBaseName}_${id}`;
}

/**
 * Parse a gfiles path to extract components
 */
export function parseGFilesPath(path: string): {
  groupId?: string;
  userId?: string;
  filename?: string;
  valid: boolean;
} {
  const segments = path.split('/');
  
  if (segments.length !== 3) {
    return { valid: false };
  }
  
  return {
    groupId: segments[0],
    userId: segments[1],
    filename: segments[2],
    valid: true
  };
}

/**
 * Fix a problematic path by sanitizing all components
 * This is specifically for fixing InvalidKey errors
 */
export function fixInvalidPath(originalPath: string): string {
  const segments = originalPath.split('/');
  
  if (segments.length !== 3) {
    throw new Error('Path must have exactly 3 segments: groupId/userId/filename');
  }
  
  const [groupId, userId, filename] = segments;
  
  // Sanitize each component
  const cleanGroupId = sanitizePathSegment(groupId);
  const cleanUserId = sanitizePathSegment(userId);
  const cleanFilename = sanitizeFilename(filename);
  
  const fixedPath = `${cleanGroupId}/${cleanUserId}/${cleanFilename}`;
  
  // Validate the fixed path
  const validation = validateStoragePath(fixedPath);
  if (!validation.valid) {
    throw new Error(`Fixed path is still invalid: ${validation.error}`);
  }
  
  return fixedPath;
}

/**
 * Check if a path needs fixing (contains invalid characters)
 */
export function pathNeedsFix(path: string): boolean {
  const validation = validateStoragePath(path);
  return !validation.valid;
}