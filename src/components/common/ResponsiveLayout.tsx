import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { isWeb, isDesktop, isMobile, getBreakpoint } from '../../utils/platformUtils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: number;
  scrollable?: boolean;
  style?: any;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 1200,
  padding = 16,
  scrollable = true,
  style,
}) => {
  const breakpoint = getBreakpoint();
  
  const containerStyle = [
    styles.container,
    {
      maxWidth: isDesktop() ? maxWidth : '100%',
      paddingHorizontal: isMobile() ? padding : padding * 1.5,
      paddingVertical: padding,
    },
    style,
  ];

  const content = (
    <View style={containerStyle}>
      {children}
    </View>
  );

  if (scrollable && isWeb) {
    return (
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
});

export default ResponsiveLayout;