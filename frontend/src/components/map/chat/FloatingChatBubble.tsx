import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/contexts/ThemeContext';
import type { ChatTheme } from './chatThemes';
import { getTheme } from './chatThemes';
import {
  loadChatPosition,
  saveChatPosition,
  getDefaultPosition,
  constrainPosition,
  getCanvasDimensions,
  type Position,
} from './chatPositionUtils';

interface FloatingChatBubbleProps {
  onClick: () => void;
  isVisible: boolean;
  theme?: ChatTheme;
  hasNewMessage?: boolean;
  onPositionChange?: (position: Position) => void;
  avatarPosition?: Position; // Parent's position state (single source of truth)
}

/**
 * FloatingChatBubble - Collapsed state of Churro chatbot
 * Draggable circular button with Churro avatar
 * Shows at bottom-right corner with pulse animation when active
 */
export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  onClick,
  isVisible,
  theme = 'original',
  hasNewMessage = false,
  onPositionChange,
  avatarPosition,
}) => {
  const { isMobile } = useResponsive();
  const { isDarkMode } = useTheme();
  const themeConfig = getTheme(theme, isDarkMode);
  const bubbleSize = isMobile ? 56 : 72;

  // Load saved position or use default
  const [position, setPosition] = useState<Position>(() => {
    const saved = loadChatPosition();
    return saved || getDefaultPosition();
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; position: Position }>({
    x: 0,
    y: 0,
    position: getDefaultPosition(),
  });
  const lastDraggedPositionRef = useRef<Position | null>(null);

  // Update parent when position changes (memoized to prevent infinite loops)
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.bottom, position.right, position.top, position.left]);

  // Sync position from parent when bubble becomes visible
  // This ensures drawer-dragged positions are reflected when minimizing
  useEffect(() => {
    if (!isVisible) return;

    if (avatarPosition) {
      // Only update if different to prevent infinite loop
      const isDifferent =
        avatarPosition.bottom !== position.bottom ||
        avatarPosition.right !== position.right ||
        avatarPosition.top !== position.top ||
        avatarPosition.left !== position.left;

      if (isDifferent) {
        // Parent has the latest position (from drawer drag), sync with it
        setPosition(avatarPosition);
      }
    } else {
      // Parent has no position yet, load from localStorage
      const savedPosition = loadChatPosition();
      if (savedPosition) {
        setPosition(savedPosition);
      }
    }
    // Only run when isVisible changes, not when avatarPosition changes during same visibility state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      position: { ...position },
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = dragStartPos.current.x - e.clientX;
    const deltaY = dragStartPos.current.y - e.clientY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasDragged(true);
    }

    const canvasDimensions = getCanvasDimensions();
    const startPos = dragStartPos.current.position;

    // Calculate new position
    let newPosition: Position = {};

    // Handle right/left positioning
    if (startPos.right !== undefined) {
      newPosition.right = startPos.right + deltaX;
    } else if (startPos.left !== undefined) {
      newPosition.left = startPos.left - deltaX;
    } else {
      newPosition.right = 5; // fallback
    }

    // Handle bottom/top positioning
    if (startPos.bottom !== undefined) {
      newPosition.bottom = startPos.bottom + deltaY;
    } else if (startPos.top !== undefined) {
      newPosition.top = startPos.top - deltaY;
    } else {
      newPosition.bottom = 5; // fallback
    }

    // Constrain within canvas boundaries
    const constrained = constrainPosition(
      newPosition,
      canvasDimensions.width,
      canvasDimensions.height,
      bubbleSize
    );

    setPosition(constrained);
    lastDraggedPositionRef.current = constrained;
    // Save immediately during drag to prevent stale data
    saveChatPosition(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    // Don't call onClick here - let the avatar click handler do it
    // Don't reset hasDragged here either - let the click handler check it first
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setHasDragged(false);
    dragStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      position: { ...position },
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = dragStartPos.current.x - touch.clientX;
    const deltaY = dragStartPos.current.y - touch.clientY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasDragged(true);
    }

    const canvasDimensions = getCanvasDimensions();
    const startPos = dragStartPos.current.position;

    // Calculate new position
    let newPosition: Position = {};

    // Handle right/left positioning
    if (startPos.right !== undefined) {
      newPosition.right = startPos.right + deltaX;
    } else if (startPos.left !== undefined) {
      newPosition.left = startPos.left - deltaX;
    } else {
      newPosition.right = 5; // fallback
    }

    // Handle bottom/top positioning
    if (startPos.bottom !== undefined) {
      newPosition.bottom = startPos.bottom + deltaY;
    } else if (startPos.top !== undefined) {
      newPosition.top = startPos.top - deltaY;
    } else {
      newPosition.bottom = 5; // fallback
    }

    // Constrain within canvas boundaries
    const constrained = constrainPosition(
      newPosition,
      canvasDimensions.width,
      canvasDimensions.height,
      bubbleSize
    );

    setPosition(constrained);
    lastDraggedPositionRef.current = constrained;
    // Save immediately during drag to prevent stale data
    saveChatPosition(constrained);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Don't call onClick here - let the avatar touch handler do it
    // Don't reset hasDragged here either - let the touch handler check it first
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  // Avatar click handler - simple, just open the chat
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleAvatarTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    onClick();
  };

  if (!isVisible) return null;

  const avatarSize = isMobile ? 48 : 64;

  // Build style object with proper positioning
  const positionStyle: React.CSSProperties = {};
  if (position.bottom !== undefined) positionStyle.bottom = `${position.bottom}px`;
  if (position.right !== undefined) positionStyle.right = `${position.right}px`;
  if (position.top !== undefined) positionStyle.top = `${position.top}px`;
  if (position.left !== undefined) positionStyle.left = `${position.left}px`;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute rounded-full shadow-lg z-[50000] flex items-center justify-center group"
      style={{
        ...positionStyle,
        backgroundColor: themeConfig.bubbleBg,
        aspectRatio: '1/1',
        width: `${bubbleSize}px`,
        height: `${bubbleSize}px`,
        minWidth: `${bubbleSize}px`,
        minHeight: `${bubbleSize}px`,
        maxWidth: `${bubbleSize}px`,
        maxHeight: `${bubbleSize}px`,
        overflow: 'visible',
        borderRadius: '50%',
        padding: isMobile ? '4px' : '4px',
        cursor: 'default',
      }}
      aria-label="Churro chat assistant"
    >
      {/* Pulse animation ring when new message */}
      {hasNewMessage && !isDragging && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${themeConfig.bubbleBorder}`,
            opacity: 0.6,
            zIndex: 0,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Avatar with hover scale effect */}
      <motion.div
        style={{ zIndex: 2, position: 'relative' }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Avatar
          onClick={handleAvatarClick}
          onTouchEnd={handleAvatarTouchEnd}
          className="cursor-pointer border-2 transition-all"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            minWidth: `${avatarSize}px`,
            minHeight: `${avatarSize}px`,
            borderRadius: '50%',
            pointerEvents: 'auto',
            borderColor: themeConfig.bubbleBorder,
          }}
        >
          <AvatarImage src="/churro.png" alt="Churro the assistant dog" />
          <AvatarFallback style={{ backgroundColor: themeConfig.bubbleBg }}>
            <MessageCircle className="h-6 w-6 text-white" />
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Drag handle - bottom right corner */}
      <motion.div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="absolute rounded-full flex items-center justify-center shadow-md"
        style={{
          bottom: '2px',
          right: '2px',
          width: '12px',
          height: '12px',
          backgroundColor: isDragging ? themeConfig.bubbleHoverBg : 'rgba(139, 115, 85, 0.9)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 3,
          border: `2px solid ${themeConfig.bubbleBorder}`,
        }}
        whileHover={{ scale: 1.2, backgroundColor: themeConfig.bubbleHoverBg }}
        whileTap={{ scale: 0.95 }}
        aria-label="Drag to move"
      >
        <GripVertical className="h-2 w-2 text-white" />
      </motion.div>

      {/* Notification badge for unread messages */}
      {hasNewMessage && !isDragging && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          style={{ borderColor: themeConfig.bubbleBorder, zIndex: 4 }}
        />
      )}
    </motion.div>
  );
};
