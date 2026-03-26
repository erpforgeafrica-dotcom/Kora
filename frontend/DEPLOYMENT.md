# Production Environment Configuration

## Environment Variables

Create `.env.production` file:

```env
# API Configuration
VITE_API_BASE_URL=https://api.kora.app
VITE_ORG_ID=org_production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Build Configuration
VITE_BUILD_TIMESTAMP=true
```

## Build Optimization

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'form-vendor': ['react-hook-form'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['zustand'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

## Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

## Security Headers

Configure in your web server (nginx/Apache):

```nginx
# nginx.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Caching Strategy

```nginx
# Cache static assets for 1 year
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Don't cache HTML
location ~* \.html$ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# SPA fallback
location / {
  try_files $uri $uri/ /index.html;
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## Monitoring & Analytics

### Error Tracking (Sentry)

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### Performance Monitoring (Web Vitals)

```typescript
// src/utils/vitals.ts
export function reportWebVitals() {
  if ('web-vital' in window) {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
    
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  }
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Verify all routes load
- [ ] Check console for errors
- [ ] Test keyboard shortcuts
- [ ] Verify API integration
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit
- [ ] Check bundle size

### Build Verification
- [ ] Bundle size < 500KB gzipped
- [ ] No console errors
- [ ] No console warnings
- [ ] All images optimized
- [ ] All fonts loaded
- [ ] CSS minified
- [ ] JS minified
- [ ] Source maps generated

### Environment Setup
- [ ] `.env.production` configured
- [ ] API endpoints correct
- [ ] Auth tokens configured
- [ ] Error tracking enabled
- [ ] Analytics enabled
- [ ] Security headers set

### Deployment
- [ ] Build artifacts uploaded
- [ ] CDN cache cleared
- [ ] DNS propagated
- [ ] SSL certificate valid
- [ ] Monitoring active
- [ ] Error tracking active
- [ ] Analytics tracking

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features work
- [ ] Test user flows
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Gather user feedback

## Rollback Plan

If issues occur:

1. **Immediate**: Revert to previous build
2. **Investigation**: Check error logs and metrics
3. **Fix**: Deploy hotfix
4. **Verification**: Test thoroughly before re-deploying

## Monitoring Dashboard

Key metrics to monitor:

- **Error Rate**: Should be < 0.1%
- **API Response Time**: Should be < 200ms
- **Page Load Time**: Should be < 2s
- **User Sessions**: Track active users
- **Feature Usage**: Track feature adoption
- **Browser Crashes**: Monitor for issues

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Security audit quarterly
- User feedback review weekly

### Update Strategy
- Test updates in staging first
- Deploy during low-traffic periods
- Have rollback plan ready
- Monitor closely after deployment
- Communicate with users

## Support

### Common Issues

**Issue**: High error rate
- Check error logs in Sentry
- Review recent changes
- Check API health
- Rollback if necessary

**Issue**: Slow page loads
- Check Web Vitals
- Review bundle size
- Check API response times
- Optimize images/assets

**Issue**: Users can't login
- Check auth service
- Verify tokens
- Check CORS headers
- Review auth logs

---

**Last Updated**: Phase 8 Complete  
**Status**: Ready for Production Deployment
