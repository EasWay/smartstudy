import { supabase } from '../supabase/client';
import { Resource } from '../../types/resources';

class ResourceService {
  // Helper function to map database fields to Resource interface
  private static async mapDbResourceToResource(dbResource: any): Promise<Resource> {
    let thumbnailUrl = dbResource.thumbnail_url;
    
    // Handle thumbnail URL based on type
    if (thumbnailUrl) {
      // If it's already a full HTTP URL (public URL or document icon), use it as is
      if (thumbnailUrl.startsWith('http')) {
        // No processing needed for public URLs
      } else if (thumbnailUrl.length > 10 && thumbnailUrl.includes('/')) {
        // It's a storage path, try to generate signed URL
        try {
          thumbnailUrl = await this.getSignedUrl(thumbnailUrl);
        } catch (error) {
          console.warn('Failed to generate signed URL for thumbnail, setting to null:', error);
          thumbnailUrl = null;
        }
      } else {
        // Invalid thumbnail URL format
        console.warn('Invalid thumbnail URL detected, setting to null:', { 
          resourceId: dbResource.id, 
          invalidUrl: thumbnailUrl 
        });
        thumbnailUrl = null;
      }
    }

    return {
      id: dbResource.id,
      title: dbResource.title,
      description: dbResource.description,
      resourceType: dbResource.resource_type,
      fileUrl: dbResource.file_url,
      filePath: dbResource.file_path,
      fileSize: dbResource.file_size,
      fileType: dbResource.file_type,
      thumbnailUrl,
      externalUrl: dbResource.external_url,
      subject: dbResource.subject,
      gradeLevel: dbResource.grade_level,
      uploadedBy: dbResource.uploaded_by,
      isPublic: dbResource.is_public,
      downloadCount: dbResource.download_count,
      createdAt: dbResource.created_at,
      updatedAt: dbResource.updated_at,
      isBookmarked: dbResource.bookmarks?.length > 0 || false,
    };
  }

  static async fetchResources(query?: string): Promise<Resource[]> {
    try {
      let dbQuery = supabase.from('resources').select(`
        id,
        title,
        description,
        resource_type,
        file_url,
        file_path,
        file_size,
        file_type,
        thumbnail_url,
        external_url,
        subject,
        grade_level,
        uploaded_by,
        is_public,
        download_count,
        created_at,
        updated_at,
        bookmarks(id)
      `);

      if (query) {
        dbQuery = dbQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`
        );
      }

      const { data, error } = await dbQuery.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process resources and generate signed URLs for thumbnails
      const processedResources = await Promise.all(
        data.map(resource => this.mapDbResourceToResource(resource))
      );

      return processedResources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  static async addBookmark(resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        resource_id: resourceId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  static async removeBookmark(resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('resource_id', resourceId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  static async getSignedUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage.from('edresources').createSignedUrl(filePath, 3600);

      if (error) {
        throw error;
      }

      return data?.signedUrl || '';
    } catch (error) {
      console.error('Error getting signed URL for resource:', error);
      throw error;
    }
  }

  static async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'isBookmarked'>): Promise<Resource> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const {
        downloadCount,
        filePath,
        fileSize,
        resourceType,
        fileUrl,
        fileType,
        thumbnailUrl,
        externalUrl,
        gradeLevel,
        isPublic,
        uploadedBy,
        ...rest
      } = resource;

      const { data, error } = await supabase.from('resources').insert({
        ...rest,
        uploaded_by: uploadedBy,
        download_count: downloadCount || 0,
        file_path: filePath,
        file_size: fileSize,
        resource_type: resourceType,
        file_url: fileUrl,
        file_type: fileType,
        thumbnail_url: thumbnailUrl,
        external_url: externalUrl,
        grade_level: gradeLevel,
        is_public: isPublic,
      }).select().single();

      if (error) {
        throw error;
      }

      // Update user storage usage
      if (fileSize) {
        await this.updateUserStorageUsage(user.id, fileSize);
      }

      // Map the returned data to Resource interface
      return await this.mapDbResourceToResource({ ...data, bookmarks: [] });
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  static async deleteResource(resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, get the resource to check ownership and get file info
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .eq('uploaded_by', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!resource) {
        throw new Error('Resource not found or you do not have permission to delete it');
      }

      // Delete the file from storage if it exists
      if (resource.file_path) {
        const bucket = 'edresources';
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([resource.file_path]);

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      // Delete thumbnail if it exists
      if (resource.thumbnail_url && !resource.thumbnail_url.startsWith('http')) {
        const { error: thumbnailError } = await supabase.storage
          .from('edresources')
          .remove([resource.thumbnail_url]);

        if (thumbnailError) {
          console.warn('Failed to delete thumbnail from storage:', thumbnailError);
        }
      }

      // Delete the resource from database
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)
        .eq('uploaded_by', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update user storage usage (subtract the file size)
      if (resource.file_size) {
        await this.updateUserStorageUsage(user.id, -resource.file_size);
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  static async deleteMultipleResources(resourceIds: string[]): Promise<{ success: string[], failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const resourceId of resourceIds) {
      try {
        await this.deleteResource(resourceId);
        success.push(resourceId);
      } catch (error) {
        console.error(`Failed to delete resource ${resourceId}:`, error);
        failed.push(resourceId);
      }
    }

    return { success, failed };
  }

  static async getUserResources(userId?: string): Promise<Resource[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          resource_type,
          file_url,
          file_path,
          file_size,
          file_type,
          thumbnail_url,
          external_url,
          subject,
          grade_level,
          uploaded_by,
          is_public,
          download_count,
          created_at,
          updated_at,
          bookmarks(id)
        `)
        .eq('uploaded_by', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process resources and generate signed URLs for thumbnails
      const processedResources = await Promise.all(
        data.map(resource => this.mapDbResourceToResource(resource))
      );

      return processedResources;
    } catch (error) {
      console.error('Error fetching user resources:', error);
      throw error;
    }
  }

  static async updateUserStorageUsage(userId: string, sizeChange: number): Promise<void> {
    try {
      // Get current storage usage
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('storage_used')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentUsage = profile?.storage_used || 0;
      const newUsage = Math.max(0, currentUsage + sizeChange);

      // Update storage usage
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ storage_used: newUsage })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating user storage usage:', error);
      throw error;
    }
  }

  static async getStorageStats(userId: string): Promise<{ used: number; limit: number; files: number }> {
    try {
      // Get storage usage from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('storage_used, storage_limit')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get file count
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('id')
        .eq('uploaded_by', userId);

      if (resourcesError) {
        throw resourcesError;
      }

      return {
        used: profile?.storage_used || 0,
        limit: profile?.storage_limit || 104857600, // 100MB default
        files: resources?.length || 0
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { used: 0, limit: 104857600, files: 0 };
    }
  }
}

export { ResourceService };