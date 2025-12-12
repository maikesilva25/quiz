import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ShopItem } from '../types';

interface ProfileFrameProps {
  frameItem?: ShopItem | null;
  children: React.ReactNode;
  size?: number;
}

export const ProfileFrame: React.FC<ProfileFrameProps> = ({
  frameItem,
  children,
  size = 100,
}) => {
  if (!frameItem) {
    return <>{children}</>;
  }

  const frameColor = frameItem.metadata?.frameColor || '#3B82F6';
  const frameStyle = frameItem.metadata?.frameStyle || 'solid';

  const getFrameStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: size + 8,
      height: size + 8,
      borderRadius: (size + 8) / 2,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (frameStyle) {
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: frameColor,
          borderWidth: 3,
          borderColor: '#FBBF24',
        };
      case 'rainbow':
        return {
          ...baseStyle,
          borderWidth: 4,
          borderColor: frameColor,
        };
      case 'diamond':
        return {
          ...baseStyle,
          backgroundColor: '#E0E7FF',
          borderWidth: 3,
          borderColor: '#818CF8',
        };
      default:
        return {
          ...baseStyle,
          borderWidth: 4,
          borderColor: frameColor,
        };
    }
  };

  return (
    <View style={getFrameStyle()}>
      {children}
    </View>
  );
};

