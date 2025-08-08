// App color scheme - Ghana Education App Theme
const ColorDefinitions = {
  // Theme colors
  background: '#121212', // --color-bg-dark
  primary: '#4ADE80', // --color-primary
  primaryText: '#FFFFFF', // --color-text-primary
  secondaryText: '#B0B0B0', // --color-text-secondary
  accent: '#4ADE80', // --color-accent-mint

  // Additional UI colors
  secondary: '#B0B0B0', // --color-text-secondary
  success: '#06D6A0', // --color-accent-green
  warning: '#FFD166', // --color-accent-yellow
  error: '#FF4C4C', // --color-error
  surface: '#1E1E1E', // --color-surface
  text: '#FFFFFF', // --color-text-primary
  textSecondary: '#B0B0B0', // --color-text-secondary
  border: '#2C2C2C', // --color-border
  placeholder: '#B0B0B0', // --color-text-secondary
  white: '#FFFFFF', // --color-text-primary

  // Category accents
  accentBlue: '#3A86FF', // --color-accent-blue
  accentGreen: '#06D6A0', // --color-accent-green
  accentYellow: '#FFD166', // --color-accent-yellow
  accentPurple: '#8338EC', // --color-accent-purple
  accentMint: '#4ADE80', // --color-accent-mint

  // Additional colors needed for study groups
  shadow: '#000000',
  disabled: '#444444', // --color-tab-inactive

  // Additional colors for messaging
  primaryLight: '#4ADE80', // --color-tab-active
  messageBackground: '#1E1E1E', // --color-surface
} as const;

// Validation function
const validateColors = (colors: typeof ColorDefinitions): void => {
  console.log('🎨 Validating Colors object...');
  
  // Check if colors object exists
  if (!colors) {
    throw new Error('Colors object is null or undefined');
  }

  // Check if it's an object
  if (typeof colors !== 'object') {
    throw new Error(`Colors must be an object, got ${typeof colors}`);
  }

  // Validate that all required colors exist
  const requiredColors = ['background', 'primary', 'primaryText', 'text', 'white'] as const;
  for (const color of requiredColors) {
    if (!(color in colors)) {
      throw new Error(`Required color '${color}' is missing from Colors object. Available colors: ${Object.keys(colors).join(', ')}`);
    }
    
    const value = colors[color];
    if (typeof value !== 'string') {
      throw new Error(`Color '${color}' must be a string, got ${typeof value}: ${value}`);
    }
    
    if (!value.startsWith('#')) {
      console.warn(`⚠️ Color '${color}' doesn't start with #: ${value}`);
    }
  }

  console.log('✅ Colors validation passed');
  console.log('Available colors:', Object.keys(colors));
};

// Validate the colors before exporting
try {
  validateColors(ColorDefinitions);
} catch (error) {
  console.error('❌ Color validation failed:', error);
  throw error;
}

// Export the validated colors
export const Colors = ColorDefinitions;
export const colors = ColorDefinitions; // Lowercase export for compatibility

// Additional safety check after export
if (!Colors || !Colors.white) {
  console.error('❌ Critical: Colors.white is not available after export');
  console.error('Colors object:', Colors);
  throw new Error('Colors.white is not available - this will cause runtime errors');
}

console.log('✅ Colors module loaded successfully with white color:', Colors.white);