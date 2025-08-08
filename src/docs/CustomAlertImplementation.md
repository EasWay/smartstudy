# Custom Alert Implementation

## Overview
This document outlines the implementation of custom alerts throughout the resource management system, replacing all standard React Native Alert components with the app's custom alert component.

## Changes Made

### 1. ResourceManagementScreen Updates
- **Import Changes**: Added `useCustomAlert` hook import
- **Hook Integration**: Added `const { showAlert, AlertComponent } = useCustomAlert();`
- **Alert Replacements**: Replaced all `Alert.alert()` calls with `showAlert()`
- **Component Integration**: Added `<AlertComponent />` to the render method

#### Specific Alert Replacements:
1. **Resource Loading Error**: Error when fetching user resources
2. **Delete Confirmation**: Confirmation dialog for single resource deletion
3. **Delete Error**: Error when single resource deletion fails
4. **Bulk Delete Confirmation**: Confirmation dialog for bulk deletion
5. **Bulk Delete Partial Success**: Alert when some deletions fail
6. **Bulk Delete Error**: Error when bulk deletion fails
7. **Resource Details**: Information dialog when resource is pressed

### 2. ResourcesScreen Updates
- **Import Changes**: Added `useCustomAlert` hook import, removed `Alert` import
- **Hook Integration**: Added custom alert hook
- **Alert Replacement**: Replaced resource details alert with custom alert
- **Component Integration**: Added `<AlertComponent />` to the render method

## Technical Implementation

### Hook Usage Pattern
```typescript
// Import the hook
import { useCustomAlert } from '../../components/common/CustomAlert';

// Initialize in component
const { showAlert, AlertComponent } = useCustomAlert();

// Use showAlert instead of Alert.alert
showAlert(
  'Title',
  'Message',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: () => handleAction() }
  ]
);

// Add AlertComponent to render
return (
  <View>
    {/* Other components */}
    <AlertComponent />
  </View>
);
```

### Alert Types Implemented

#### 1. Error Alerts
```typescript
showAlert('Error', 'Failed to load your resources');
showAlert('Error', 'Failed to delete resource');
showAlert('Error', 'Failed to delete resources');
```

#### 2. Confirmation Alerts
```typescript
showAlert(
  'Delete Resource',
  `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => confirmDelete() }
  ]
);
```

#### 3. Information Alerts
```typescript
showAlert(
  resource.title,
  `Type: ${resource.resourceType}\nSize: ${fileSize}\nUploaded: ${date}`,
  [
    { text: 'View', onPress: () => viewResource() },
    { text: 'Download', onPress: () => downloadResource() },
    { text: 'Close', style: 'cancel' }
  ]
);
```

#### 4. Status Alerts
```typescript
showAlert(
  'Partial Success',
  `${successCount} resources deleted successfully. ${failedCount} failed to delete.`
);
```

## Benefits of Custom Alerts

### 1. Visual Consistency
- All alerts now match the app's dark theme
- Consistent typography and spacing
- Proper color scheme integration

### 2. Better User Experience
- Themed buttons with proper styling
- Smooth animations and transitions
- Better accessibility support

### 3. Maintainability
- Centralized alert styling
- Easy to update appearance across the app
- Consistent behavior patterns

## Custom Alert Features

### Button Styles
- **Default**: Primary button style with app's primary color
- **Cancel**: Secondary button style with border
- **Destructive**: Red button for dangerous actions

### Theme Integration
- **Background**: Uses `Colors.surface` for modal background
- **Text**: Uses `Colors.primaryText` for titles, `Colors.textSecondary` for messages
- **Buttons**: Properly themed based on button type

### Responsive Design
- Adapts to different screen sizes
- Proper padding and margins
- Accessible touch targets

## Files Modified

1. **Stem/src/screens/main/ResourceManagementScreen.tsx**
   - Added custom alert hook
   - Replaced 7 Alert.alert calls
   - Added AlertComponent to render

2. **Stem/src/screens/main/ResourcesScreen.tsx**
   - Added custom alert hook
   - Replaced 1 Alert.alert call
   - Added AlertComponent to render

## Testing Recommendations

### 1. Alert Functionality
- Test all confirmation dialogs (delete, bulk delete)
- Verify error alerts appear correctly
- Check information alerts display properly

### 2. Visual Consistency
- Verify all alerts use the app theme
- Check button styling matches design
- Ensure proper text contrast

### 3. User Interaction
- Test button press handling
- Verify alert dismissal works correctly
- Check keyboard navigation (accessibility)

### 4. Edge Cases
- Test with long messages
- Verify behavior with many buttons
- Check on different screen sizes

## Future Enhancements

1. **Animation Improvements**: Add custom enter/exit animations
2. **Sound Integration**: Add optional sound effects for different alert types
3. **Haptic Feedback**: Add vibration for important alerts
4. **Custom Icons**: Add icons to different alert types
5. **Toast Notifications**: Implement toast-style alerts for non-critical messages

## Migration Guide for Other Components

To migrate other components to use custom alerts:

1. **Import the hook**:
   ```typescript
   import { useCustomAlert } from '../../components/common/CustomAlert';
   ```

2. **Initialize in component**:
   ```typescript
   const { showAlert, AlertComponent } = useCustomAlert();
   ```

3. **Replace Alert.alert calls**:
   ```typescript
   // Before
   Alert.alert('Title', 'Message', buttons);
   
   // After
   showAlert('Title', 'Message', buttons);
   ```

4. **Add AlertComponent to render**:
   ```typescript
   return (
     <View>
       {/* Your component content */}
       <AlertComponent />
     </View>
   );
   ```

5. **Remove Alert import**:
   ```typescript
   // Remove this line
   import { Alert } from 'react-native';
   ```

This ensures consistent alert styling and behavior throughout the entire application.