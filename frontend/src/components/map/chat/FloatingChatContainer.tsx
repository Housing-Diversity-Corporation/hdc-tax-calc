import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp, X, ChevronRight } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserProfile } from '@/hooks/useUserProfile';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { FloatingChatBubble } from './FloatingChatBubble';
import { GlassmorphicChatDrawer } from './GlassmorphicChatDrawer';
import { GrowingMessageText } from './GrowingMessageText';
import { useChatState, type ChatCallbacks } from './useChatState';
import type { ChatTheme } from './chatThemes';
import type { Position } from './chatPositionUtils';

interface FloatingChatContainerProps extends ChatCallbacks {
  theme?: ChatTheme;
}

/**
 * FloatingChatContainer - Main orchestrator for Churro chatbot
 * Combines FloatingChatBubble (collapsed) + GlassmorphicChatDrawer (expanded)
 * Manages state transition between collapsed and expanded states
 */
export const FloatingChatContainer: React.FC<FloatingChatContainerProps> = ({
  theme = 'original',
  ...callbacks
}) => {
  const { isMobile } = useResponsive();
  const { profileImageUrl, userInitial } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(60); // Height in vh

  // Track avatar position for drawer positioning
  const [avatarPosition, setAvatarPosition] = useState<Position | undefined>(undefined);

  // Track chatbot width for responsive layout
  // Breakpoints based on actual chatbox width (works for all screen sizes)
  // < 280px = 1 col, >= 280px = 2 cols
  const [chatWidth, setChatWidth] = useState(250); // Initial width
  const getGridColumns = () => {
    return chatWidth >= 280 ? 'grid-cols-2' : 'grid-cols-1';
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Collapsible state for suggested prompts (persisted to localStorage)
  const [isPromptsOpen, setIsPromptsOpen] = useState(() => {
    const saved = localStorage.getItem('chat-prompts-open');
    return saved !== null ? JSON.parse(saved) : true; // Default to open
  });

  // Monitor container width changes for responsive grid
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        // console.log('📏 Chat height:', height, 'px');
        setChatWidth(width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  // Use shared chat state hook
  const {
    messages,
    inputValue,
    isLoading,
    currentActions,
    isActionsMinimized,
    hasInteracted,
    scrollRef,
    shouldMessageAnimate,
    markChatOpened,
    setInputValue,
    setIsActionsMinimized,
    setHasInteracted,
    handleSendMessage,
    handleCancelRequest,
    handleClearMessages,
    handleKeyDown,
    handleFeedback,
  } = useChatState(callbacks);

  const handleToggle = () => {
    const willOpen = !isOpen;
    // console.log(`🔄 Chat ${willOpen ? 'Opening' : 'Closing'} | isOpen: ${isOpen} → ${willOpen}`);

    // When closing the chat, mark the current message count
    // So when reopening, we know which messages are "old"
    if (!willOpen) {
      markChatOpened();
    }

    setIsOpen(willOpen);

    if (willOpen && isMobile) {
      setMobileHeight(60); // Reset to default height
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMobileHeight(60); // Reset height when closing
  };

  const handleHeightChange = (newHeight: number) => {
    if (isMobile) {
      setMobileHeight(newHeight);
    }
  };

  // Save prompts open state to localStorage
  useEffect(() => {
    localStorage.setItem('chat-prompts-open', JSON.stringify(isPromptsOpen));
  }, [isPromptsOpen]);

  // Handle position changes from both avatar bubble and drawer header
  const handlePositionChange = (position: Position) => {
    setAvatarPosition(position);
  };

  return (
    <>
      {/* Floating Bubble - Collapsed State */}
      <FloatingChatBubble
        onClick={handleToggle}
        isVisible={!isOpen}
        theme={theme}
        hasNewMessage={false}
        onPositionChange={handlePositionChange}
        avatarPosition={avatarPosition}
      />

      {/* Glassmorphic Drawer - Expanded State */}
      <GlassmorphicChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        onHeightChange={handleHeightChange}
        mobileHeight={mobileHeight}
        theme={theme}
        containerRef={containerRef}
        avatarPosition={avatarPosition}
        onAvatarPositionChange={handlePositionChange}
      >
        {(headerDragHandlers) => (
          <>
            {/* Header */}
            <div className={`px-4 pt-4 pb-3 border-b border-[#6B4423] flex items-center gap-3 relative ${!isMobile ? 'bg-gradient-to-r from-[#8B7355] to-[#6B4423]' : ''}`}>
          {/* Draggable area (avatar + title) */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0"
            onMouseDown={(e) => {
              e.stopPropagation();
              headerDragHandlers.onMouseDown(e);
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Prevent click events when dragging
              if (headerDragHandlers.hasDragged) {
                e.preventDefault();
              }
            }}
            style={{
              cursor: !isMobile ? (headerDragHandlers.isDragging ? 'grabbing' : 'grab') : 'default',
              userSelect: headerDragHandlers.isDragging ? 'none' : 'auto',
              pointerEvents: 'auto',
            }}
          >
            <Avatar
              className="border-2 border-[#6B4423] flex-shrink-0"
              style={{
                width: '48px',
                height: '48px',
                minWidth: '48px',
                minHeight: '48px',
                borderRadius: '50%',
              }}
            >
              <AvatarImage src="/churro.png" alt="Churro" style={{ objectFit: 'cover', borderRadius: '50%' }} />
              <AvatarFallback className="bg-[#A0826D]">
                <MessageCircle className="h-4 w-4 text-white" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold truncate ${isMobile ? 'text-[#6B4423]' : 'text-white'}`}>
                Churro
              </h3>
              <p className={`text-xs opacity-80 ${isMobile ? 'text-[#6B4423]/80' : 'text-white'}`}>
                Your friendly shepherd
              </p>
            </div>
          </div>

          {/* Close button wrapper - isolated from drag area with gap */}
          <div
            className="ml-2"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="h-6 w-6 p-0 rounded-full flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: isMobile ? '#6B4423' : '#ffffff',
                cursor: 'pointer',
                pointerEvents: 'auto',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggested Prompts - Only show before first interaction */}
        {!hasInteracted && (
          <Collapsible
            open={isPromptsOpen}
            onOpenChange={setIsPromptsOpen}
            className="border-b border-[#6B4423]/20 bg-white/10 backdrop-blur-md"
          >
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-white/50 font-medium uppercase tracking-wide">
                  Suggested prompts
                </p>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    {isPromptsOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-1.5">
                <div className={`grid gap-1.5 transition-all ${getGridColumns()}`}>
                  {[
                    "Show opportunity zones",
                    "Find parks nearby",
                    "Analyze demographics",
                    "What's in this area?"
                  ].map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHasInteracted(true);
                        // Send message directly with custom text
                        handleSendMessage(prompt);
                      }}
                      className="h-auto py-1.5 px-2 text-[10px] leading-tight bg-white/80 hover:bg-white border-[#8B7355]/30 text-[#6B4423] hover:text-[#6B4423] hover:border-[#6B4423] transition-all hover:shadow-md hover:-translate-y-0.5 text-center justify-center"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Current Actions Panel */}
        {currentActions.length > 0 && (
          <div className="px-4 py-3 flex justify-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-lg max-w-[95%] w-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-white/90">
                  Completing {currentActions.length} step{currentActions.length > 1 ? 's' : ''}...
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsActionsMinimized(!isActionsMinimized)}
                  className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white flex-shrink-0"
                >
                  {isActionsMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
              </div>
              {!isActionsMinimized && (
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                  {currentActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-xs">
                      {/* Status icon */}
                      {action.status === 'completed' ? (
                        <div
                          className="rounded-full bg-[#8B7355]/90 flex items-center justify-center flex-shrink-0 backdrop-blur-sm mt-0.5"
                          style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', aspectRatio: '1/1' }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : action.status === 'executing' ? (
                        <div
                          className="flex-shrink-0 mt-0.5"
                          style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', aspectRatio: '1/1' }}
                        >
                          <div
                            className="border-2 border-white/60 border-t-transparent rounded-full animate-spin"
                            style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', aspectRatio: '1/1' }}
                          />
                        </div>
                      ) : action.status === 'failed' ? (
                        <div
                          className="rounded-full bg-red-500/80 flex items-center justify-center flex-shrink-0 backdrop-blur-sm mt-0.5"
                          style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', aspectRatio: '1/1' }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className="rounded-full border-2 border-white/40 flex-shrink-0 mt-0.5"
                          style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', aspectRatio: '1/1' }}
                        />
                      )}
                      <span className="text-[9px] text-white/60 font-medium whitespace-nowrap flex-shrink-0">({idx + 1}/{currentActions.length})</span>
                      <span className="text-white/80 break-words leading-relaxed flex-1 min-w-0">{action.explanation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Check if this is the last assistant message
              const isLastAssistantMessage = message.role === 'assistant' &&
                index === messages.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i !== -1).pop();

              // Use the helper from useChatState to determine animation
              const shouldAnimate = shouldMessageAnimate(index);

              return (
                <div
                  key={index}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for non-user messages (left side) */}
                  {message.role !== 'user' && (
                    <Avatar
                      className="flex-shrink-0 border-2 border-white/30 mt-1"
                      style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        minHeight: '32px',
                      }}
                    >
                      <AvatarImage src="/churro.png" alt="Churro" />
                      <AvatarFallback className="bg-[#A0826D] text-white text-xs">
                        {message.role === 'system' ? 'SYS' : 'C'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[75%] rounded-xl p-3 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-xl ${
                      message.role === 'user'
                        ? 'border border-[#8B7355]/50 bg-white/20'
                        : message.role === 'system'
                        ? 'border border-white/40 text-white bg-white/15'
                        : 'text-white border border-white/30 bg-white/10'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user'
                        ? 'rgba(160, 130, 109, 0.3)'  // Light tan - coat highlights (more glass)
                        : message.role === 'system'
                        ? 'rgba(60, 48, 37, 0.3)'
                        : 'rgba(0, 0, 0, .6)'        // Deep black - dark spots (more glass)
                    }}
                  >
                    <GrowingMessageText
                      text={message.content}
                      speed={120}
                      enabled={shouldAnimate}
                      className="text-sm whitespace-pre-wrap break-words font-medium text-white"
                    />
                    {/* Only show timestamp and feedback on last assistant message or non-system messages */}
                    {(message.role !== 'system' && (message.role !== 'assistant' || isLastAssistantMessage)) && (
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>

                        {/* Feedback buttons for last assistant message only */}
                        {message.role === 'assistant' && isLastAssistantMessage && message.interactionId && message.feedbackStatus === 'none' && (
                          <TooltipProvider>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:scale-110 transition-transform hover:bg-[#A0826D]/30"
                                    onClick={() => handleFeedback(index, 'dog_treat')}
                                  >
                                    🦴
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Atta Boy! Give Churro a treat!</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:scale-110 transition-transform hover:bg-[#6B4423]/30 hover:text-white"
                                    onClick={() => handleFeedback(index, 'no_treat')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This wasn't helpful. To the dog house. 🐕</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                    {message.feedbackStatus === 'submitted' && (
                      <p className="text-[10px] opacity-70 mt-1">
                        {message.userFeedback === 'dog_treat' ? '✓ Marked as helpful' : '✓ Feedback submitted'}
                      </p>
                    )}
                  </div>

                  {/* Avatar for user messages (right side) */}
                  {message.role === 'user' && (
                    <Avatar
                      className="flex-shrink-0 border-2 border-[#8B7355]/50 mt-1"
                      style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        minHeight: '32px',
                      }}
                    >
                      <AvatarImage
                        src={profileImageUrl || undefined}
                        alt="User"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-[#7fbd45] text-white text-xs font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            {isLoading && <TypingIndicator />}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 pt-2 border-t border-[#6B4423]/20 bg-white/10 backdrop-blur-md">
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about the map... gnawing..."
              className="min-h-[70px] max-h-[120px] resize-none text-sm transition-all focus:ring-2 focus:ring-[#8B7355] placeholder:text-white/70 text-white"
              disabled={isLoading}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => isLoading ? handleCancelRequest() : handleSendMessage()}
                    disabled={!inputValue.trim() && !isLoading}
                    size="icon"
                    className="bg-[#8B7355] hover:bg-[#6B4423] h-[70px] w-12 shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <div className="relative flex items-center justify-center">
                        {/* Spinning border */}
                        <div className="absolute w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {/* Filled square in center */}
                        <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                      </div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLoading ? 'Stop generating' : 'Send message'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[10px] text-[#FFF]/70 mt-2">
            Press <kbd className="px-1 py-0.5 rounded bg-white/50 text-[9px] font-mono">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 rounded bg-white/50 text-[9px] font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
          </>
        )}
      </GlassmorphicChatDrawer>
    </>
  );
};

export default FloatingChatContainer;
