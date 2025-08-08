import React, { useEffect, useState, useRef } from 'react';
import { View, Keyboard, Platform, ViewStyle, Animated, Dimensions } from 'react-native';

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
  extraPadding = 0,
  enableOnAndroid = true,
  keyboardVerticalOffset = 0,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    // Use different events for iOS and Android
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      // Skip on Android if disabled
      if (Platform.OS === 'android' && !enableOnAndroid) return;

      const { height, screenY } = event.endCoordinates;
      
      // Calculate actual keyboard height considering screen dimensions
      let actualKeyboardHeight = height;
      
      // On Android, adjust for navigation bar and status bar
      if (Platform.OS === 'android') {
        const bottomSpace = screenHeight - screenY;
        actualKeyboardHeight = Math.max(bottomSpace, height);
      }

      const finalHeight = actualKeyboardHeight + extraPadding - keyboardVerticalOffset;
      setKeyboardHeight(finalHeight);

      // Animate the height change
      Animated.timing(animatedHeight, {
        toValue: finalHeight,
        duration: Platform.OS === 'ios' ? 250 : 200,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      
      // Animate back to 0
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 250 : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [extraPadding, keyboardVerticalOffset, enableOnAndroid, screenHeight, animatedHeight]);

  return (
    <Animated.View
      style={[
        style,
        {
          paddingBottom: Platform.OS === 'ios' ? animatedHeight : keyboardHeight,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};