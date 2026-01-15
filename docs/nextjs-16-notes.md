# Next.js 16 Compatibility Notes

## Issues Fixed

### 1. Turbopack/Webpack Conflict
**Error:** `This build is using Turbopack, with a 'webpack' config and no 'turbopack' config`

**Cause:** Next.js 16 uses Turbopack by default, but `next-pwa` requires webpack.

**Solution:**
- Added `turbopack: {}` to `next.config.ts`
- Updated dev script to `next dev --webpack` in `package.json`

### 2. Middleware Deprecation Warning
**Warning:** `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`

**Cause:** Next.js is deprecating `middleware.ts` in favor of a new proxy system.

**Status:** Safe to ignore for now. We need `src/middleware.ts` for Supabase auth session refresh. This is a common pattern and will continue to work.

**Future:** May need to migrate to the new proxy system once Supabase provides updated examples.

## Running the App

```bash
# Development (uses webpack explicitly)
npm run dev

# Production build
npm run build
npm start
```

The middleware warning will appear but is harmless - Supabase auth session refresh requires middleware and this pattern is still supported.
