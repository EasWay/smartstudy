# Keyboard Handling Fix for Group Chat Screen

## Problem
When opening the group chat screen and trying to type, the keyboard was blocking the text input field and content of the screen, making it difficult to see what was being typed and the conversation history.

## Solution
Implemented comprehensive keyboard handling improvements across multiple components:

### 1. GroupChatScreen Improvements
- Replaced basic `KeyboardAvoidingView` with improved `KeyboardAwareView` component
- Enhanced keyboard event listeners with proper timing and animation
- Improved FlatList configuration for better keyboard interactions
- Added proper content insets and keyboard adjustment behavior

### 2. MessageInput Component Enhancements
- Added better TextInput properties for keyboard handling:
  - `blurOnSubmit={false}` - Prevents input from losing focus on submit
  - `returnKeyType="default"` - Uses default return key behavior
  - `textAlignVertical="top"` - Aligns text to top for better visibility
  - `scrollEnabled={true}` - Enables scrolling within the input
  - `autoCapitalize="sentences"` - Proper capitalization
  - `autoCorrect={true}` - Enables autocorrect
  - `spellCheck={true}` - Enables spell checking

### 3. KeyboardAwareView Component
- Enhanced with animated keyboard transitions
- Better platform-specific behavior handling
- Improved keyboard offset calculations
- Added support for different keyboard behaviors

### 4. New KeyboardAwareScrollView Component
- Created specialized scroll view for chat applications
- Automatic scrolling to bottom when keyboard appears
- Better keyboard persistence and dismissal handling
- Configurable scroll behavior

## Key Features
- **Automatic Scrolling**: Content automatically scrolls to show the input field when keyboard appears
- **Smooth Animations**: Keyboard transitions are smooth and synchronized with keyboard animations
- **Platform Optimization**: Different behavior for iOS and Android
- **Content Visibility**: Ensures input field and recent messages remain visible
- **Performance**: Optimized FlatList configuration for better performance

## Technical Details
- Uses `KeyboardAvoidingView` with platform-specific behavior
- Implements keyboard event listeners for show/hide events
- Configures FlatList with proper keyboard handling properties
- Adds appropriate content insets and padding
- Uses animated transitions for smooth user experience

## Testing
To test the keyboard handling:
1. Open the group chat screen
2. Tap on the text input field
3. Verify that the keyboard appears and the content scrolls to show the input
4. Type a message and verify it's visible
5. Send the message and verify the list scrolls to show the new message
6. Dismiss the keyboard and verify the layout returns to normal

## Files Modified
- `src/screens/main/GroupChatScreen.tsx`
- `src/components/messaging/MessageInput.tsx`
- `src/components/common/KeyboardAwareView.tsx`
- `src/components/common/KeyboardAwareScrollView.tsx` (new)
- `src/components/common/index.ts`
