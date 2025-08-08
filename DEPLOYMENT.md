# Web Deployment Guide

This guide covers deploying your Stem education app to various web platforms.

## Prerequisites

1. **Build the web version:**
   ```bash
   npm run build:web
   ```

2. **Test locally:**
   ```bash
   npm run serve:web
   ```

## Deployment Options

### 1. Netlify (Recommended)

**Automatic Deployment:**
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:web`
3. Set publish directory: `dist`
4. Deploy automatically on push

**Manual Deployment:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build:web
netlify deploy --prod --dir=dist
```

### 2. Vercel

**Automatic Deployment:**
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the configuration from `vercel.json`
3. Deploy automatically on push

**Manual Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
npm run build:web
vercel --prod
```

### 3. Firebase Hosting

**Setup:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build:web
firebase deploy
```

### 4. GitHub Pages

**Setup:**
```bash
# Install gh-pages
npm install -g gh-pages

# Build and deploy
npm run build:web
gh-pages -d dist
```

## Environment Variables

Make sure to set these environment variables in your deployment platform:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Performance Optimizations

### 1. Bundle Analysis
```bash
# Analyze bundle size
npx expo export --platform web --dev false
```

### 2. Image Optimization
- Use WebP format for images when possible
- Implement lazy loading (already included)
- Compress images before deployment

### 3. Caching Strategy
- Static assets cached for 1 year
- API responses cached dynamically
- Service worker handles offline functionality

## Security Considerations

### 1. Content Security Policy
Add to your hosting platform:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://vmrwfbkahlsjetgqhoof.supabase.co;
```

### 2. HTTPS
- Always use HTTPS in production
- Most platforms provide this automatically

### 3. Environment Variables
- Never expose sensitive keys in client-side code
- Use Supabase RLS policies for data security

## Monitoring and Analytics

### 1. Performance Monitoring
```javascript
// Already implemented in useWebOptimizations hook
// Monitors load times and performance metrics
```

### 2. Error Tracking
Consider adding:
- Sentry for error tracking
- Google Analytics for usage analytics

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check for platform-specific imports
   - Ensure all dependencies support web

2. **Routing Issues:**
   - Verify redirect rules are set up
   - Check that SPA routing is configured

3. **Performance Issues:**
   - Enable compression
   - Optimize images
   - Use code splitting

### Platform-Specific Notes:

**Netlify:**
- Supports form handling
- Has built-in A/B testing
- Excellent for static sites

**Vercel:**
- Great for Next.js apps
- Serverless functions support
- Automatic performance optimization

**Firebase:**
- Integrates well with other Firebase services
- Good for real-time features
- Built-in analytics

## Post-Deployment Checklist

- [ ] Test all major features
- [ ] Verify offline functionality
- [ ] Check mobile responsiveness
- [ ] Test PWA installation
- [ ] Verify performance metrics
- [ ] Set up monitoring
- [ ] Configure custom domain (if needed)
- [ ] Set up SSL certificate
- [ ] Test across different browsers

## Maintenance

### Regular Tasks:
1. Update dependencies monthly
2. Monitor performance metrics
3. Review error logs
4. Update content and features
5. Backup database regularly

### Performance Monitoring:
- Use Lighthouse for regular audits
- Monitor Core Web Vitals
- Track user engagement metrics

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review build logs for errors
3. Test locally first
4. Check environment variables
5. Verify database connectivity