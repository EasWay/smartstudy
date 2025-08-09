import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  extraPadding?: number;
  enableOnAndroid?: boolean;
  keyboardVerticalOffset?: number;
}

export const KeyboardAwareView: React.FC<KeyboardAwareViewProps> = ({
  children,
  style,
  keyboardVerticalOffset = 0,
}) => {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
};