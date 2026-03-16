# Vercel Deployment Guide

## Environment Variables Required

Set these in your Vercel project settings:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

Get these values from your Supabase project dashboard → Settings → API.

## Build Configuration

The project is configured for Vercel deployment with:

- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Framework**: Vite
- ✅ **Node Version**: 18.x
- ✅ **Code Splitting**: Optimized chunks for better performance
- ✅ **PWA Support**: Service worker and manifest included

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework

3. **Set Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add the two Supabase variables from above

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-project.vercel.app`

## Build Optimization

The project includes:

- **Manual Code Splitting**: Separates vendor, UI, charts, and app logic
- **Chunk Size Limits**: Set to 1MB for optimal loading
- **PWA Configuration**: Service worker and offline support
- **Asset Optimization**: Images and fonts cached properly

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18.x)
- Ensure all dependencies are installed: `npm install`
- Verify environment variables are set

### Runtime Errors
- Check Supabase connection in browser console
- Verify environment variables in Vercel dashboard
- Check network tab for failed API calls

### PWA Issues
- Service worker should be served from `/sw.js`
- Manifest should be available at `/manifest.webmanifest`
- Check Lighthouse report for PWA compliance

## Performance

The optimized build creates:
- **Main bundle**: ~486KB (gzipped: 117KB)
- **Total assets**: ~2.5MB (gzipped: ~650KB)
- **First paint**: Optimized with code splitting
- **Cache strategy**: Service worker with proper caching

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify Supabase project is active
3. Ensure environment variables are correct
4. Test locally with `npm run preview`
