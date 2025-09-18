# Security Testing Guide

This guide helps you verify that your API security is properly configured.

## 🚨 Issue Found: TMDB Still Uses Client-Side API Key

**Problem:** `src/integrations/tmdb/client.ts:6` still reads `VITE_TMDB_API_KEY`

**Fix:** Remove the fallback to client-side API key and always use Edge Functions.

## Manual Security Tests

### 1. Browser DevTools Check
```bash
# Open your app in browser
npm run dev

# In DevTools Console, run:
console.log(import.meta.env)

# ✅ Should ONLY show:
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY

# ❌ Should NOT show any of these:
# VITE_TMDB_API_KEY
# VITE_ANILIST_SECRET  
# Any keys with "secret", "api_key", etc.
```

### 2. Network Tab Security Check
```bash
# With Network tab open, trigger TMDB API calls
# Visit: http://localhost:8080/tmdb

# ✅ Requests should go to:
# https://your-project.supabase.co/functions/v1/tmdb/*

# ❌ Should NOT see requests to:
# https://api.themoviedb.org/* (with api_key parameter)
```

### 3. Source Code Security Check
```bash
# In DevTools → Sources, search for:
"api_key"
"secret" 
"sk_"
"VITE_TMDB_API_KEY"

# ✅ Should find NO secret keys in any JS bundles
```

### 4. Edge Function Test
```bash
# Test Edge Functions work without client keys:
curl "https://your-project.supabase.co/functions/v1/tmdb/search/movie?query=avatar"

# ✅ Should return movie data
# This proves your TMDB_API_KEY is properly set in Vercel
```

### 5. Production Bundle Check
```bash
# Build and check production bundle
npm run build

# Search built files for secrets:
grep -r "VITE_.*KEY\|api_key\|secret" dist/

# ✅ Should only find safe VITE_ variables
```

## 🔧 Required Fix

Update `src/integrations/tmdb/client.ts` to remove client-side API key usage:

```typescript
// ❌ Current (exposes API key):
const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const useProxy = !apiKey;
if (!useProxy) u.set('api_key', apiKey as string);

// ✅ Secure version (always use Edge Functions):
const useProxy = true; // Always use Edge Function
// Remove: if (!useProxy) u.set('api_key', apiKey as string);
```

## Expected Results After Fix

- ✅ All TMDB calls go through Edge Functions
- ✅ No API keys exposed in browser
- ✅ App functions identically but securely
- ✅ TMDB_API_KEY only exists in Vercel environment (server-side)