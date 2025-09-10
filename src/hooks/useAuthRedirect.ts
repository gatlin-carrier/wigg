import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  message?: string;
  enabled?: boolean;
}

/**
 * Hook that automatically redirects unauthenticated users to the auth page
 * with a message explaining why they were redirected.
 * 
 * @param options Configuration options
 * @returns whether the user is authenticated
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    redirectTo = '/auth',
    message = 'Please sign in to continue',
    enabled = true
  } = options;

  useEffect(() => {
    if (!enabled || loading) return;
    
    if (!user) {
      // Build redirect URL with message and return path
      const params = new URLSearchParams();
      params.set('message', message);
      params.set('returnTo', location.pathname + location.search);
      
      const redirectUrl = `${redirectTo}?${params.toString()}`;
      navigate(redirectUrl, { replace: true });
    }
  }, [user, loading, enabled, redirectTo, message, location.pathname, location.search, navigate]);

  return { 
    isAuthenticated: !!user, 
    isLoading: loading,
    user 
  };
}