import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { fontSize } from './typography';
import ExpressionPicker, { type ExpressionPickerProps } from './ExpressionPicker';

export type KulsahExpressionPickerConfig = Omit<
  ExpressionPickerProps,
  'isOpen' | 'onClose' | 'onEmojiSelect'
> & {
  onEmojiSelected?: (emoji: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
};

type KulsahInputBarProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  expressionPicker?: KulsahExpressionPickerConfig;
};

const KulsahInputBar = React.forwardRef<TextInput, KulsahInputBarProps>(
  (
    {
      containerStyle,
      inputStyle,
      leftAccessory,
      rightAccessory,
      expressionPicker,
      onBlur,
      onFocus,
      onChangeText,
      placeholderTextColor,
      style,
      value,
      ...props
    },
    ref
  ) => {
    const { isDark, theme } = useThemeMode();
    const [focused, setFocused] = useState(false);
    const [isExpressionPickerOpen, setIsExpressionPickerOpen] = useState(false);
    const backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
    const borderColor = focused ? primaryColorAlpha(0.55) : theme.border;

    const setExpressionPickerOpen = (isOpen: boolean) => {
      setIsExpressionPickerOpen(isOpen);
      expressionPicker?.onOpenChange?.(isOpen);
    };

    const selectEmoji = (emoji: string) => {
      onChangeText?.(`${typeof value === 'string' ? value : ''}${emoji}`);
      expressionPicker?.onEmojiSelected?.(emoji);
    };

    return (
      <>
        <View style={[styles.inputRow, { backgroundColor, borderColor }, containerStyle]}>
          {leftAccessory}
          <TextInput includeFontPadding={false}
            ref={ref}
            value={value}
            onChangeText={onChangeText}
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
          {expressionPicker ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isExpressionPickerOpen ? 'Close expression picker' : 'Open emoji, sticker, and gift picker'}
              hitSlop={8}
              onPress={() => {
                if (!isExpressionPickerOpen) Keyboard.dismiss();
                setExpressionPickerOpen(!isExpressionPickerOpen);
              }}
              style={styles.emojiButton}
            >
              <MaterialIcons
                name={isExpressionPickerOpen ? 'keyboard' : 'mood'}
                size={23}
                color={isExpressionPickerOpen ? PRIMARY_COLOR : theme.textMuted}
              />
            </Pressable>
          ) : null}
          {rightAccessory}
        </View>
        {expressionPicker ? (
          <ExpressionPicker
            {...expressionPicker}
            isOpen={isExpressionPickerOpen}
            onClose={() => setExpressionPickerOpen(false)}
            onEmojiSelect={selectEmoji}
          />
        ) : null}
      </>
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
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  emojiButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KulsahInputBar;
