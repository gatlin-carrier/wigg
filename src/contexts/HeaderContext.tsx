import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface HeaderConfig {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  rightContent?: ReactNode;
}

interface HeaderContextType {
  config: HeaderConfig;
  setHeaderConfig: (config: HeaderConfig) => void;
  resetHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({
    showBackButton: true,
    showHomeButton: true,
  });

  const setHeaderConfig = useCallback((newConfig: HeaderConfig) => {
    setConfig(prev => {
      const next = { ...prev, ...newConfig };
      // Shallow skip if nothing changed
      if (
        prev.title === next.title &&
        prev.subtitle === next.subtitle &&
        prev.showBackButton === next.showBackButton &&
        prev.showHomeButton === next.showHomeButton &&
        prev.rightContent === next.rightContent
      ) return prev;
      return next;
    });
  }, []);

  const resetHeader = useCallback(() => {
    setConfig(prev => {
      const next = { showBackButton: true, showHomeButton: true } as HeaderConfig;
      if (
        prev.title === undefined &&
        prev.subtitle === undefined &&
        prev.showBackButton === next.showBackButton &&
        prev.showHomeButton === next.showHomeButton &&
        prev.rightContent === undefined
      ) return prev;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ config, setHeaderConfig, resetHeader }), [config, setHeaderConfig, resetHeader]);

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

// Hook to configure header for a page
export function usePageHeader(config: HeaderConfig) {
  const { setHeaderConfig, resetHeader } = useHeader();
  
  React.useEffect(() => {
    setHeaderConfig(config);
    return () => {
      resetHeader();
    };
  }, [setHeaderConfig, resetHeader, config.title, config.subtitle, config.showBackButton, config.showHomeButton, config.rightContent]);
}
