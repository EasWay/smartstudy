import { supabase } from '../supabase/client';

/**
 * Bucket management utilities
 */
export class BucketManager {
    /**
     * Check if a bucket exists and is accessible
     */
    static async checkBucketAccess(bucketName: string): Promise<{ exists: boolean; accessible: boolean; error?: string }> {
        try {
            // First, try to list buckets to see if it exists
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                return {
                    exists: false,
                    accessible: false,
                    error: `Failed to list buckets: ${listError.message}`
                };
            }

            const bucketExists = buckets?.some(bucket => bucket.name === bucketName) || false;

            if (!bucketExists) {
                return {
                    exists: false,
                    accessible: false,
                    error: `Bucket '${bucketName}' does not exist`
                };
            }

            // Try to list files in the bucket to check accessibility
            const { data: files, error: accessError } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 1 });

            if (accessError) {
                return {
                    exists: true,
                    accessible: false,
                    error: `Bucket exists but not accessible: ${accessError.message}`
                };
            }

            return { exists: true, accessible: true };

        } catch (error: any) {
            return {
                exists: false,
                accessible: false,
                error: `Bucket check failed: ${error.message}`
            };
        }
    }

    /**
     * Test upload capability to a bucket
     */
    static async testUploadCapability(bucketName: string): Promise<{ canUpload: boolean; error?: string }> {
        try {
            const testContent = `Test upload at ${new Date().toISOString()}`;
            const testBlob = new Blob([testContent], { type: 'text/plain' });
            const testPath = `test-uploads/capability-test-${Date.now()}.txt`;

            // Try to upload a test file
            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(testPath, testBlob, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                return {
                    canUpload: false,
                    error: `Upload test failed: ${uploadError.message}`
                };
            }

            // Clean up the test file
            try {
                await supabase.storage.from(bucketName).remove([testPath]);
            } catch (cleanupError) {
                console.warn('Failed to cleanup test file:', cleanupError);
            }

            return { canUpload: true };

        } catch (error: any) {
            return {
                canUpload: false,
                error: `Upload capability test failed: ${error.message}`
            };
        }
    }

    /**
     * Get bucket information and policies
     */
    static async getBucketInfo(bucketName: string): Promise<{
        info?: any;
        policies?: any[];
        error?: string;
    }> {
        try {
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                return { error: `Failed to get bucket info: ${listError.message}` };
            }

            const bucketInfo = buckets?.find(bucket => bucket.name === bucketName);

            if (!bucketInfo) {
                return { error: `Bucket '${bucketName}' not found` };
            }

            // Note: Policy information would require admin access
            // This is mainly for debugging purposes
            return {
                info: bucketInfo,
                policies: [], // Would need admin access to fetch
            };

        } catch (error: any) {
            return { error: `Failed to get bucket info: ${error.message}` };
        }
    }

    /**
     * Comprehensive bucket health check
     */
    static async healthCheck(bucketName: string = 'gfiles'): Promise<{
        healthy: boolean;
        checks: {
            exists: boolean;
            accessible: boolean;
            canUpload: boolean;
        };
        errors: string[];
    }> {
        const errors: string[] = [];
        const checks = {
            exists: false,
            accessible: false,
            canUpload: false,
        };

        // Check if bucket exists and is accessible
        const accessCheck = await this.checkBucketAccess(bucketName);
        checks.exists = accessCheck.exists;
        checks.accessible = accessCheck.accessible;

        if (accessCheck.error) {
            errors.push(accessCheck.error);
        }

        // Test upload capability if bucket is accessible
        if (checks.accessible) {
            const uploadCheck = await this.testUploadCapability(bucketName);
            checks.canUpload = uploadCheck.canUpload;

            if (uploadCheck.error) {
                errors.push(uploadCheck.error);
            }
        }

        const healthy = checks.exists && checks.accessible && checks.canUpload;

        return {
            healthy,
            checks,
            errors,
        };
    }
}