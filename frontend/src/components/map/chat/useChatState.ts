import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Types for map actions
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: MapAction[];
  interactionId?: number;
  feedbackStatus?: 'none' | 'pending' | 'submitted';
  userFeedback?: 'dog_treat' | 'no_treat';
}

export interface BaseMapAction {
  sequenceId: number;
  explanation: string;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  type: string;
  payload: any;
}

export type MapAction = BaseMapAction;

export interface ChatCallbacks {
  onToggleLayer?: (layerId: string) => Promise<void>;
  onSearchPlace?: (query: string) => Promise<void>;
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

/**
 * Custom hook for managing chat state and logic
 * Extracted from ChatInterface for reusability
 */
export const useChatState = (callbacks: ChatCallbacks) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Woof woof! I\'m Churro, your friendly shepherd! I can help you navigate, toggle layers, search for places, and perform intersections. What would you like to do today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentActions, setCurrentActions] = useState<MapAction[]>([]);
  const [isActionsMinimized, setIsActionsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('chat-session-id');
    const newId = stored || crypto.randomUUID();
    if (!stored) {
      sessionStorage.setItem('chat-session-id', newId);
    }
    return newId;
  });

  // Track when chat is opened to control animation
  // Start at 0 so initial message animates on first open
  const chatOpenedMessageCountRef = useRef(0);

  // console.log(`💬 useChatState initialized | Session: ${sessionId} | Initial Messages: ${messages.length} | ChatOpenedCount: ${chatOpenedMessageCountRef.current}`);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Get map state
  const getMapStateWithDebug = () => {
    if (!callbacks.getCurrentMapState) return { enabledLayers: [], currentZoom: 10, bounds: null, activeFilters: {} };

    const mapState = callbacks.getCurrentMapState();
    const enabledLayers = mapState.layers || [];

    return {
      enabledLayers,
      currentZoom: mapState.currentZoom,
      bounds: mapState.mapBounds,
      activeFilters: {}
    };
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
          if (callbacks.onToggleLayer) {
            await callbacks.onToggleLayer(action.payload.layerId);
            toast.success(`Layer ${action.payload.enabled ? 'enabled' : 'disabled'}`);
          }
          break;
        case 'SEARCH_PLACE':
          if (callbacks.onSearchPlace) {
            await callbacks.onSearchPlace(action.payload.query);
            toast.success(`Found: ${action.payload.query}`);
          }
          break;
        case 'SET_ZOOM':
          if (callbacks.onZoomTo) {
            const { zoomLevel } = action.payload;
            // Get current map center and apply new zoom level
            const currentMapState = callbacks.getCurrentMapState?.();
            const bounds = currentMapState?.mapBounds;

            // Calculate center of current map view
            const centerLat = bounds ? (bounds.minLat + bounds.maxLat) / 2 : 47.6062; // Default to Seattle
            const centerLng = bounds ? (bounds.minLng + bounds.maxLng) / 2 : -122.3321;

            callbacks.onZoomTo(centerLat, centerLng, zoomLevel);
            toast.success(`Zoom level set to ${zoomLevel}`);
          }
          break;
        case 'ZOOM_TO_LOCATION':
          if (callbacks.onZoomTo) {
            const { lat, lng, zoom } = action.payload;
            callbacks.onZoomTo(lat, lng, zoom);
            toast.success(`Zoomed to level ${zoom}`);
          }
          break;
        case 'PERFORM_INTERSECTION':
          if (callbacks.onPerformIntersection) {
            callbacks.onPerformIntersection();
            toast.success('Performing intersection');
          }
          break;
        case 'APPLY_FILTER':
          if (callbacks.onApplyFilter) {
            callbacks.onApplyFilter(action.payload.filterId, action.payload.values);
            toast.success('Filter applied');
          }
          break;
        case 'CREATE_MARKER':
          if (callbacks.onCreateMarker) {
            callbacks.onCreateMarker(action.payload.lat, action.payload.lng, action.payload.name);
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
        if (i < actions.length - 1) {
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

      // Update UI to show all actions
      setCurrentActions(allActions.map((a, idx) => ({
        ...a,
        status: idx < allActions.length - 1 ? 'completed' : 'executing'
      })));

      // Execute the action
      await executeAction(action, interactionId);

      // Check if we're done
      if (currentData.currentStep >= currentData.totalSteps) {
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
          break;
        }

        currentData = nextData;
      } catch (error) {
        console.error('Error requesting next action:', error);
        break;
      }
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputValue;
    if (!messageToSend.trim() || isLoading) return;

    // Mark as interacted to hide suggested prompts
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = messageToSend;
    setInputValue('');
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

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
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle step-by-step execution
      if (data.isStepByStep) {
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
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Check if the error is from abort
      if (error.name === 'AbortError') {
        const cancelMessage: ChatMessage = {
          role: 'system',
          content: 'Request cancelled by user.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, cancelMessage]);
        toast.info('Request cancelled');
      } else {
        // Fallback: simulate a simple response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: `I received your message: "${userInput}". The LLM backend is not available right now, but I'm here to help! Try asking me to toggle layers, search for places, or perform intersections.`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info('Cancelling request...');
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

  // Mark that chat has been opened - updates the baseline for animation
  const markChatOpened = () => {
    chatOpenedMessageCountRef.current = messages.length;
  };

  // Helper function to determine if a message should animate
  const shouldMessageAnimate = (index: number) => {
    return index >= chatOpenedMessageCountRef.current;
  };

  return {
    // State
    messages,
    inputValue,
    isLoading,
    currentActions,
    isActionsMinimized,
    hasInteracted,
    scrollRef,
    sessionId,

    // Animation helpers
    shouldMessageAnimate,
    markChatOpened,

    // Setters
    setInputValue,
    setIsActionsMinimized,
    setHasInteracted,

    // Handlers
    handleSendMessage,
    handleCancelRequest,
    handleClearMessages,
    handleKeyDown,
    handleFeedback,
  };
};
