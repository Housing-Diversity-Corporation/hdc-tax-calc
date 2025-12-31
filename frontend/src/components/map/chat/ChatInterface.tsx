import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp, GripVertical, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserProfile } from '@/hooks/useUserProfile';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { GrowingMessageText } from './GrowingMessageText';

// Types for map actions
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: MapAction[];
  interactionId?: number;
  feedbackStatus?: 'none' | 'pending' | 'submitted';
  userFeedback?: 'dog_treat' | 'no_treat';
}

interface BaseMapAction {
  sequenceId: number;
  explanation: string;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  type: string;
  payload: any;
}

type MapAction = BaseMapAction;

interface ChatInterfaceProps {
  onToggleLayer?: (layerId: string) => void;
  onSearchPlace?: (query: string) => void;
  onPerformIntersection?: () => void;
  onZoomTo?: (lat: number, lng: number, zoom: number) => void;
  onApplyFilter?: (filterId: string, values: string[]) => void;
  onCreateMarker?: (lat: number, lng: number, name: string) => void;
  getCurrentMapState?: () => {
    layers: Array<{ id: string; name: string; enabled: boolean; apiTableId?: string }>;
    currentZoom?: number;
    mapBounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onToggleLayer,
  onSearchPlace,
  onPerformIntersection,
  onZoomTo,
  onApplyFilter,
  onCreateMarker,
  getCurrentMapState,
}) => {
  const { isMobile } = useResponsive();
  const { profileImageUrl, userInitial } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Woof woof! I\'m Churro, your friendly sheppard! I can help you navigate, toggle layers, search for places, and perform intersections. What would you like to do today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentActions, setCurrentActions] = useState<MapAction[]>([]);
  const [isActionsMinimized, setIsActionsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('chat-session-id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    sessionStorage.setItem('chat-session-id', newId);
    return newId;
  });


  // Position state for draggable minimized button
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, bottom: 20, right: 20 });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  // Get map state with debug logging
  const getMapStateWithDebug = () => {
    if (!getCurrentMapState) return { enabledLayers: [], currentZoom: 10, bounds: null, activeFilters: {} };

    const mapState = getCurrentMapState();
    const enabledLayers = mapState.layers || [];
    const enabledCount = enabledLayers.filter((layer) => layer.enabled).length;
    console.log(`🔍 Chat: ${enabledCount} enabled layers out of ${enabledLayers.length} total`);

    return {
      enabledLayers,
      currentZoom: mapState.currentZoom,
      bounds: mapState.mapBounds,
      activeFilters: {}
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Mark as interacted to hide suggested prompts
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch('/api/chat/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          message: userInput,
          sessionId,
          mapState: getMapStateWithDebug()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle step-by-step execution
      if (data.isStepByStep) {
        console.log(`Starting step-by-step execution: ${data.currentStep} of ${data.totalSteps}`);
        await executeStepByStepActions(data);
        return;
      }

      // Handle conversational response
      if (data.response) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          interactionId: data.interactionId,
          feedbackStatus: 'none'
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      // Handle legacy format with content/message
      if (data.content || data.message) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.content || data.message,
          timestamp: new Date(),
          actions: data.actions,
          interactionId: data.interactionId,
          feedbackStatus: 'none'
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Execute actions if present
        if (data.actions && data.actions.length > 0) {
          setCurrentActions(data.actions);
          executeActions(data.actions);
        }
        return;
      }

      // Handle array of actions (legacy)
      if (Array.isArray(data)) {
        const actions = data as MapAction[];
        setCurrentActions(actions);
        for (const action of actions) {
          await executeAction(action);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback: simulate a simple response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `I received your message: "${userInput}". The LLM backend is not available right now, but I'm here to help! Try asking me to toggle layers, search for places, or perform intersections.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get action-specific delay based on operation complexity
  const getActionDelay = (actionType: string, customDelay?: number): number => {
    if (customDelay !== undefined) return customDelay;

    // Action-specific delays for UI/animation effects only (data loading is handled by awaiting promises)
    const delayMap: Record<string, number> = {
      'TOGGLE_LAYER': 500,          // Brief delay for UI update (actual loading is awaited)
      'PERFORM_INTERSECTION': 1000, // Allow time for intersection computation
      'SET_ZOOM': 800,              // Zoom animation duration
      'ZOOM_TO_LOCATION': 800,      // Pan + zoom animation duration
      'SEARCH_PLACE': 500,          // Search UI update
      'APPLY_FILTER': 500,          // Filter UI update
      'CREATE_MARKER': 300,         // Marker creation animation
      'SHOW_MESSAGE': 200,          // Quick UI update
    };

    return delayMap[actionType] || 1000; // Default 1000ms for unknown actions
  };

  // Execute a single map action
  const executeAction = async (action: MapAction, interactionId?: number) => {
    setCurrentActions(prev =>
      prev.map(a => a.sequenceId === action.sequenceId ? { ...a, status: 'executing' } : a)
    );

    try {
      // Execute the map action first
      switch (action.type) {
        case 'TOGGLE_LAYER':
          if (onToggleLayer) {
            onToggleLayer(action.payload.layerId);
            toast.success(`Layer ${action.payload.enabled ? 'enabled' : 'disabled'}`);
          }
          break;
        case 'SEARCH_PLACE':
          if (onSearchPlace) {
            onSearchPlace(action.payload.query);
            toast.success(`Searching for: ${action.payload.query}`);
          }
          break;
        case 'SET_ZOOM':
          if (onZoomTo) {
            const { zoomLevel } = action.payload;
            // Get current map center and apply new zoom level
            const currentMapState = getCurrentMapState?.();
            const bounds = currentMapState?.mapBounds;

            // Calculate center of current map view
            const centerLat = bounds ? (bounds.minLat + bounds.maxLat) / 2 : 47.6062; // Default to Seattle
            const centerLng = bounds ? (bounds.minLng + bounds.maxLng) / 2 : -122.3321;

            onZoomTo(centerLat, centerLng, zoomLevel);
            toast.success(`Zoom level set to ${zoomLevel}`);
          }
          break;
        case 'ZOOM_TO_LOCATION':
          if (onZoomTo) {
            const { lat, lng, zoom } = action.payload;
            onZoomTo(lat, lng, zoom);
            toast.success(`Zoomed to level ${zoom}`);
          }
          break;
        case 'PERFORM_INTERSECTION':
          if (onPerformIntersection) {
            onPerformIntersection();
            toast.success('Performing intersection');
          }
          break;
        case 'APPLY_FILTER':
          if (onApplyFilter) {
            onApplyFilter(action.payload.filterId, action.payload.values);
            toast.success('Filter applied');
          }
          break;
        case 'CREATE_MARKER':
          if (onCreateMarker) {
            onCreateMarker(action.payload.lat, action.payload.lng, action.payload.name);
            toast.success(`Marker created: ${action.payload.name}`);
          }
          break;
        case 'SHOW_MESSAGE':
          // Display message in chat
          const messageContent = action.payload.message || action.payload.content;
          if (messageContent) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: messageContent,
              timestamp: new Date(),
              interactionId: interactionId,
              feedbackStatus: 'none'
            }]);
          }
          break;
      }

      // Wait for action-specific delay to ensure operation completes
      const delay = getActionDelay(action.type, action.payload?.delayMs);
      console.log(`⏱️ Waiting ${delay}ms for ${action.type} to complete...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      setCurrentActions(prev =>
        prev.map(a => a.sequenceId === action.sequenceId ? { ...a, status: 'completed' } : a)
      );
    } catch (error) {
      console.error('Error executing action:', error);
      setCurrentActions(prev =>
        prev.map(a => a.sequenceId === action.sequenceId ? { ...a, status: 'failed' } : a)
      );
      throw error;
    }
  };

  // Execute map actions (legacy batch execution)
  const executeActions = async (actions: MapAction[]) => {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      try {
        await executeAction(action);

        // Add a small buffer delay between actions for stability
        // This ensures the previous action fully completes before starting the next
        if (i < actions.length - 1) {
          console.log('⏸️ Adding 500ms buffer before next action...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error in batch execution:', error);
        // Continue with remaining actions even if one fails
      }
    }
  };

  // Execute step-by-step actions with backend coordination
  const executeStepByStepActions = async (initialData: any) => {
    const allActions: MapAction[] = [];
    let currentData = initialData;
    let interactionId = initialData.interactionId;

    while (currentData.action) {
      const action = currentData.action as MapAction;
      allActions.push(action);

      console.log(`Executing step ${currentData.currentStep} of ${currentData.totalSteps}: ${action.type}`);

      // Update UI to show all actions
      setCurrentActions(allActions.map((a, idx) => ({
        ...a,
        status: idx < allActions.length - 1 ? 'completed' : 'executing'
      })));

      // Execute the action
      await executeAction(action, interactionId);

      // Check if we're done
      if (currentData.currentStep >= currentData.totalSteps) {
        console.log('All steps completed successfully');
        break;
      }

      // Request next action from backend
      try {
        const nextResponse = await fetch('/api/chat/next-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            completedSequenceId: action.sequenceId,
            sessionId: currentData.sessionId,
            mapState: getMapStateWithDebug()
          })
        });

        if (!nextResponse.ok) {
          console.error('HTTP error in next-action:', nextResponse.status);
          break;
        }

        const nextData = await nextResponse.json();

        if (!nextData.success || nextData.completed) {
          console.log('Step-by-step execution completed');
          break;
        }

        currentData = nextData;
      } catch (error) {
        console.error('Error requesting next action:', error);
        break;
      }
    }
  };

  const handleClearMessages = () => {
    setMessages([
      {
        role: 'system',
        content: 'Chat cleared. How can I assist you?',
        timestamp: new Date(),
      },
    ]);
    setCurrentActions([]);
    toast.success('Chat cleared');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Feedback handler
  const handleFeedback = async (messageIndex: number, feedbackType: 'dog_treat' | 'no_treat') => {
    const message = messages[messageIndex];
    if (!message.interactionId) return;

    setMessages(prev => prev.map((msg, idx) =>
      idx === messageIndex ? { ...msg, feedbackStatus: 'pending', userFeedback: feedbackType } : msg
    ));

    try {
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          interactionId: message.interactionId,
          feedbackType,
          sessionId
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, feedbackStatus: 'submitted' } : msg
        ));
        toast.success(feedbackType === 'dog_treat' ? '🦴 Thanks for the feedback!' : '🐕 Will try harder!');
      }
    } catch (error) {
      setMessages(prev => prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, feedbackStatus: 'none', userFeedback: undefined } : msg
      ));
      toast.error('Failed to submit feedback');
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMinimized || isOpen) return;
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      bottom: position.bottom,
      right: position.right
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = dragStartPos.current.x - e.clientX;
    const deltaY = dragStartPos.current.y - e.clientY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasDragged(true);
    }

    const newRight = Math.max(0, Math.min(window.innerWidth - 60, dragStartPos.current.right + deltaX));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, dragStartPos.current.bottom + deltaY));

    setPosition({ bottom: newBottom, right: newRight });
  };

  const handleMouseUp = (e: MouseEvent) => {
    const wasDragging = isDragging && hasDragged;
    setIsDragging(false);

    // If we weren't actually dragging, trigger the click to open
    if (!wasDragging && isMinimized && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    }

    // Reset dragged flag after a short delay
    setTimeout(() => setHasDragged(false), 100);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent opening if currently dragging
    if (isDragging) return;

    setIsOpen(true);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button - Draggable Background with Clickable Image */}
      {isMinimized && !isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className={`fixed rounded-full shadow-lg cursor-move z-[999] flex items-center justify-center`}
          style={{
            bottom: `${position.bottom}px`,
            right: `${position.right}px`,
            backgroundColor: isDragging ? '#8B7355' : '#A0826D',
            transition: 'background-color 0.2s',
            aspectRatio: '1/1',
            width: isMobile ? '56px' : '72px',
            height: isMobile ? '56px' : '72px',
            minWidth: isMobile ? '56px' : '72px',
            minHeight: isMobile ? '56px' : '72px',
            maxWidth: isMobile ? '56px' : '72px',
            maxHeight: isMobile ? '56px' : '72px',
            overflow: 'visible',
            borderRadius: '50%',
            padding: isMobile ? '4px' : '4px'
          }}
          aria-label="Drag to move chat button"
        >
          {isDragging ? (
            <GripVertical className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
          ) : (
            <Avatar
              onClick={handleButtonClick}
              className="cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 border-2 border-[#6B4423]"
              style={{
                width: isMobile ? '48px' : '64px',
                height: isMobile ? '48px' : '64px',
                minWidth: isMobile ? '48px' : '64px',
                minHeight: isMobile ? '48px' : '64px',
                borderRadius: '50%',
                pointerEvents: 'auto'
              }}
            >
              <AvatarImage src="/churro.png" alt="Churro the assistant dog" />
              <AvatarFallback className="bg-[#A0826D]">
                <MessageCircle className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* Chat Panel */}
      <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setIsMinimized(true); }}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`${isMobile ? 'h-[60vh]' : 'w-[450px]'} flex flex-col p-0 bg-shepherd-coat`}
        >
          <SheetHeader className="px-4 pt-4 pb-0 space-y-0 border-b border-[#6B4423] bg-gradient-to-r from-[#8B7355] to-[#6B4423]">
            <div className="flex items-center w-full pb-4 gap-2">
              <Avatar
                className="border-2 border-[#6B4423] flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  minHeight: '48px',
                  maxWidth: '48px',
                  maxHeight: '48px',
                  aspectRatio: '1/1',
                  borderRadius: '50%'
                }}
              >
                <AvatarImage
                  src="/churro.png"
                  alt="Churro"
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
                <AvatarFallback className="bg-[#A0826D]">
                  <MessageCircle className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <SheetTitle className="text-sm text-white truncate flex-1 min-w-0">Churro</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearMessages}
                className="h-8 w-8 min-w-[32px] min-h-[32px] text-white hover:bg-[#8B7355]/20 flex-shrink-0"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4 flex-shrink-0" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(true);
                }}
                className="h-8 w-8 min-w-[32px] min-h-[32px] text-white hover:bg-[#8B7355]/20 flex-shrink-0"
                title="Minimize chat"
              >
                {isMobile ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronLeft className="h-4 w-4 flex-shrink-0" />}
              </Button>
            </div>
          </SheetHeader>

          {/* Suggested Prompts - Only show before first interaction */}
          {!hasInteracted && (
            <div className="px-4 py-3 border-b border-[#6B4423]/20 bg-white/10 backdrop-blur-md">
              <p className="text-xs text-[#6B4423]/70 font-medium mb-2 uppercase tracking-wide">
                Suggested prompts
              </p>
              <div className="grid grid-cols-2 gap-2">
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
                      setInputValue(prompt);
                      setHasInteracted(true);
                    }}
                    className="h-auto py-2 px-3 text-xs bg-white/80 hover:bg-white border-[#8B7355]/30 text-[#6B4423] hover:text-[#6B4423] hover:border-[#6B4423] transition-all hover:shadow-md hover:-translate-y-0.5 text-left justify-start"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Current Actions Panel - Moved to top */}
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
                        {/* Step number */}
                        <span className="text-[9px] text-white/60 font-medium whitespace-nowrap flex-shrink-0">({idx + 1}/{currentActions.length})</span>
                        {/* Explanation */}
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
                // Animate all messages (ChatInterface doesn't close/reopen like FloatingChatContainer)
                const shouldAnimate = true;

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
                    className={`max-w-[75%] rounded-xl p-3 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 ${
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
                    {message.role !== 'system' && (
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>

                        {/* Feedback buttons for assistant messages */}
                        {message.role === 'assistant' && message.interactionId && message.feedbackStatus === 'none' && (
                          <TooltipProvider>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:scale-110 transition-transform"
                                    onClick={() => handleFeedback(index, 'dog_treat')}
                                  >
                                    🦴
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This was helpful</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:scale-110 transition-transform hover:text-red-600"
                                    onClick={() => handleFeedback(index, 'no_treat')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This wasn't helpful</p>
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
                placeholder="Ask Churro anything... (Enter to send)"
                className="min-h-[70px] max-h-[120px] resize-none text-sm transition-all focus:ring-2 focus:ring-[#8B7355] placeholder:text-white/70 text-white"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-[#8B7355] hover:bg-[#6B4423] h-[70px] w-12 shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-[#FFF]/70 mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-white/50 text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-white/50 text-[9px] font-mono">Shift+Enter</kbd> for new line
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatInterface;
