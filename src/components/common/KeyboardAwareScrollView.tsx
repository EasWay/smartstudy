import React, { useRef, useEffect } from 'react';
import { ScrollView, ScrollViewProps, Platform, Keyboard, ViewStyle } from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardOffset?: number;
  enableAutomaticScroll?: boolean;
  extraScrollHeight?: number;
}

export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
  keyboardOffset = 0,
  enableAutomaticScroll = true,
  extraScrollHeight = 20,
  ...scrollViewProps
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!enableAutomaticScroll) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const delay = Platform.OS === 'ios' ? 100 : 200;
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, delay);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Optional: Add any logic for when keyboard hides
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [enableAutomaticScroll]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={style}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: extraScrollHeight }
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      automaticallyAdjustContentInsets={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
};
