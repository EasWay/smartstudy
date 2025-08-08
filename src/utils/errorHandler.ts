/**
 * Robust Error Handler for Color Property Access Issues
 * Helps identify and debug "Cannot read property 'white' of undefined" errors
 */

interface ColorErrorDetails {
  errorType: string;
  propertyAccessed: string;
  objectName: string;
  stackTrace: string;
  moduleInfo: string;
  timestamp: string;
}

class ColorErrorHandler {
  private static instance: ColorErrorHandler;
  private errorLog: ColorErrorDetails[] = [];

  static getInstance(): ColorErrorHandler {
    if (!ColorErrorHandler.instance) {
      ColorErrorHandler.instance = new ColorErrorHandler();
    }
    return ColorErrorHandler.instance;
  }

  /**
   * Wrap color object access with error detection
   */
  static safeColorAccess<T extends Record<string, any>>(
    colorObject: T | undefined | null,
    propertyName: keyof T,
    fallbackValue: string = '#FFFFFF',
    objectName: string = 'Colors'
  ): string {
    try {
      // Check if the color object exists
      if (!colorObject) {
        this.logColorError({
          errorType: 'NULL_COLOR_OBJECT',
          propertyAccessed: String(propertyName),
          objectName,
          stackTrace: new Error().stack || 'No stack trace available',
          moduleInfo: this.getModuleInfo(),
          timestamp: new Date().toISOString(),
        });
        console.warn(`⚠️ Color object '${objectName}' is null/undefined. Using fallback: ${fallbackValue}`);
        return fallbackValue;
      }

      // Check if the property exists
      if (!(propertyName in colorObject)) {
        this.logColorError({
          errorType: 'MISSING_COLOR_PROPERTY',
          propertyAccessed: String(propertyName),
          objectName,
          stackTrace: new Error().stack || 'No stack trace available',
          moduleInfo: this.getModuleInfo(),
          timestamp: new Date().toISOString(),
        });
        console.warn(`⚠️ Color property '${String(propertyName)}' not found in '${objectName}'. Available properties: ${Object.keys(colorObject).join(', ')}. Using fallback: ${fallbackValue}`);
        return fallbackValue;
      }

      const value = colorObject[propertyName];
      
      // Validate the color value
      if (typeof value !== 'string') {
        this.logColorError({
          errorType: 'INVALID_COLOR_TYPE',
          propertyAccessed: String(propertyName),
          objectName,
          stackTrace: new Error().stack || 'No stack trace available',
          moduleInfo: this.getModuleInfo(),
          timestamp: new Date().toISOString(),
        });
        console.warn(`⚠️ Color property '${String(propertyName)}' is not a string (got ${typeof value}). Using fallback: ${fallbackValue}`);
        return fallbackValue;
      }

      return value;
    } catch (error) {
      this.logColorError({
        errorType: 'UNEXPECTED_ERROR',
        propertyAccessed: String(propertyName),
        objectName,
        stackTrace: error instanceof Error ? error.stack || 'No stack trace' : 'Unknown error',
        moduleInfo: this.getModuleInfo(),
        timestamp: new Date().toISOString(),
      });
      console.error(`🚨 Unexpected error accessing color property '${String(propertyName)}':`, error);
      return fallbackValue;
    }
  }

  private static logColorError(details: ColorErrorDetails): void {
    const handler = ColorErrorHandler.getInstance();
    handler.errorLog.push(details);
    
    // Log to console with detailed information
    console.group(`🚨 Color Access Error: ${details.errorType}`);
    console.log('Property:', details.propertyAccessed);
    console.log('Object:', details.objectName);
    console.log('Time:', details.timestamp);
    console.log('Module Info:', details.moduleInfo);
    console.log('Stack Trace:', details.stackTrace);
    console.groupEnd();
  }

  private static getModuleInfo(): string {
    try {
      const stack = new Error().stack;
      if (!stack) return 'No module info available';
      
      const lines = stack.split('\n');
      // Find the first line that's not from this error handler
      const relevantLine = lines.find(line => 
        !line.includes('errorHandler.ts') && 
        !line.includes('Error.') &&
        line.includes('at ')
      );
      
      return relevantLine ? relevantLine.trim() : 'Module info not available';
    } catch {
      return 'Error getting module info';
    }
  }

  /**
   * Get all logged errors
   */
  getErrorLog(): ColorErrorDetails[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Print error summary
   */
  printErrorSummary(): void {
    if (this.errorLog.length === 0) {
      console.log('✅ No color access errors logged');
      return;
    }

    console.group('📊 Color Error Summary');
    console.log(`Total errors: ${this.errorLog.length}`);
    
    const errorTypes = this.errorLog.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Error types:', errorTypes);
    
    const properties = this.errorLog.reduce((acc, error) => {
      acc[error.propertyAccessed] = (acc[error.propertyAccessed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Most accessed properties:', properties);
    console.groupEnd();
  }
}

/**
 * Global error handler for unhandled color-related errors
 */
export const setupGlobalColorErrorHandler = () => {
  const originalError = console.error;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this is a color-related error
    if (message.includes("Cannot read property 'white'") || 
        message.includes("Cannot read property") && message.includes('of undefined')) {
      
      console.group('🚨 Detected Color Property Error');
      console.log('Original error:', message);
      console.log('This might be related to accessing undefined color objects');
      console.log('Check your color imports and ensure Colors object is properly initialized');
      console.groupEnd();
      
      // Log additional debugging info
      ColorErrorHandler.getInstance().printErrorSummary();
    }
    
    // Call original console.error
    originalError.apply(console, args);
  };
};

export { ColorErrorHandler };