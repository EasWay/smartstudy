export interface Resource {
  id: string;
  title: string;
  description?: string;
  resourceType: 'document' | 'link' | 'video' | 'book' | 'image';
  fileUrl?: string;
  filePath?: string; // Storage path for Supabase Storage
  fileSize?: number; // File size in bytes
  fileType?: string; // MIME type
  thumbnailUrl?: string; // Generated thumbnail for images/videos
  externalUrl?: string;
  subject?: string;
  gradeLevel?: string;
  uploadedBy: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  isBookmarked?: boolean;
}
