import { describe, it, expect } from 'vitest';

/**
 * Environment Variable Security Tests
 * 
 * These tests verify that only safe environment variables are exposed to the browser
 */

describe('Environment Variable Security', () => {
  it('should only expose safe VITE_ prefixed variables to browser', () => {
    // Get all environment variables that start with VITE_
    const viteVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
    
    // Define patterns for dangerous variable names that should NEVER have VITE_ prefix
    const dangerousPatterns = [
      /VITE_.*SECRET/i,
      /VITE_.*API_KEY$/i,  // API_KEY without specific safe prefixes
      /VITE_.*SERVICE_ROLE/i,
      /VITE_.*PRIVATE/i,
      /VITE_.*TOKEN$/i,    // Generic tokens
      /VITE_.*PASSWORD/i,
      /VITE_.*AUTH_KEY/i,
    ];
    
    // Safe patterns that are allowed to be exposed
    const safePatterns = [
      /VITE_SUPABASE_URL/,
      /VITE_SUPABASE_PUBLISHABLE_KEY/,
      /VITE_SUPABASE_ANON_KEY/,
      /VITE_APP_/,
      /VITE_PUBLIC_/,
    ];
    
    viteVars.forEach(varName => {
      const isDangerous = dangerousPatterns.some(pattern => pattern.test(varName));
      const isSafe = safePatterns.some(pattern => pattern.test(varName));
      
      if (isDangerous && !isSafe) {
        throw new Error(`Dangerous environment variable exposed to browser: ${varName}`);
      }
    });
    
    // Verify expected safe variables exist
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined();
  });
});