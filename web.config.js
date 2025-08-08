// Web-specific configuration for production deployment
module.exports = {
  // Service Worker configuration
  serviceWorker: {
    enabled: true,
    swSrc: './public/sw.js',
  },
  
  // PWA configuration
  pwa: {
    enabled: true,
    manifestPath: './public/manifest.json',
  },
  
  // Performance optimizations
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  
  // Asset optimization
  assets: {
    // Enable compression
    compression: true,
    // Image optimization
    images: {
      formats: ['webp', 'avif'],
      quality: 80,
    },
  },
  
  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
};