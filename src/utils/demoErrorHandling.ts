/**
 * Demo script to showcase error handling functionality
 * This can be used in development to test various error scenarios
 */

import { ApiErrorHandler } from './apiErrorHandler';
import { CacheManager } from '../services/cache/CacheManager';

export class ErrorHandlingDemo {
  /**
   * Demo: Successful API call with caching
   */
  static async demoSuccessfulCall() {
    console.log('🎯 Demo: Successful API call with caching');
    
    const mockSuccessfulApi = () => Promise.resolve({
      data: 'Fresh API data',
      timestamp: new Date().toISOString()
    });

    const result = await ApiErrorHandler.handleApiCall(
      mockSuccessfulApi,
      'demo-success-key',
      2,
      1000
    );

    console.log('✅ Result:', result);
    console.log('📊 Data:', result.data);
    console.log('💾 From cache:', result.isFromCache);
    console.log('❌ Error:', result.error);
  }

  /**
   * Demo: Network error with cache fallback
   */
  static async demoNetworkErrorWithCache() {
    console.log('🎯 Demo: Network error with cache fallback');
    
    // First, set up cached data
    await CacheManager.set('demo-network-error-key', {
      data: 'Cached fallback data',
      timestamp: new Date(Date.now() - 10000).toISOString() // 10 seconds ago
    }, 3600000);

    const mockNetworkError = () => Promise.reject(new Error('Network request failed'));

    const result = await ApiErrorHandler.handleApiCall(
      mockNetworkError,
      'demo-network-error-key',
      2,
      500
    );

    console.log('✅ Result:', result);
    console.log('📊 Data:', result.data);
    console.log('💾 From cache:', result.isFromCache);
    console.log('❌ Error:', result.error);
    
    if (result.error) {
      console.log('👤 User-friendly message:', ApiErrorHandler.getUserFriendlyMessage(result.error));
      console.log('🔄 Should show cached content:', ApiErrorHandler.shouldShowCachedContent(result.error));
    }
  }

  /**
   * Demo: HTTP error scenarios
   */
  static async demoHttpErrors() {
    console.log('🎯 Demo: HTTP error scenarios');
    
    const httpErrors = [
      { status: 404, statusText: 'Not Found' },
      { status: 500, statusText: 'Internal Server Error' },
      { status: 429, statusText: 'Too Many Requests' }
    ];

    for (const httpError of httpErrors) {
      console.log(`\n--- Testing HTTP ${httpError.status} ---`);
      
      const mockHttpError = () => Promise.reject(httpError);
      
      const result = await ApiErrorHandler.handleApiCall(
        mockHttpError,
        `demo-http-${httpError.status}-key`,
        1,
        100
      );

      console.log('✅ Result:', result);
      console.log('❌ Error code:', result.error?.code);
      console.log('🔄 Can retry:', result.error?.canRetry);
      
      if (result.error) {
        console.log('👤 User message:', ApiErrorHandler.getUserFriendlyMessage(result.error));
        console.log('🔄 Retry message:', ApiErrorHandler.getRetryMessage(result.error));
      }
    }
  }

