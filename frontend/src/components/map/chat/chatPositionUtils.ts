/**
 * Chat Position Utilities
 * Handles quadrant detection, boundary constraints, and position persistence
 */

export interface Position {
  bottom?: number;
  right?: number;
  top?: number;
  left?: number;
}

export interface AbsolutePosition {
  x: number; // pixels from left edge
  y: number; // pixels from top edge
}

export type Quadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface QuadrantConfig {
  quadrant: Quadrant;
  expandDirection: {
    vertical: 'down' | 'up';
    horizontal: 'right' | 'left';
  };
  drawerPosition: Position;
  resizeHandles: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
  animation: {
    hidden: { x: string; y: string; opacity: number };
    exit: { x: string; y: string; opacity: number };
  };
}

const STORAGE_KEY = 'churro-chat-position';

/**
 * Save chat position to localStorage
 */
export const saveChatPosition = (position: Position): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.warn('Failed to save chat position:', error);
  }
};

/**
 * Load chat position from localStorage
 * Returns null if no saved position exists
 */
export const loadChatPosition = (): Position | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load chat position:', error);
    return null;
  }
};

/**
 * Get default chat position (bottom-right corner)
 */
export const getDefaultPosition = (): Position => ({
  bottom: 5,
  right: 5,
});

/**
 * Convert relative position (bottom/right) to absolute position (x/y from top-left)
 */
export const positionToAbsolute = (
  position: Position,
  canvasWidth: number,
  canvasHeight: number,
  bubbleSize: number
): AbsolutePosition => {
  let x: number;
  let y: number;

  if (position.left !== undefined) {
    x = position.left + bubbleSize / 2;
  } else if (position.right !== undefined) {
    x = canvasWidth - position.right - bubbleSize / 2;
  } else {
    x = canvasWidth / 2;
  }

  if (position.top !== undefined) {
    y = position.top + bubbleSize / 2;
  } else if (position.bottom !== undefined) {
    y = canvasHeight - position.bottom - bubbleSize / 2;
  } else {
    y = canvasHeight / 2;
  }

  return { x, y };
};

/**
 * Convert absolute position (x/y from top-left) to relative position (bottom/right/top/left)
 * Inverse of positionToAbsolute
 */
export const absoluteToPosition = (
  absolutePos: AbsolutePosition,
  canvasWidth: number,
  canvasHeight: number,
  bubbleSize: number
): Position => {
  const midX = canvasWidth / 2;
  const midY = canvasHeight / 2;

  const position: Position = {};

  // Determine if we're closer to left or right edge
  if (absolutePos.x < midX) {
    // Closer to left edge
    position.left = absolutePos.x - bubbleSize / 2;
  } else {
    // Closer to right edge
    position.right = canvasWidth - absolutePos.x - bubbleSize / 2;
  }

  // Determine if we're closer to top or bottom edge
  if (absolutePos.y < midY) {
    // Closer to top edge
    position.top = absolutePos.y - bubbleSize / 2;
  } else {
    // Closer to bottom edge
    position.bottom = canvasHeight - absolutePos.y - bubbleSize / 2;
  }

  return position;
};

/**
 * Detect which quadrant the avatar is in based on its position
 */
export const detectQuadrant = (
  absolutePos: AbsolutePosition,
  canvasWidth: number,
  canvasHeight: number
): Quadrant => {
  const midX = canvasWidth / 2;
  const midY = canvasHeight / 2;

  if (absolutePos.y < midY) {
    // Top half
    return absolutePos.x < midX ? 'top-left' : 'top-right';
  } else {
    // Bottom half
    return absolutePos.x < midX ? 'bottom-left' : 'bottom-right';
  }
};

/**
 * Constrain position within canvas boundaries
 */
