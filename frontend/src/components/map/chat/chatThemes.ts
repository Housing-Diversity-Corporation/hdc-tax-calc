/**
 * Chat Theme Configuration for Churro Chatbot
 * Supports both glassmorphic and original solid themes
 */

export type ChatTheme = 'glassmorphic' | 'original';

export interface ThemeConfig {
  // Container styles
  containerBg: string;
  containerBorder: string;
  containerShadow: string;
  containerBackdropFilter?: string;

  // Header styles
  headerBg: string;
  headerBorder: string;
  headerText: string;

  // Message bubbles
  userMessageBg: string;
  userMessageText: string;
  userMessageBorder: string;

  assistantMessageBg: string;
  assistantMessageText: string;
  assistantMessageBorder: string;

  systemMessageBg: string;
  systemMessageText: string;
  systemMessageBorder: string;

  // Input area
  inputAreaBg: string;
  inputAreaBorder: string;
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;

  // Actions panel
  actionsPanelBg: string;
  actionsPanelBorder: string;
  actionsPanelText: string;

  // Suggested prompts
  suggestedPromptBg: string;
  suggestedPromptBorder: string;
  suggestedPromptText: string;
  suggestedPromptHoverBg: string;

  // Bubble (collapsed state)
  bubbleBg: string;
  bubbleBorder: string;
  bubbleHoverBg: string;
}

/**
 * Glassmorphic Theme - Dark Mode
 * Enhanced frosted glass effect with Churro's brown tones
 * Designed to float over the map while showing content through
 * Dark mode: White text, light message backgrounds
 */
export const glassmorphicThemeDark: ThemeConfig = {
  // Container - 98% transparent (2% opacity) with maximum blur
  containerBg: 'rgba(120, 83, 55, 0.02)',
  containerBorder: 'rgba(255, 255, 255, 0.25)',
  containerShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.4), 0 2px 16px 0 rgba(0, 0, 0, 0.25)',
  containerBackdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',

  // Header - more transparent with enhanced glass effect
  headerBg: 'linear-gradient(to right, rgba(139, 115, 85, 0.6), rgba(107, 68, 35, 0.6))',
  headerBorder: 'rgba(107, 68, 35, 0.25)',
  headerText: '#ffffff',

  // User messages - LIGHT background for dark mode
  userMessageBg: 'rgba(200, 180, 160, 0.85)',
  userMessageText: '#ffffff',
  userMessageBorder: 'rgba(139, 115, 85, 0.4)',

  // Assistant messages - LIGHT background for dark mode
  assistantMessageBg: 'rgba(220, 220, 220, 0.75)',
  assistantMessageText: '#ffffff',
  assistantMessageBorder: 'rgba(255, 255, 255, 0.25)',

  // System messages - lighter glass
  systemMessageBg: 'rgba(180, 160, 140, 0.6)',
  systemMessageText: '#ffffff',
  systemMessageBorder: 'rgba(255, 255, 255, 0.3)',

  // Input area - lighter with enhanced transparency
  inputAreaBg: 'rgba(255, 255, 255, 0.08)',
  inputAreaBorder: 'rgba(107, 68, 35, 0.15)',
  inputBg: 'rgba(120, 83, 55, 0.25)',
  inputText: '#ffffff',
  inputPlaceholder: 'rgba(255, 255, 255, 0.7)',

  // Actions panel - more transparent glass
  actionsPanelBg: 'rgba(255, 255, 255, 0.05)',
  actionsPanelBorder: 'rgba(255, 255, 255, 0.15)',
  actionsPanelText: 'rgba(255, 255, 255, 0.95)',

  // Suggested prompts - lighter glass cards
  suggestedPromptBg: 'rgba(255, 255, 255, 0.75)',
  suggestedPromptBorder: 'rgba(139, 115, 85, 0.25)',
  suggestedPromptText: '#6B4423',
  suggestedPromptHoverBg: 'rgba(255, 255, 255, 0.95)',

  // Bubble - solid brown with slight transparency (unchanged)
  bubbleBg: '#A0826D',
  bubbleBorder: '#6B4423',
  bubbleHoverBg: '#8B7355',
};

/**
 * Glassmorphic Theme - Light Mode
 * Enhanced frosted glass effect with Churro's brown tones
 * Light mode: Brown text, dark message backgrounds
 */
