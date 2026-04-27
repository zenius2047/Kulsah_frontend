import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type GradientTextProps = {
  gradientText: string;
  style?: StyleProp<TextStyle>;
};

export default function GradientText({ gradientText, style }: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={style}>
          {gradientText}
        </Text>
      }
    >
      <LinearGradient
        colors={['#cd2bee', '#cd2bee']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          style={[style, { opacity: 0 }]}
        >
          {gradientText}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