export const constrainPosition = (
  position: Position,
  canvasWidth: number,
  canvasHeight: number,
  bubbleSize: number
): Position => {
  const constrained: Position = {};

  // Ensure avatar stays within canvas (5px minimum from edges)
  const minDistance = 5;
  const maxRight = canvasWidth - bubbleSize - minDistance;
  const maxBottom = canvasHeight - bubbleSize - minDistance;

  if (position.right !== undefined) {
    constrained.right = Math.max(minDistance, Math.min(maxRight, position.right));
  }
  if (position.bottom !== undefined) {
    constrained.bottom = Math.max(minDistance, Math.min(maxBottom, position.bottom));
  }
  if (position.left !== undefined) {
    constrained.left = Math.max(minDistance, Math.min(maxRight, position.left));
  }
  if (position.top !== undefined) {
    constrained.top = Math.max(minDistance, Math.min(maxBottom, position.top));
  }

  return constrained;
};

/**
 * Get quadrant-specific configuration for drawer positioning and behavior
 */
export const getQuadrantConfig = (
  quadrant: Quadrant,
  absolutePos: AbsolutePosition,
  canvasWidth: number,
  canvasHeight: number,
  bubbleSize: number
): QuadrantConfig => {
  // Calculate avatar corner positions based on quadrant
  // The drawer should anchor at the same corner as the avatar
  const halfBubble = bubbleSize / 2;

  const configs: Record<Quadrant, QuadrantConfig> = {
    'top-left': {
      quadrant: 'top-left',
      expandDirection: {
        vertical: 'down',
        horizontal: 'right',
      },
      drawerPosition: {
        // Avatar top-left corner and drawer top-left corner align
        top: absolutePos.y - halfBubble,
        left: absolutePos.x - halfBubble,
      },
      resizeHandles: {
        vertical: 'bottom',
        horizontal: 'right',
      },
      animation: {
        hidden: { x: '-20%', y: '-20%', opacity: 0 },
        exit: { x: '-20%', y: '-20%', opacity: 0 },
      },
    },
    'top-right': {
      quadrant: 'top-right',
      expandDirection: {
        vertical: 'down',
        horizontal: 'left',
      },
      drawerPosition: {
        // Avatar top-right corner and drawer top-right corner align
        top: absolutePos.y - halfBubble,
        right: canvasWidth - (absolutePos.x + halfBubble),
      },
      resizeHandles: {
        vertical: 'bottom',
        horizontal: 'left',
      },
      animation: {
        hidden: { x: '20%', y: '-20%', opacity: 0 },
        exit: { x: '20%', y: '-20%', opacity: 0 },
      },
    },
    'bottom-left': {
      quadrant: 'bottom-left',
      expandDirection: {
        vertical: 'up',
        horizontal: 'right',
      },
      drawerPosition: {
        // Avatar bottom-left corner and drawer bottom-left corner align
        bottom: canvasHeight - (absolutePos.y + halfBubble),
        left: absolutePos.x - halfBubble,
      },
      resizeHandles: {
        vertical: 'top',
        horizontal: 'right',
      },
      animation: {
        hidden: { x: '-20%', y: '20%', opacity: 0 },
        exit: { x: '-20%', y: '20%', opacity: 0 },
      },
    },
    'bottom-right': {
      quadrant: 'bottom-right',
      expandDirection: {
        vertical: 'up',
        horizontal: 'left',
      },
      drawerPosition: {
        // Avatar bottom-right corner and drawer bottom-right corner align
        bottom: canvasHeight - (absolutePos.y + halfBubble),
        right: canvasWidth - (absolutePos.x + halfBubble),
      },
      resizeHandles: {
        vertical: 'top',
        horizontal: 'left',
      },
      animation: {
        hidden: { x: '20%', y: '20%', opacity: 0 },
        exit: { x: '20%', y: '20%', opacity: 0 },
      },
    },
  };

  return configs[quadrant];
};

/**
 * Get map canvas dimensions
 * Looks for the map container element in the DOM
 */
export const getCanvasDimensions = (): { width: number; height: number } => {
  const mapCanvas = document.querySelector('.map-canvas-panel') as HTMLElement;
  if (mapCanvas) {
    return {
      width: mapCanvas.offsetWidth,
      height: mapCanvas.offsetHeight,
    };
  }
  // Fallback to window dimensions
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};
