import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import type { ChatTheme } from './chatThemes';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  positionToAbsolute,
  absoluteToPosition,
  detectQuadrant,
  getQuadrantConfig,
  getCanvasDimensions,
  saveChatPosition,
  type Position,
  type Quadrant,
} from './chatPositionUtils';

interface GlassmorphicChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onHeightChange?: (height: number) => void;
  mobileHeight?: number; // Height in vh
  theme?: ChatTheme;
  children: ((headerDragHandlers: { onMouseDown: (e: React.MouseEvent) => void; isDragging: boolean; hasDragged: boolean }) => React.ReactNode) | React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  avatarPosition?: Position; // Position of the avatar bubble
  onAvatarPositionChange?: (position: Position) => void; // Callback when drawer is dragged
}

/**
 * GlassmorphicChatDrawer - Expandable chat drawer with glassmorphic styling
 * Responsive: Bottom sheet on mobile, corner drawer on tablet/desktop
 * NO overlay - map remains fully visible and interactive
 */
export const GlassmorphicChatDrawer: React.FC<GlassmorphicChatDrawerProps> = ({
  isOpen,
  onClose,
  onHeightChange,
  mobileHeight = 60,
  children,
  containerRef,
  avatarPosition,
  onAvatarPositionChange,
}) => {
  const { isMobile, isTablet } = useResponsive();

  // Header drag state (for desktop only) - MUST be declared before quadrant calculation
  const [isDraggingHeader, setIsDraggingHeader] = React.useState(false);
  const [hasHeaderDragged, setHasHeaderDragged] = React.useState(false);
  const headerDragStartRef = React.useRef<{
    mouseX: number;
    mouseY: number;
    drawerX: number;
    drawerY: number;
  }>({ mouseX: 0, mouseY: 0, drawerX: 0, drawerY: 0 });
  const lastDraggedPositionRef = React.useRef<Position | null>(null);

  // Detect quadrant and get configuration
  const canvasDimensions = getCanvasDimensions();
  const bubbleSize = isMobile ? 56 : 72;

  // Memoize position calculations for performance during dragging
  const absolutePos = React.useMemo(() => {
    return avatarPosition
      ? positionToAbsolute(avatarPosition, canvasDimensions.width, canvasDimensions.height, bubbleSize)
      : { x: canvasDimensions.width - 5 - bubbleSize / 2, y: canvasDimensions.height - 5 - bubbleSize / 2 };
  }, [avatarPosition, canvasDimensions.width, canvasDimensions.height, bubbleSize]);

  const quadrant: Quadrant = React.useMemo(() =>
    detectQuadrant(absolutePos, canvasDimensions.width, canvasDimensions.height),
    [absolutePos, canvasDimensions.width, canvasDimensions.height]
  );

  const quadrantConfig = React.useMemo(() =>
    getQuadrantConfig(quadrant, absolutePos, canvasDimensions.width, canvasDimensions.height, bubbleSize),
    [quadrant, absolutePos, canvasDimensions.width, canvasDimensions.height, bubbleSize]
  );

  // Calculate dynamic max dimensions based on available space to canvas edges
  const getMaxDimensions = () => {
    const margin = 5; // Minimal safety margin from edges (reduced from 20px)

    switch (quadrant) {
      case 'top-left':
        return {
          maxWidth: canvasDimensions.width - absolutePos.x - margin,
          maxHeight: canvasDimensions.height - absolutePos.y - margin,
        };
      case 'top-right':
        return {
          maxWidth: absolutePos.x - margin,
          maxHeight: canvasDimensions.height - absolutePos.y - margin,
        };
      case 'bottom-left':
        return {
          maxWidth: canvasDimensions.width - absolutePos.x - margin,
          maxHeight: absolutePos.y - margin,
        };
      case 'bottom-right':
        return {
          maxWidth: absolutePos.x - margin,
          maxHeight: absolutePos.y - margin,
        };
    }
  };

  const maxDimensions = getMaxDimensions();

  // Responsive sizing - consistent approach across all screen sizes
  const getDrawerDimensions = () => {
    if (isMobile) {
      return {
        width: '100%',
        maxWidth: '500px', // Max width on mobile for better UX
        height: `${mobileHeight}vh`,
        maxHeight: '80vh',
        borderRadius: '24px 24px 0 0',
      };
    }
    if (isTablet) {
      return {
        width: '380px',
        maxWidth: '380px',
        height: '60vh',
        maxHeight: '60vh',
        borderRadius: '20px',
      };
    }
    // Desktop
    return {
      width: '400px',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '70vh',
      borderRadius: '20px',
    };
  };

  const dimensions = getDrawerDimensions();

  // Animation variants based on quadrant
  const drawerVariants = {
    hidden: isMobile
      ? { y: '100%', opacity: 0 }
      : quadrantConfig.animation.hidden,
    visible: isMobile
      ? {
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
        }
      : {
          x: 0,
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
        },
    exit: isMobile
      ? { y: '100%', opacity: 0, transition: { duration: 0.3 } }
      : { ...quadrantConfig.animation.exit, transition: { duration: 0.3 } },
  };

  // Store resize dimensions - will be constrained to available space
  const [drawerWidth, setDrawerWidth] = React.useState<number>(400);
  const [drawerHeight, setDrawerHeight] = React.useState<number>(500);
  const [isResizing, setIsResizing] = React.useState<'vertical' | 'horizontal' | null>(null);
  const resizeStartRef = React.useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 400,
    height: 500,
  });

  // Constrain drawer dimensions to available space
  const constrainedDrawerWidth = React.useMemo(() => {
    return Math.min(drawerWidth, maxDimensions.maxWidth, 500);
  }, [drawerWidth, maxDimensions.maxWidth]);

  const constrainedDrawerHeight = React.useMemo(() => {
    return Math.min(drawerHeight, maxDimensions.maxHeight);
  }, [drawerHeight, maxDimensions.maxHeight]);

  // Calculate initial sizes as percentages of viewport for ResizablePanel
  // Desktop initial size: 250px width x 400px height
  const calculateInitialSizes = () => {
    if (isMobile) return { vertical: 100, horizontal: 100 };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate what percentage 250px width and 400px height represent
    // Start with large spacers so chat panel starts small
    const initialWidth = 250;
    const initialHeight = 400;

    // Horizontal: spacer takes up everything except 250px
    const horizontalSpacerPercent = ((viewportWidth - initialWidth - 5) / viewportWidth) * 100; // -5 for right margin

    // Vertical: spacer takes up everything except 400px
    const verticalSpacerPercent = ((viewportHeight - initialHeight - 5) / viewportHeight) * 100; // -5 for bottom margin

    return {
      vertical: Math.max(0, Math.min(90, verticalSpacerPercent)),
      horizontal: Math.max(0, Math.min(90, horizontalSpacerPercent))
    };
  };

  const initialSizes = calculateInitialSizes();

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: 'vertical' | 'horizontal') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: drawerWidth,
      height: drawerHeight,
    };
  };

  const handleResizeMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;

    if (isResizing === 'vertical') {
      // Vertical resize based on quadrant
      let newHeight: number;
      if (quadrantConfig.resizeHandles.vertical === 'bottom') {
        // Expanding downward - positive deltaY increases height
        newHeight = resizeStartRef.current.height + deltaY;
      } else {
        // Expanding upward - negative deltaY increases height
        newHeight = resizeStartRef.current.height - deltaY;
      }
      // Constrain height to available space and min/max bounds
      // Ensure minimum size is also constrained to available space
      const minHeight = Math.min(400, maxDimensions.maxHeight);
      newHeight = Math.max(minHeight, Math.min(maxDimensions.maxHeight, newHeight));
      setDrawerHeight(newHeight);
    } else if (isResizing === 'horizontal') {
      // Horizontal resize based on quadrant
      let newWidth: number;
      if (quadrantConfig.resizeHandles.horizontal === 'right') {
        // Expanding rightward - positive deltaX increases width
        newWidth = resizeStartRef.current.width + deltaX;
      } else {
        // Expanding leftward - negative deltaX increases width
        newWidth = resizeStartRef.current.width - deltaX;
      }
      // Constrain width to available space and min/max bounds
      // Ensure minimum size is also constrained to available space
      const minWidth = Math.min(250, maxDimensions.maxWidth);
      newWidth = Math.max(minWidth, Math.min(maxDimensions.maxWidth, 500, newWidth));
      setDrawerWidth(newWidth);
    }
  }, [isResizing, quadrantConfig.resizeHandles.vertical, quadrantConfig.resizeHandles.horizontal, maxDimensions.maxHeight, maxDimensions.maxWidth]);

  const handleResizeEnd = React.useCallback(() => {
    setIsResizing(null);
  }, []);

  // Set up resize event listeners
  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Reset drawer size when chatbot closes, and constrain to available space when opening
  React.useEffect(() => {
    if (!isOpen) {
      setDrawerWidth(400);
      setDrawerHeight(500);
    } else {
      // When opening, ensure dimensions fit within available space
      setDrawerWidth(prev => Math.min(prev, maxDimensions.maxWidth, 500));
      setDrawerHeight(prev => Math.min(prev, maxDimensions.maxHeight, 500));
    }
  }, [isOpen, maxDimensions.maxWidth, maxDimensions.maxHeight]);

  // Mobile drag handle state
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ y: number; startHeight: number }>({ y: 0, startHeight: 60 });

  // Mobile drag handlers
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      y: clientY,
      startHeight: mobileHeight,
    };
  };

  const handleDragMove = React.useCallback((clientY: number) => {
    if (!isDragging) return;

    const viewportHeight = window.innerHeight;
    const deltaY = dragStartRef.current.y - clientY; // Invert: dragging up increases height
    const deltaVh = (deltaY / viewportHeight) * 100;
    const newHeight = Math.max(30, Math.min(80, dragStartRef.current.startHeight + deltaVh));

    if (onHeightChange) {
      onHeightChange(newHeight);
    }
  }, [isDragging, onHeightChange]);

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleDragMove(e.touches[0].clientY);
    }
  }, [isDragging, handleDragMove]);

  const handleTouchEnd = React.useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse event handlers for mobile (for testing on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientY);
    }
  }, [isDragging, handleDragMove]);

  const handleMouseUp = React.useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Set up mobile drag event listeners
  React.useEffect(() => {
    if (isMobile && isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMobile, isDragging, handleTouchMove, handleTouchEnd, handleMouseMove, handleMouseUp]);

  // Header drag handlers
  const handleHeaderDragStart = (e: React.MouseEvent) => {
    if (isMobile) return; // Only for desktop

    // MUST prevent default and stop propagation to avoid closing drawer
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingHeader(true);
    setHasHeaderDragged(false);

    // Get current drawer position
    const currentAbsPos = avatarPosition
      ? positionToAbsolute(avatarPosition, canvasDimensions.width, canvasDimensions.height, bubbleSize)
      : { x: canvasDimensions.width - 5 - bubbleSize / 2, y: canvasDimensions.height - 5 - bubbleSize / 2 };

    headerDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      drawerX: currentAbsPos.x,
      drawerY: currentAbsPos.y,
    };
  };

  const handleHeaderDragMove = React.useCallback((e: MouseEvent) => {
    if (!isDraggingHeader || !onAvatarPositionChange) return;

    const deltaX = e.clientX - headerDragStartRef.current.mouseX;
    const deltaY = e.clientY - headerDragStartRef.current.mouseY;

    // Track if we've actually moved (threshold of 2px to distinguish from click)
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasHeaderDragged(true);
    }

    // Calculate new absolute position
    const newX = headerDragStartRef.current.drawerX + deltaX;
    const newY = headerDragStartRef.current.drawerY + deltaY;

    // Constrain avatar center to viewport (5px padding + avatar radius from edges)
    // This ensures avatar stays within bounds: center at least (5 + bubbleSize/2) from edge
    const margin = 5 + bubbleSize / 2;
    const constrainedX = Math.max(margin, Math.min(canvasDimensions.width - margin, newX));
    const constrainedY = Math.max(margin, Math.min(canvasDimensions.height - margin, newY));

    // Convert back to relative position
    const newPosition = absoluteToPosition(
      { x: constrainedX, y: constrainedY },
      canvasDimensions.width,
      canvasDimensions.height,
      bubbleSize
    );

    // Update avatar position immediately for smooth dragging
    onAvatarPositionChange(newPosition);

    // Track the latest position for saving later
    lastDraggedPositionRef.current = newPosition;

    // During dragging, continuously adjust drawer size to fit available space
    // This provides real-time feedback and prevents overflow
    const newAbsolutePos = { x: constrainedX, y: constrainedY };
    const newQuadrant = detectQuadrant(newAbsolutePos, canvasDimensions.width, canvasDimensions.height);
    const safeMargin = 5; // Minimal safety margin (reduced from 20px)

    let availableWidth: number;
    let availableHeight: number;

    switch (newQuadrant) {
      case 'top-left':
        availableWidth = canvasDimensions.width - newAbsolutePos.x - safeMargin;
        availableHeight = canvasDimensions.height - newAbsolutePos.y - safeMargin;
        break;
      case 'top-right':
        availableWidth = newAbsolutePos.x - safeMargin;
        availableHeight = canvasDimensions.height - newAbsolutePos.y - safeMargin;
        break;
      case 'bottom-left':
        availableWidth = canvasDimensions.width - newAbsolutePos.x - safeMargin;
        availableHeight = newAbsolutePos.y - safeMargin;
        break;
      case 'bottom-right':
        availableWidth = newAbsolutePos.x - safeMargin;
        availableHeight = newAbsolutePos.y - safeMargin;
        break;
    }

    // Constrain drawer dimensions in real-time
    setDrawerWidth(prev => Math.min(prev, availableWidth, 500));
    setDrawerHeight(prev => Math.min(prev, availableHeight, 500));
  }, [isDraggingHeader, onAvatarPositionChange, canvasDimensions, bubbleSize]);

  const handleHeaderDragEnd = React.useCallback(() => {
    if (!isDraggingHeader) return;
    setIsDraggingHeader(false);

    // Save the last dragged position to localStorage (not the stale closure value)
    if (lastDraggedPositionRef.current) {
      saveChatPosition(lastDraggedPositionRef.current);
    }

    // After dragging, ensure drawer dimensions still fit within new position's available space
    // This prevents overflow when moving to a constrained area
    setDrawerWidth(prev => Math.min(prev, maxDimensions.maxWidth, 500));
    setDrawerHeight(prev => Math.min(prev, maxDimensions.maxHeight, 500));

    // Reset hasDragged after a brief delay to allow click prevention to work
    setTimeout(() => {
      setHasHeaderDragged(false);
    }, 100);
  }, [isDraggingHeader, maxDimensions.maxWidth, maxDimensions.maxHeight]);

  // Set up header drag event listeners
  React.useEffect(() => {
    if (isDraggingHeader) {
      window.addEventListener('mousemove', handleHeaderDragMove);
      window.addEventListener('mouseup', handleHeaderDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleHeaderDragMove);
        window.removeEventListener('mouseup', handleHeaderDragEnd);
      };
    }
  }, [isDraggingHeader, handleHeaderDragMove, handleHeaderDragEnd]);

  // Build style for drawer positioning with strict boundary enforcement
  const drawerPositionStyle: React.CSSProperties = isMobile
    ? {
        bottom: 0,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: dimensions.width,
        maxWidth: dimensions.maxWidth,
        height: dimensions.height,
        maxHeight: dimensions.maxHeight,
      }
    : {
        ...quadrantConfig.drawerPosition,
        width: `${constrainedDrawerWidth}px`,
        height: `${constrainedDrawerHeight}px`,
        maxWidth: `${maxDimensions.maxWidth}px`,
        maxHeight: `${maxDimensions.maxHeight}px`,
        minHeight: `${Math.min(400, maxDimensions.maxHeight)}px`,
        minWidth: `${Math.min(250, maxDimensions.maxWidth)}px`,
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="glassmorphic-drawer"
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute z-[50000] group"
          style={{
            ...drawerPositionStyle,
            ...(isMobile ? {} : {
              borderRadius: dimensions.borderRadius,
              overflow: 'hidden',
              background: 'radial-gradient(ellipse at 25% 20%, rgba(139, 115, 85, 0.25) 0%, transparent 45%), radial-gradient(ellipse at 75% 60%, rgba(107, 68, 35, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, rgba(160, 130, 109, 0.2) 0%, transparent 40%), linear-gradient(160deg, rgba(160, 130, 109, 0.4) 0%, rgba(139, 115, 85, 0.35) 40%, rgba(160, 130, 109, 0.3) 70%, rgba(139, 115, 85, 0.25) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 2px 16px 0 rgba(0, 0, 0, 0.15)',
              userSelect: isResizing || isDraggingHeader ? 'none' : 'auto',
              transition: isDraggingHeader ? 'none' : undefined,
            }),
          }}
        >
          {/* Mobile: Simple container without ResizablePanel */}
          {isMobile ? (
            <div
              className="flex flex-col shadow-2xl border border-[#6B4423]/40"
              style={{
                width: '100%',
                maxWidth: dimensions.maxWidth,
                height: dimensions.height,
                borderRadius: dimensions.borderRadius,
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at 25% 20%, rgba(139, 115, 85, 0.25) 0%, transparent 45%), radial-gradient(ellipse at 75% 60%, rgba(107, 68, 35, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, rgba(160, 130, 109, 0.2) 0%, transparent 40%), linear-gradient(160deg, rgba(160, 130, 109, 0.4) 0%, rgba(139, 115, 85, 0.35) 40%, rgba(160, 130, 109, 0.3) 70%, rgba(139, 115, 85, 0.25) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 2px 16px 0 rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Drag handle for mobile */}
              <div
                className="flex justify-center pt-2 pb-1 cursor-ns-resize"
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}
              >
                <div
                  className="w-12 h-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(139, 115, 85, 0.8)',
                  }}
                />
              </div>


              {/* Content */}
              <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col">
                {typeof children === 'function'
                  ? children({ onMouseDown: () => {}, isDragging: false, hasDragged: false })
                  : children}
              </div>
            </div>
          ) : (
            /* Desktop/Tablet: Resizable container with quadrant-based resize handles */
            <>
              {/* Vertical resize handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'vertical')}
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/20 hover:bg-white/40 active:bg-white/50"
                style={{
                  [quadrantConfig.resizeHandles.vertical]: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  cursor: 'ns-resize',
                }}
              />

              {/* Horizontal resize handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/20 hover:bg-white/40 active:bg-white/50"
                style={{
                  [quadrantConfig.resizeHandles.horizontal]: 0,
                  top: 0,
                  bottom: 0,
                  width: '6px',
                  cursor: 'ew-resize',
                }}
              />

              {/* Content wrapper */}
              <div
                ref={containerRef}
                className="flex flex-col border border-[#6B4423]/40 w-full h-full relative"
                style={{
                  borderRadius: dimensions.borderRadius,
                }}
              >
                <div className="flex-1 overflow-hidden flex flex-col">
                  {typeof children === 'function'
                    ? children({ onMouseDown: handleHeaderDragStart, isDragging: isDraggingHeader, hasDragged: hasHeaderDragged })
                    : children}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
