import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const DOTS = ['#de1bfb', '#9e52f2', '#38a9e5'];

type DotProps = {
  color: string;
  delay: number;
};

const Dot: React.FC<DotProps> = ({ color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 1],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, opacity, transform: [{ scale }] },
      ]}
    />
  );
};

const DotTrioLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      {DOTS.map((color, index) => (
        <Dot key={color} color={color} delay={index * 200} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default DotTrioLoader;
