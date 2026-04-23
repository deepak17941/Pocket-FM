import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colorFromId } from '../utils/format';

type Props = {
  id: string;
  title?: string;
  size: number;
  radius: number;
  style?: ViewStyle;
  iconSize?: number;
};

export const AlbumArt = ({ id, title, size, radius, style, iconSize }: Props) => {
  const base = colorFromId(id);
  const letter = (title || '?').trim().charAt(0).toUpperCase() || '♪';
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: base,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
      testID={`album-art-${id}`}
    >
      <View style={[StyleSheet.absoluteFill, styles.overlayTop]} />
      <View style={[StyleSheet.absoluteFill, styles.overlayBottom]} />
      {letter === '♪' ? (
        <Ionicons name="musical-notes" size={iconSize ?? size * 0.4} color="rgba(255,255,255,0.9)" />
      ) : (
        <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: size * 0.42, fontWeight: '800', letterSpacing: -1 }}>
          {letter}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayTop: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    bottom: '50%',
  },
  overlayBottom: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    top: '50%',
  },
});