export const glassmorphicThemeLight: ThemeConfig = {
  // Container - 98% transparent (2% opacity) with maximum blur
  containerBg: 'rgba(120, 83, 55, 0.02)',
  containerBorder: 'rgba(107, 68, 35, 0.35)',
  containerShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.4), 0 2px 16px 0 rgba(0, 0, 0, 0.25)',
  containerBackdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',

  // Header - more transparent with enhanced glass effect
  headerBg: 'linear-gradient(to right, rgba(139, 115, 85, 0.6), rgba(107, 68, 35, 0.6))',
  headerBorder: 'rgba(107, 68, 35, 0.25)',
  headerText: '#ffffff',

  // User messages - DARK background for light mode, BROWN text
  userMessageBg: 'rgba(80, 60, 40, 0.75)',
  userMessageText: '#8B7355',
  userMessageBorder: 'rgba(107, 68, 35, 0.5)',

  // Assistant messages - DARK background for light mode, BROWN text
  assistantMessageBg: 'rgba(40, 40, 40, 0.8)',
  assistantMessageText: '#A0826D',
  assistantMessageBorder: 'rgba(107, 68, 35, 0.35)',

  // System messages - dark glass
  systemMessageBg: 'rgba(60, 48, 37, 0.7)',
  systemMessageText: '#A0826D',
  systemMessageBorder: 'rgba(107, 68, 35, 0.4)',

  // Input area - lighter with enhanced transparency
  inputAreaBg: 'rgba(255, 255, 255, 0.08)',
  inputAreaBorder: 'rgba(107, 68, 35, 0.15)',
  inputBg: 'rgba(120, 83, 55, 0.25)',
  inputText: '#ffffff',
  inputPlaceholder: 'rgba(255, 255, 255, 0.7)',

  // Actions panel - more transparent glass
  actionsPanelBg: 'rgba(255, 255, 255, 0.05)',
  actionsPanelBorder: 'rgba(107, 68, 35, 0.2)',
  actionsPanelText: 'rgba(255, 255, 255, 0.95)',

  // Suggested prompts - lighter glass cards
  suggestedPromptBg: 'rgba(255, 255, 255, 0.75)',
  suggestedPromptBorder: 'rgba(139, 115, 85, 0.25)',
  suggestedPromptText: '#6B4423',
  suggestedPromptHoverBg: 'rgba(255, 255, 255, 0.95)',

  // Bubble - solid brown with slight transparency (unchanged)
  bubbleBg: '#A0826D',
  bubbleBorder: '#6B4423',
  bubbleHoverBg: '#8B7355',
};

/**
 * Original Theme - Solid colors matching current ChatInterface
 * Preserves the existing look and feel
 */
export const originalTheme: ThemeConfig = {
  // Container - solid shepherd coat gradient
  containerBg: 'radial-gradient(ellipse at 25% 20%, var(--gradient-shepherd-4) 0%, transparent 45%), radial-gradient(ellipse at 75% 60%, var(--gradient-shepherd-3) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, var(--gradient-shepherd-2) 0%, transparent 40%), radial-gradient(ellipse at 60% 40%, var(--gradient-shepherd-4) 0%, transparent 35%), linear-gradient(160deg, var(--gradient-shepherd-2) 0%, var(--gradient-shepherd-1) 40%, var(--gradient-shepherd-2) 70%, var(--gradient-shepherd-1) 100%)',
  containerBorder: '#6B4423',
  containerShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Header - gradient brown
  headerBg: 'linear-gradient(to right, #8B7355, #6B4423)',
  headerBorder: '#6B4423',
  headerText: '#ffffff',

  // User messages - light tan
  userMessageBg: 'rgba(160, 130, 109, 0.3)',
  userMessageText: '#ffffff',
  userMessageBorder: 'rgba(139, 115, 85, 0.5)',

  // Assistant messages - deep black
  assistantMessageBg: 'rgba(0, 0, 0, .6)',
  assistantMessageText: '#ffffff',
  assistantMessageBorder: 'rgba(255, 255, 255, 0.3)',

  // System messages
  systemMessageBg: 'rgba(60, 48, 37, 0.3)',
  systemMessageText: '#ffffff',
  systemMessageBorder: 'rgba(255, 255, 255, 0.4)',

  // Input area
  inputAreaBg: 'rgba(255, 255, 255, 0.1)',
  inputAreaBorder: 'rgba(107, 68, 35, 0.2)',
  inputBg: 'transparent',
  inputText: '#ffffff',
  inputPlaceholder: 'rgba(255, 255, 255, 0.7)',

  // Actions panel
  actionsPanelBg: 'rgba(255, 255, 255, 0.1)',
  actionsPanelBorder: 'rgba(255, 255, 255, 0.2)',
  actionsPanelText: 'rgba(255, 255, 255, 0.9)',

  // Suggested prompts
  suggestedPromptBg: 'rgba(255, 255, 255, 0.8)',
  suggestedPromptBorder: 'rgba(139, 115, 85, 0.3)',
  suggestedPromptText: '#6B4423',
  suggestedPromptHoverBg: 'rgba(255, 255, 255, 1)',

  // Bubble
  bubbleBg: '#A0826D',
  bubbleBorder: '#6B4423',
  bubbleHoverBg: '#8B7355',
};

/**
 * Get theme configuration by name and dark mode setting
 */
export const getTheme = (themeName: ChatTheme, isDarkMode: boolean = true): ThemeConfig => {
  if (themeName === 'glassmorphic') {
    return isDarkMode ? glassmorphicThemeDark : glassmorphicThemeLight;
  }
  return originalTheme;
};

/**
 * CSS classes for backdrop filter support
 */
export const getBackdropFilterClass = (theme: ChatTheme): string => {
  if (theme === 'glassmorphic') {
    return 'backdrop-blur-xl backdrop-saturate-180';
  }
  return '';
};
