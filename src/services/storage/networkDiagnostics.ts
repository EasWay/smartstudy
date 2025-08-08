import { supabase } from '../supabase/client';

/**
 * Network diagnostics utilities for file upload troubleshooting
 */
export class NetworkDiagnostics {
  /**
   * Test basic network connectivity to Supabase
   */
  static async testSupabaseConnectivity(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple ping test using auth endpoint
      const { data, error } = await supabase.auth.getSession();
      const latency = Date.now() - startTime;
      
      if (error && error.message?.includes('network')) {
        return {
          connected: false,
          latency,
          error: `Network error: ${error.message}`
        };
      }
      
      return {
        connected: true,
        latency
      };
      
    } catch (error: any) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        error: error.message || 'Unknown network error'
      };
    }
  }

  /**
   * Test storage bucket accessibility
   */
  static async testStorageAccess(bucket: string = 'gfiles'): Promise<{
    accessible: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          accessible: false,
          latency,
          error: error.message
        };
      }
      
      return {
        accessible: true,
        latency
      };
      
    } catch (error: any) {
      return {
        accessible: false,
        latency: Date.now() - startTime,
        error: error.message || 'Storage access failed'
      };
    }
  }

  /**
   * Test file upload capability with a tiny test file
   */
  static async testUploadCapability(bucket: string = 'gfiles'): Promise<{
    canUpload: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Create a minimal test file
      const testContent = `test-${Date.now()}`;
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testPath = `network-test/test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(testPath, testBlob, {
          cacheControl: '3600',
          upsert: false,
        });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          canUpload: false,
          latency,
          error: error.message
        };
      }
      
      // Clean up test file
      try {
        await supabase.storage.from(bucket).remove([testPath]);
      } catch (cleanupError) {
        console.warn('Failed to cleanup test file:', cleanupError);
      }
      
      return {
        canUpload: true,
        latency
      };
      
    } catch (error: any) {
      return {
        canUpload: false,
        latency: Date.now() - startTime,
        error: error.message || 'Upload test failed'
      };
    }
  }

  /**
   * Comprehensive network health check
   */
  static async runHealthCheck(): Promise<{
    healthy: boolean;
    connectivity: boolean;
    storageAccess: boolean;
    uploadCapability: boolean;
    totalLatency: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    console.log('🔍 Running network health check...');
    
    // Test 1: Basic connectivity
    const connectivityTest = await this.testSupabaseConnectivity();
    if (!connectivityTest.connected && connectivityTest.error) {
      errors.push(`Connectivity: ${connectivityTest.error}`);
    }
    
    // Test 2: Storage access
    const storageTest = await this.testStorageAccess();
    if (!storageTest.accessible && storageTest.error) {
      errors.push(`Storage: ${storageTest.error}`);
    }
    
    // Test 3: Upload capability (only if storage is accessible)
    let uploadTest = { canUpload: false, error: 'Skipped due to storage access failure' };
    if (storageTest.accessible) {
      uploadTest = await this.testUploadCapability();
      if (!uploadTest.canUpload && uploadTest.error) {
        errors.push(`Upload: ${uploadTest.error}`);
      }
    } else {
      errors.push('Upload: Skipped due to storage access failure');
    }
    
    const totalLatency = Date.now() - startTime;
    const healthy = connectivityTest.connected && storageTest.accessible && uploadTest.canUpload;
    
    const result = {
      healthy,
      connectivity: connectivityTest.connected,
      storageAccess: storageTest.accessible,
      uploadCapability: uploadTest.canUpload,
      totalLatency,
      errors
    };
    
    console.log('🔍 Health check results:', result);
    
    return result;
  }

  /**
   * Get network quality assessment
   */
  static async assessNetworkQuality(): Promise<{
    quality: 'excellent' | 'good' | 'poor' | 'offline';
    latency: number;
    recommendation: string;
  }> {
    const healthCheck = await this.runHealthCheck();
    
    if (!healthCheck.connectivity) {
      return {
        quality: 'offline',
        latency: healthCheck.totalLatency,
        recommendation: 'Check internet connection and try again'
      };
    }
    
    if (healthCheck.totalLatency < 1000 && healthCheck.healthy) {
      return {
        quality: 'excellent',
        latency: healthCheck.totalLatency,
        recommendation: 'Network is optimal for file uploads'
      };
    }
    
    if (healthCheck.totalLatency < 3000 && healthCheck.storageAccess) {
      return {
        quality: 'good',
        latency: healthCheck.totalLatency,
        recommendation: 'Network is suitable for file uploads'
      };
    }
    
    return {
      quality: 'poor',
      latency: healthCheck.totalLatency,
      recommendation: 'Network issues detected. Consider retrying or checking connection'
    };
  }
}