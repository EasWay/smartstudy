import { ThumbnailService } from '../edgeFunctions/thumbnailService';

export interface ThumbnailWebhookPayload {
  resourceId: string;
  thumbnailUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Handle webhook from edge function when thumbnail generation is complete
 * This would typically be called by your edge function after processing
 */
export async function handleThumbnailWebhook(payload: ThumbnailWebhookPayload): Promise<boolean> {
  try {
    console.log('Received thumbnail webhook:', payload);

    if (!payload.success || !payload.thumbnailUrl) {
      console.error('Thumbnail generation failed:', payload.error);
      return false;
    }

    // Update the resource with the generated thumbnail URL
    const success = await ThumbnailService.updateResourceThumbnail(
      payload.resourceId,
      payload.thumbnailUrl
    );

    if (success) {
      console.log('Thumbnail webhook processed successfully');
      // You could emit an event here to refresh the UI if needed
      // EventEmitter.emit('thumbnailUpdated', payload.resourceId);
    }

    return success;
  } catch (error) {
    console.error('Error processing thumbnail webhook:', error);
    return false;
  }
}

/**
 * Simulate webhook for testing purposes
 * In production, this would be called by your edge function
 */
export async function simulateThumbnailWebhook(resourceId: string, thumbnailUrl: string): Promise<boolean> {
  return handleThumbnailWebhook({
    resourceId,
    thumbnailUrl,
    success: true,
  });
}