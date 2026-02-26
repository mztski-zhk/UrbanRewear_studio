import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppConfig {
  theme: 'light' | 'dark';
  debugMode: boolean;
  allowClothUpload: boolean;
  appName: string;
  version: string;
}

const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  debugMode: false,
  allowClothUpload: false,
  appName: 'UrbanRewear',
  version: '1.0.0',
};

interface ConfigContextType {
  config: AppConfig;
  setTheme: (t: 'light' | 'dark') => void;
  toggleDebug: () => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load config.json, then override with localStorage preferences
    fetch('/config.json')
      .then(r => r.json())
      .then((data: Partial<AppConfig>) => {
        const saved = localStorage.getItem('urbanrewear_config');
        const userPrefs = saved ? JSON.parse(saved) : {};
        const merged = { ...DEFAULT_CONFIG, ...data, ...userPrefs };
        setConfig(merged);
        applyTheme(merged.theme);
        setLoaded(true);
      })
      .catch(() => {
        const saved = localStorage.getItem('urbanrewear_config');
        if (saved) {
          const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
          setConfig(parsed);
          applyTheme(parsed.theme);
        }
        setLoaded(true);
      });
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const persist = (updated: AppConfig) => {
    localStorage.setItem('urbanrewear_config', JSON.stringify({ theme: updated.theme, debugMode: updated.debugMode }));
  };

  const setTheme = (t: 'light' | 'dark') => {
    const updated = { ...config, theme: t };
    setConfig(updated);
    applyTheme(t);
    persist(updated);
  };

  const toggleDebug = () => {
    const updated = { ...config, debugMode: !config.debugMode, allowClothUpload: !config.debugMode };
    setConfig(updated);
    persist(updated);
  };

  if (!loaded) return null;

  return <ConfigContext.Provider value={{ config, setTheme, toggleDebug }}>{children}</ConfigContext.Provider>;
};
