import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const setHeaderConfig = (newConfig: HeaderConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetHeader = () => {
    setConfig({
      showBackButton: true,
      showHomeButton: true,
    });
  };

  return (
    <HeaderContext.Provider value={{ config, setHeaderConfig, resetHeader }}>
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
  }, [setHeaderConfig, resetHeader, config.title, config.subtitle, config.showBackButton, config.showHomeButton]);
}