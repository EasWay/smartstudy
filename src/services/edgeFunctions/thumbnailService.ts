import { supabase } from '../supabase/client';

export class ThumbnailService {
  /**
   * Trigger edge function to generate thumbnail for an uploaded image
   * This should be called after a successful image upload
   */
  static async generateThumbnail(filePath: string, resourceId: string): Promise<string | null> {
    try {
      console.log('Triggering thumbnail generation for:', { filePath, resourceId });
      
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          filePath,
          resourceId,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return null;
      }

      if (data && data.thumbnailUrl) {
        console.log('Thumbnail generated successfully:', data.thumbnailUrl);
        return data.thumbnailUrl;
      }

      return null;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  /**
   * Get the appropriate document icon URL for a given file type
   * Only returns URLs for icons that actually exist in storage
   */
  static getDocumentIconUrl(resourceType: string, fileType?: string): string | null {
    const supabaseUrl = supabase.supabaseUrl;
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/edresources/document_icons`;
    
    // Only return URLs for icons we know exist based on the test results
    switch (resourceType) {
      case 'document':
        if (fileType?.includes('pdf')) {
          return `${baseUrl}/pdf.png`; // This one exists
        }
        // For other document types, return null since the icons don't exist
        return null;
      case 'video':
        return `${baseUrl}/video.png`; // This one exists
      case 'image':
      case 'book':
      case 'link':
      default:
        // These icons don't exist, return null to fall back to Ionicons
        return null;
    }
  }

  /**
   * Update resource with generated thumbnail URL
   * This is typically called by the edge function webhook
   */
  static async updateResourceThumbnail(resourceId: string, thumbnailUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', resourceId);

      if (error) {
        console.error('Failed to update resource thumbnail:', error);
        return false;
      }

      console.log('Resource thumbnail updated successfully:', { resourceId, thumbnailUrl });
      return true;
    } catch (error) {
      console.error('Error updating resource thumbnail:', error);
      return false;
    }
  }
}