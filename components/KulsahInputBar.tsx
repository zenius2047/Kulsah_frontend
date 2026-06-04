import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeMode, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import { fontSize } from './typography';

type KulsahInputBarProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
};

const KulsahInputBar = React.forwardRef<TextInput, KulsahInputBarProps>(
  (
    {
      containerStyle,
      inputStyle,
      leftAccessory,
      rightAccessory,
      onBlur,
      onFocus,
      placeholderTextColor,
      style,
      ...props
    },
    ref
  ) => {
    const { isDark, theme } = useThemeMode();
    const [focused, setFocused] = useState(false);
    const backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
    const borderColor = focused ? primaryColorAlpha(0.55) : theme.border;

    return (
      <View style={[styles.inputRow, { backgroundColor, borderColor }, containerStyle]}>
        {leftAccessory}
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderTextColor ?? theme.textMuted}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          style={[styles.input, { color: theme.text }, inputStyle, style]}
          {...props}
        />
        {rightAccessory}
      </View>
    );
  }
);

KulsahInputBar.displayName = 'KulsahInputBar';

const styles = StyleSheet.create({
  inputRow: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
    justifyContent: 'center',
    // alignItems: 'center'
  },
  input: {
    flex: 1,
    minHeight: 29,
    paddingVertical: 0,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
});

export default KulsahInputBar;
