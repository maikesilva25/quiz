import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  border: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#8B5CF6', // Roxo vibrante
  accent: '#EC4899', // Rosa vibrante
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  border: '#E0E0E0',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  primary: '#A78BFA', // Roxo mais claro para dark mode
  accent: '#F472B6', // Rosa mais claro para dark mode
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  border: '#333333',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  
  const isDark = theme === 'auto' 
    ? systemColorScheme === 'dark' 
    : theme === 'dark';
  
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