  /**
   * Demo: Timeout error scenario
   */
  static async demoTimeoutError() {
    console.log('🎯 Demo: Timeout error scenario');
    
    const mockTimeoutError = () => new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        reject(error);
      }, 100);
    });

    const result = await ApiErrorHandler.handleApiCall(
      mockTimeoutError as any,
      'demo-timeout-key',
      1,
      200
    );

    console.log('✅ Result:', result);
    console.log('❌ Error:', result.error);
    
    if (result.error) {
      console.log('⏱️ Is timeout error:', result.error.isTimeoutError);
      console.log('🌐 Is network error:', result.error.isNetworkError);
      console.log('👤 User message:', ApiErrorHandler.getUserFriendlyMessage(result.error));
    }
  }

  /**
   * Demo: Retry mechanism with eventual success
   */
  static async demoRetryWithSuccess() {
    console.log('🎯 Demo: Retry mechanism with eventual success');
    
    let attemptCount = 0;
    const mockRetryApi = () => {
      attemptCount++;
      console.log(`📞 API call attempt ${attemptCount}`);
      
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary server error'));
      } else {
        return Promise.resolve({
          data: 'Success after retries!',
          attempts: attemptCount
        });
      }
    };

    const result = await ApiErrorHandler.handleApiCall(
      mockRetryApi,
      'demo-retry-key',
      3,
      300
    );

    console.log('✅ Result:', result);
    console.log('📊 Data:', result.data);
    console.log('🔢 Total attempts:', attemptCount);
  }

  /**
   * Demo: Error parsing functionality
   */
  static demoErrorParsing() {
    console.log('🎯 Demo: Error parsing functionality');
    
    const testErrors = [
      new Error('Network request failed'),
      { status: 401, statusText: 'Unauthorized' },
      { status: 503, statusText: 'Service Unavailable' },
      { code: 'API_ERROR', message: 'Custom API error' },
      'Unknown error type'
    ];

    testErrors.forEach((error, index) => {
      console.log(`\n--- Error ${index + 1} ---`);
      console.log('🔍 Original error:', error);
      
      const parsed = ApiErrorHandler.parseError(error);
      console.log('📋 Parsed error:', {
        code: parsed.code,
        message: parsed.message,
        isNetworkError: parsed.isNetworkError,
        isTimeoutError: parsed.isTimeoutError,
        canRetry: parsed.canRetry
      });
      
      console.log('👤 User message:', ApiErrorHandler.getUserFriendlyMessage(parsed));
    });
  }

  /**
   * Demo: Cache behavior
   */
  static async demoCacheBehavior() {
    console.log('🎯 Demo: Cache behavior');
    
    const cacheKey = 'demo-cache-behavior-key';
    const testData = {
      message: 'This is cached data',
      timestamp: new Date().toISOString()
    };

    // Set cache
    console.log('💾 Setting cache...');
    await CacheManager.set(cacheKey, testData, 5000); // 5 second TTL

    // Test immediate cache hit
    console.log('🔍 Testing immediate cache hit...');
    const cachedData = await CacheManager.get(cacheKey);
    console.log('📊 Cached data:', cachedData);

    // Test API call with cache
    console.log('📞 Testing API call with cache available...');
    const mockApi = () => Promise.resolve({ message: 'Fresh API data' });
    
    const result1 = await ApiErrorHandler.handleApiCall(mockApi, cacheKey, 1, 100);
    console.log('✅ Result with cache available:', result1);

    // Test API failure with cache
    console.log('📞 Testing API failure with cache fallback...');
    const mockFailingApi = () => Promise.reject(new Error('API is down'));
    
    const result2 = await ApiErrorHandler.handleApiCall(mockFailingApi, cacheKey, 1, 100);
    console.log('✅ Result with API failure:', result2);

    // Wait for cache to expire and test again
    console.log('⏳ Waiting for cache to expire...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    const expiredCacheData = await CacheManager.get(cacheKey);
    console.log('📊 Expired cache data:', expiredCacheData);
  }

  /**
   * Run all demos
   */
  static async runAllDemos() {
    console.log('🚀 Starting Error Handling Demo Suite');
    console.log('=====================================\n');

    try {
      await this.demoSuccessfulCall();
      console.log('\n');

      await this.demoNetworkErrorWithCache();
      console.log('\n');

      await this.demoHttpErrors();
      console.log('\n');

      await this.demoTimeoutError();
      console.log('\n');

      await this.demoRetryWithSuccess();
      console.log('\n');

      this.demoErrorParsing();
      console.log('\n');

      await this.demoCacheBehavior();
      console.log('\n');

      console.log('🎉 All demos completed successfully!');
    } catch (error) {
      console.error('💥 Demo suite error:', error);
    }
  }

  /**
   * Interactive demo for testing specific scenarios
   */
  static async interactiveDemo(scenario: string) {
    console.log(`🎯 Running interactive demo: ${scenario}`);
    
    switch (scenario) {
      case 'success':
        await this.demoSuccessfulCall();
        break;
      case 'network-error':
        await this.demoNetworkErrorWithCache();
        break;
      case 'http-errors':
        await this.demoHttpErrors();
        break;
      case 'timeout':
        await this.demoTimeoutError();
        break;
      case 'retry':
        await this.demoRetryWithSuccess();
        break;
      case 'parsing':
        this.demoErrorParsing();
        break;
      case 'cache':
        await this.demoCacheBehavior();
        break;
      case 'all':
        await this.runAllDemos();
        break;
      default:
        console.log('❓ Unknown scenario. Available scenarios:');
        console.log('- success: Successful API call');
        console.log('- network-error: Network error with cache fallback');
        console.log('- http-errors: Various HTTP error codes');
        console.log('- timeout: Request timeout scenario');
        console.log('- retry: Retry mechanism demo');
        console.log('- parsing: Error parsing functionality');
        console.log('- cache: Cache behavior demo');
        console.log('- all: Run all demos');
    }
  }
}

// Export for use in development
export default ErrorHandlingDemo;

// Usage examples:
// ErrorHandlingDemo.runAllDemos();
// ErrorHandlingDemo.interactiveDemo('network-error');
// ErrorHandlingDemo.demoSuccessfulCall();