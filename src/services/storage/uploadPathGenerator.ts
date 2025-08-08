import { createTimestampedPath, generateSafeFilename, sanitizePathSegment } from './pathUtils';

/**
 * Generate a proper upload path for different scenarios
 */
export class UploadPathGenerator {
  /**
   * Generate a path for group file uploads
   */
  static forGroupFile(groupId: string, userId: string, originalFilename: string): string {
    // Clean the inputs
    const cleanGroupId = sanitizePathSegment(groupId);
    const cleanUserId = sanitizePathSegment(userId);
    const safeFilename = generateSafeFilename(originalFilename);
    
    return `${cleanGroupId}/${cleanUserId}/${safeFilename}`;
  }

  /**
   * Generate a timestamped path for group file uploads
   */
  static forGroupFileWithTimestamp(groupId: string, userId: string, originalFilename: string): string {
    return createTimestampedPath(groupId, userId, originalFilename);
  }

  /**
   * Generate a path for user avatar uploads
   */
  static forUserAvatar(userId: string, originalFilename: string): string {
    const cleanUserId = sanitizePathSegment(userId);
    const safeFilename = generateSafeFilename(originalFilename);
    
    return `${cleanUserId}/${safeFilename}`;
  }

  /**
   * Generate a path for educational resources
   */
  static forEducationalResource(userId: string, originalFilename: string): string {
    const cleanUserId = sanitizePathSegment(userId);
    const safeFilename = generateSafeFilename(originalFilename);
    
    return `${cleanUserId}/${safeFilename}`;
  }

  /**
   * Generate a path for temporary uploads
   */
  static forTempUpload(userId: string, originalFilename: string): string {
    const cleanUserId = sanitizePathSegment(userId);
    const timestamp = Date.now();
    const safeFilename = generateSafeFilename(originalFilename);
    
    return `${cleanUserId}/${timestamp}_${safeFilename}`;
  }

  /**
   * Extract original filename from a file URI or path
   */
  static extractFilename(fileUri: string): string {
    // Handle different URI formats
    if (fileUri.includes('/')) {
      const parts = fileUri.split('/');
      return parts[parts.length - 1];
    }
    
    return fileUri;
  }

  /**
   * Generate a path from the file URI used in your logs
   */
  static fromFileUri(fileUri: string, groupId: string, userId: string): string {
    const originalFilename = this.extractFilename(fileUri);
    return this.forGroupFileWithTimestamp(groupId, userId, originalFilename);
  }
}