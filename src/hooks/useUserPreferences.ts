import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { type GraphType } from '@/components/ui/GraphTypeSelector';

interface UserPreferences {
  graph_type: GraphType;
  preferred_media_types: Array<{ type: string; priority: number }>;
  hidden_media_types: string[];
  rating_ui?: 'buttons' | 'dial' | 'slider' | 'grid' | 'affect' | 'swipe' | 'hybrid' | 'paint';
}

const defaultPreferences: UserPreferences = {
  graph_type: 'curve',
  preferred_media_types: [],
  hidden_media_types: [],
  rating_ui: 'buttons',
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(defaultPreferences);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('graph_type, preferred_media_types, hidden_media_types, rating_ui')
        .eq('id', user.id)
        .maybeSingle();

      // Handle the case where graph_type column doesn't exist yet
      if (dbError && dbError.code === '42703') {
        console.warn('graph_type column not found in profiles table. Using default preferences.');
        setPreferences(defaultPreferences);
        return;
      }

      if (dbError) throw dbError;

      if (data) {
        setPreferences({
          graph_type: (data as any).graph_type || defaultPreferences.graph_type,
          preferred_media_types: Array.isArray((data as any).preferred_media_types) 
            ? (data as any).preferred_media_types 
            : defaultPreferences.preferred_media_types,
          hidden_media_types: Array.isArray((data as any).hidden_media_types) 
            ? (data as any).hidden_media_types 
            : defaultPreferences.hidden_media_types,
          rating_ui: (data as any).rating_ui || defaultPreferences.rating_ui,
        });
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (err) {
      console.error('Error loading user preferences:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update a specific preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: value };
    
    // Optimistic update
    setPreferences(newPreferences);

    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          [key]: value,
        });

      // If the column is missing in schema (e.g., rating_ui before migration), quietly ignore
      if (dbError) {
        const code = (dbError as any)?.code;
        if (code === '42703' || String(code || '').startsWith('PGRST')) {
          console.warn(`Preference column missing (${String(code)}). Skipping server save for key:`, String(key));
          return; // keep optimistic client state
        }
        throw dbError;
      }
    } catch (err) {
      console.error(`Error updating ${key}:`, err);
      // Revert optimistic update
      setPreferences(preferences);
      throw err;
    }
  }, [user, preferences]);

  // Batch update multiple preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    const newPreferences = { ...preferences, ...updates };
    
    // Optimistic update
    setPreferences(newPreferences);

    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
        });

      if (dbError) {
        const code = (dbError as any)?.code;
        if (code === '42703' || String(code || '').startsWith('PGRST')) {
          // Retry without any unknown columns (e.g., rating_ui) to avoid hard failure
          const sanitized = { ...updates } as any;
          delete sanitized.rating_ui;
          const { error: fallbackError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...sanitized });
          if (fallbackError) throw fallbackError;
          return;
        }
        throw dbError;
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      // Revert optimistic update
      setPreferences(preferences);
      throw err;
    }
  }, [user, preferences]);

  // Load preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updatePreferences,
    refresh: loadPreferences,
  };
}
