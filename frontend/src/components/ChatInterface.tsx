import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { useResponsive } from '../hooks/useResponsive';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: MapAction[];
  interactionId?: number;
  feedbackStatus?: 'none' | 'pending' | 'submitted';
  userFeedback?: 'dog_treat' | 'no_treat';
}

// Payloads
interface ToggleLayerPayload {
  layerId: string;
  enabled: boolean;
}

interface SearchPlacePayload {
  query: string;
}

interface ZoomToLocationPayload {
  lat: number;
  lng: number;
  zoom: number;
}

interface SetZoomPayload {
  zoomLevel: number;
}

interface ApplyFilterPayload {
  filterId: string;
  values: string[];
}

interface CreateMarkerPayload {
  lat: number;
  lng: number;
  name: string;
}

// Actions
interface BaseMapAction {
  sequenceId: number;
  explanation: string;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  waitForCompletion?: boolean;
  dependsOn?: string[];
  delayMs?: number;
}

interface ToggleLayerAction extends BaseMapAction {
  type: 'TOGGLE_LAYER';
  payload: ToggleLayerPayload;
}

interface SearchPlaceAction extends BaseMapAction {
  type: 'SEARCH_PLACE';
  payload: SearchPlacePayload;
}

interface ZoomToLocationAction extends BaseMapAction {
  type: 'ZOOM_TO_LOCATION';
  payload: ZoomToLocationPayload;
}

interface SetZoomAction extends BaseMapAction {
  type: 'SET_ZOOM';
  payload: SetZoomPayload;
}

interface PerformIntersectionAction extends BaseMapAction {
  type: 'PERFORM_INTERSECTION';
  payload: Record<string, never>;
}

interface ApplyFilterAction extends BaseMapAction {
  type: 'APPLY_FILTER';
  payload: ApplyFilterPayload;
}

interface CreateMarkerAction extends BaseMapAction {
  type: 'CREATE_MARKER';
  payload: CreateMarkerPayload;
}

interface CompleteAction extends BaseMapAction {
  type: 'COMPLETE';
  payload: Record<string, never>;
}

interface HighlightFeatureAction extends BaseMapAction {
  type: 'HIGHLIGHT_FEATURE';
  payload: Record<string, unknown>;
}

interface ShowMessageAction extends BaseMapAction {
  type: 'SHOW_MESSAGE';
  payload: {
    message: string;
  };
}

type MapAction =
  | ToggleLayerAction
  | SearchPlaceAction
  | ZoomToLocationAction
  | SetZoomAction
  | PerformIntersectionAction
  | ApplyFilterAction
  | CreateMarkerAction
  | HighlightFeatureAction
  | ShowMessageAction
  | CompleteAction;

interface StepByStepResponse {
  action: MapAction;
  currentStep: number;
  totalSteps: number;
  sessionId: string;
  success?: boolean;
  completed?: boolean;
  hasNext?: boolean;
  interactionId?: number;
}

interface ChatInterfaceProps {
  onToggleLayer: (layerId: string) => void;
  onSearchPlace: (query: string) => void;
  onPerformIntersection: () => void;
  onZoomTo: (lat: number, lng: number, zoom: number) => void;
  onApplyFilter: (filterId: string, values: string[]) => void;
  onCreateMarker: (lat: number, lng: number, name: string) => void;
  // Function to get current map state (fresh)
  getCurrentMapState: () => {
    layers: Array<{
      id: string;
      name: string;
      enabled: boolean;
      apiTableId?: string;
    }>;
    currentZoom?: number;
    mapBounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
}

export default function ChatInterface({
  onToggleLayer,
  onSearchPlace,
  onPerformIntersection,
  onZoomTo,
  onApplyFilter,
  onCreateMarker,
  getCurrentMapState
}: ChatInterfaceProps) {

  // Function to get current map state with debug logging
  const getMapStateWithDebug = () => {
    const mapState = getCurrentMapState();
    const enabledLayers = mapState.layers || [];
    const enabledCount = enabledLayers.filter((layer) => layer.enabled).length;
    console.log(`🔍 Frontend Debug: getCurrentMapState() - ${enabledCount} enabled layers out of ${enabledLayers.length} total`);
    enabledLayers.forEach((layer, i: number) => {
      if (layer.enabled) {
        console.log(`🔍 Frontend Debug: Enabled layer ${i}: ${layer.name} (${layer.id}) - apiTableId: ${layer.apiTableId}`);
      }
    });

    return {
      enabledLayers,
      currentZoom: mapState.currentZoom,
      bounds: mapState.mapBounds,
      activeFilters: {} // Could be extended later
    };
  };
  const { width } = useResponsive();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentActions, setCurrentActions] = useState<MapAction[]>([]);
  const [, setExecutingActionId] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, bottom: 20, right: 20 });
  const [isActionsMinimized, setIsActionsMinimized] = useState(false);
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    const stored = sessionStorage.getItem('chat-session-id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    sessionStorage.setItem('chat-session-id', newId);
    return newId;
  });
  const toastRef = useRef<Toast>(null);

  // Drag handlers for minimized state
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMinimized) return;
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

    // If there's any movement, mark as dragged
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasDragged(true);
    }

    const newRight = Math.max(0, Math.min(window.innerWidth - 60, dragStartPos.current.right + deltaX));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, dragStartPos.current.bottom + deltaY));

    setPosition({ bottom: newBottom, right: newRight });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add/remove mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  // Feedback submission handler
  const handleFeedback = async (messageIndex: number, feedbackType: 'dog_treat' | 'no_treat') => {
    try {
      const message = messages[messageIndex];
      if (!message.interactionId) {
        console.warn('No interaction ID found for feedback');
        return;
      }

      // Update UI immediately
      setMessages(prev => prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, feedbackStatus: 'pending', userFeedback: feedbackType }
          : msg
      ));

      // Submit feedback to backend
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          interactionId: message.interactionId,
          feedbackType: feedbackType,
          additionalData: {
            sessionId: sessionId,
            messageContent: message.content,
            timestamp: message.timestamp.toISOString()
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update UI to show feedback submitted
        setMessages(prev => prev.map((msg, idx) =>
          idx === messageIndex
            ? { ...msg, feedbackStatus: 'submitted' }
            : msg
        ));

        toastRef.current?.show({
          severity: 'success',
          summary: 'Treat Given!',
          detail: feedbackType === 'dog_treat' ? 'Woof! Churro loves the treat! 🦴' : 'Churro will try harder next time! 🐕',
          life: 3000
        });
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);

      // Revert UI on error
      setMessages(prev => prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, feedbackStatus: 'none', userFeedback: undefined }
          : msg
      ));

      toastRef.current?.show({
        severity: 'error',
        summary: 'Feedback Failed',
        detail: 'Could not submit feedback. Please try again.',
        life: 3000
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');

    const response = await processSmartQuery(userInput);

    // Only add a message if there's actual content
    if (response.content && response.content.trim()) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
        interactionId: response.interactionId,
        feedbackStatus: 'none'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } else if (response.interactionId) {
      // For step-by-step actions, add interaction ID to the last assistant message for feedback
      setMessages(prev => {
        const newMessages = [...prev];
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              ...newMessages[i],
              interactionId: response.interactionId,
              feedbackStatus: 'none'
            };
            break;
          }
        }
        return newMessages;
      });
    }
  };

  const processSmartQuery = async (message: string): Promise<{content: string, actions?: MapAction[], interactionId?: number}> => {
    console.log('🔄 Processing query:', message);
    setIsProcessing(true);
    setCurrentActions([]);

    try {
      const response = await fetch('/api/chat/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          message,
          sessionId,
          mapState: getMapStateWithDebug()
        })
      });

      // Validate response before parsing
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('🔍 Response content-type:', contentType);
      console.log('🔍 Response status:', response.status);
      if (!contentType || (!contentType.includes('application/json') && !contentType.includes('text/plain'))) {
        console.warn('Unexpected content-type:', contentType);
        // Don't throw error, just log warning - some servers may not set proper headers
      }

      const responseText = await response.text();
      console.log('🔍 Response text (first 200 chars):', responseText.substring(0, 200));
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Successfully parsed response:', data);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('Response text (first 500 chars):', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from server');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if response is step-by-step execution
      if (data.isStepByStep) {
        console.log(`Starting step-by-step execution: ${data.currentStep} of ${data.totalSteps}`);
        return await executeStepByStepActions(data);
      }
      // Check if response is conversational or single action
      else if (Array.isArray(data)) {
        // Single action or legacy mode - array of MapActions
        const actions = data as MapAction[];
        setCurrentActions(actions);

        // Execute single action
        if (actions.length === 1) {
          await executeAction(actions[0]);
          return {
            content: `Completed: ${actions[0].explanation}`,
            actions
          };
        } else {
          // Legacy multiple action execution (fallback)
          for (const action of actions) {
            await executeAction(action);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          return {
            content: `I've completed ${actions.length} actions for: "${message}"`,
            actions
          };
        }
      } else if (data.response) {
        // Conversational response
        return {
          content: data.response,
          interactionId: data.interactionId
        };
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error processing query:', error);

      let errorMessage = 'Sorry, I encountered an error processing your request.';
      let toastDetail = 'Failed to process your request';

      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = 'Woof! I got confused by my own response. Let me try that again.';
          toastDetail = 'Server response format error';
        } else if (error.message.includes('HTTP')) {
          errorMessage = 'I\'m having trouble connecting to my brain right now. Please try again.';
          toastDetail = 'Connection error';
        } else if (error.message.includes('Empty response')) {
          errorMessage = 'I seem to have lost my voice. Please try your request again.';
          toastDetail = 'Empty server response';
        } else {
          errorMessage = `Woof! ${error.message}`;
          toastDetail = error.message;
        }
      }

      toastRef.current?.show({
        severity: 'error',
        summary: 'Churro Error',
        detail: toastDetail
      });

      return {
        content: errorMessage
      };
    } finally {
      setIsProcessing(false);
      setExecutingActionId(null);
    }
  };

  const executeStepByStepActions = async (initialData: StepByStepResponse): Promise<{content: string, actions?: MapAction[], interactionId?: number}> => {
    const allActions: MapAction[] = [];
    let currentData = initialData;

    while (currentData.action) {
      const action = currentData.action;
      allActions.push(action);

      console.log(`Executing step ${currentData.currentStep} of ${currentData.totalSteps}: ${action.type}`);

      // Update UI to show all actions, maintaining previous statuses
      setCurrentActions(prev => {
        const newActions = [...allActions];
        // Preserve the status of previously completed actions
        newActions.forEach((newAction, index) => {
          const existingAction = prev.find(a => a.sequenceId === newAction.sequenceId);
          if (existingAction?.status === 'completed') {
            newActions[index] = { ...newAction, status: 'completed' };
          }
        });
        return newActions;
      });

      // Execute the action and wait for it to complete fully
      await executeAction(action);

      // Send confirmation and request next action
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
          console.error('HTTP error in next-action:', nextResponse.status, nextResponse.statusText);
          break;
        }

        const responseText = await nextResponse.text();
        if (!responseText || responseText.trim().length === 0) {
          console.error('Empty response from next-action endpoint');
          break;
        }

        let nextData;
        try {
          nextData = JSON.parse(responseText) as StepByStepResponse & { success: boolean; completed?: boolean; error?: string };
        } catch (parseError) {
          console.error('JSON parsing failed in next-action:', parseError);
          console.error('Response text:', responseText);
          break;
        }

        if (!nextData.success) {
          console.error('Failed to get next action:', nextData.error);
          break;
        }

        if (nextData.completed) {
          console.log('All steps completed successfully');
          break;
        }

        currentData = nextData;
      } catch (error) {
        console.error('Error requesting next action:', error);
        break;
      }
    }

    // Don't reset currentActions here - it already has the proper statuses from the execution loop
    // Don't create a completion message - let the previous assistant messages stand
    return {
      content: '', // No completion message needed - the action panel shows progress
      actions: allActions,
      interactionId: initialData.interactionId // Pass through the interaction ID for feedback
    };
  };

  const executeAction = async (action: MapAction) => {
    setExecutingActionId(action.sequenceId);

    setCurrentActions(prev =>
      prev.map(a =>
        a.sequenceId === action.sequenceId
          ? { ...a, status: 'executing' }
          : a
      )
    );

    try {
      switch (action.type) {
        case 'TOGGLE_LAYER': {
          const { layerId } = action.payload;
          onToggleLayer(layerId);
          // Wait for layer to load if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 6000));
          }
          break;
        }
        case 'SEARCH_PLACE': {
          onSearchPlace(action.payload.query);
          break;
        }
        case 'SET_ZOOM': {
          const { zoomLevel } = action.payload;
          // Calculate center from bounds or use Seattle as default
          const currentState = getMapStateWithDebug();
          let centerLat = 47.6062; // Default Seattle latitude
          let centerLng = -122.3321; // Default Seattle longitude

          if (currentState.bounds) {
            // Calculate center from bounds
            centerLat = (currentState.bounds.minLat + currentState.bounds.maxLat) / 2;
            centerLng = (currentState.bounds.minLng + currentState.bounds.maxLng) / 2;
          }

          onZoomTo(centerLat, centerLng, zoomLevel);

          // Wait for zoom to complete if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 1500));
          }
          break;
        }
        case 'ZOOM_TO_LOCATION': {
          const { lat, lng, zoom } = action.payload;
          onZoomTo(lat, lng, zoom);
          // Wait for zoom to complete if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 1500));
          }
          break;
        }
        case 'PERFORM_INTERSECTION': {
          onPerformIntersection();
          // Wait for intersection to complete if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 8000));
          }
          break;
        }
        case 'APPLY_FILTER': {
          const { filterId, values } = action.payload;
          onApplyFilter(filterId, values);
          // Wait for filter to apply if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 3000));
          }
          break;
        }
        case 'CREATE_MARKER': {
          const { lat, lng, name } = action.payload;
          onCreateMarker(lat, lng, name);
          break;
        }
        case 'HIGHLIGHT_FEATURE': {
          // Wait for highlighting to complete if it requires confirmation
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 2000));
          }
          break;
        }
        case 'SHOW_MESSAGE': {
          // Display the message in chat
          const message = action.payload.message;

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message,
            timestamp: new Date(),
            interactionId: undefined, // SHOW_MESSAGE actions don't need separate feedback
            feedbackStatus: 'none'
          }]);

          // Wait briefly to show the message
          if (action.waitForCompletion) {
            await new Promise(resolve => setTimeout(resolve, action.delayMs || 1000));
          }
          break;
        }
      }

      // Update action status to completed
      setCurrentActions(prev =>
        prev.map(a =>
          a.sequenceId === action.sequenceId
            ? { ...a, status: 'completed' }
            : a
        )
      );

      // Note: Step-by-step execution handles confirmations at the flow level

    } catch (error) {
      console.error('Error executing action:', error);
      setCurrentActions(prev =>
        prev.map(a =>
          a.sequenceId === action.sequenceId
            ? { ...a, status: 'failed' }
            : a
        )
      );

      // Note: Step-by-step execution handles failure tracking at the flow level
    }
  };

  const suggestedQueries = [
    "What are opportunity zones?",
    "How does zoning affect housing development?",
    "Find opportunity zones in downtown",
    "What demographic data is available?"
  ];

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .layer-toggling {
          animation: pulse 0.5s ease-in-out;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
        }
        .layer-highlighting {
          animation: pulse 2s ease-in-out;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
        }
        .action-timeline {
          padding: 10px;
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
          border-radius: 8px;
          margin: 10px 0;
          color: #FFF8DC;
          border: 2px solid #654321;
        }
        .chat-container {
          transition: all 0.3s ease;
        }
      `}</style>

      <Toast ref={toastRef} />

      <div
        className={`chat-container ${isMinimized ? 'minimized' : ''}`}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          bottom: isMinimized ? position.bottom : 20,
          right: isMinimized ? position.right : 20,
          width: isMinimized ? (width < 768 ? 50 : 60) : (width < 768 ? 'calc(100vw - 20px)' : width < 1200 ? 350 : 400),
          height: isMinimized ? (width < 768 ? 50 : 60) : (width < 768 ? 'calc(100vh - 80px)' : width < 1200 ? 500 : 600),
          maxWidth: isMinimized ? undefined : '95vw',
          maxHeight: isMinimized ? undefined : '90vh',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #DEB887 0%, #D2B48C 50%, #F5DEB3 100%)',
          borderRadius: 15,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          cursor: isMinimized ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: isDragging ? 'none' : 'auto'
        }}
      >
        {/* Header */}
        {isMinimized ? (
          // Minimized state - just Churro's image, clickable to expand
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: 'transform 0.2s ease',
              pointerEvents: 'auto'
            }}
            onClick={() => {
              if (!hasDragged) {
                setIsMinimized(false);
              }
            }}
            onMouseEnter={(e) => !isDragging && (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src='/churro.png'
              alt='Churro - Click to open chat'
              draggable={false}
              style={{
                width: width < 768 ? 40 : 50,
                height: width < 768 ? 40 : 50,
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                pointerEvents: 'none'
              }}
            />
          </div>
        ) : (
          // Expanded state - normal header
          <div style={{
            background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #8D6E63 100%)',
            color: 'white',
            padding: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              <img src='/churro.png' alt='Churro Logo'
                    style={{ width: 45, height: 45, verticalAlign: 'middle', marginLeft: 10, borderRadius:'50%' }} />
              Churro
            </h3>
            <Button
              icon="pi pi-window-minimize"
              className="p-button-text p-button-rounded"
              style={{ color: 'white' }}
              onClick={() => setIsMinimized(true)}
            />
          </div>
        )}

        {!isMinimized && (
          <>
            {/* Action Timeline */}
            {currentActions.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                border: '2px solid #654321',
                borderRadius: '8px',
                margin: '10px',
                color: '#FFF8DC'
              }}>
                {/* Header with minimize button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px 5px 15px',
                  borderBottom: isActionsMinimized ? 'none' : '1px solid #654321'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#FFF8DC' }}>
                    ({currentActions.filter(a => a.status === 'completed').length}/{currentActions.length}) {
                      currentActions.filter(a => a.status === 'completed').length === currentActions.length
                        ? 'Churro done'
                        : 'Churro is fetching...'
                    }
                  </h4>
                  <Button
                    icon={isActionsMinimized ? 'pi pi-chevron-down' : 'pi pi-chevron-up'}
                    className="p-button-text p-button-sm"
                    style={{
                      color: '#FFF8DC',
                      minWidth: '20px',
                      height: '20px',
                      padding: '2px'
                    }}
                    onClick={() => setIsActionsMinimized(!isActionsMinimized)}
                    tooltip={isActionsMinimized ? 'Show actions' : 'Hide actions'}
                  />
                </div>

                {/* Actions list (collapsible) */}
                {!isActionsMinimized && (
                  <div style={{ padding: '5px 15px 15px 15px' }}>
                    {currentActions.map((action, index) => (
                      <div key={action.sequenceId} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px 0',
                        borderBottom: index < currentActions.length - 1 ? '1px solid rgba(255, 248, 220, 0.2)' : 'none',
                        background: action.status === 'executing' ? 'rgba(255, 248, 220, 0.1)' : 'transparent',
                        borderRadius: '4px',
                        marginBottom: '2px'
                      }}>
                        {/* Step number */}
                        <div style={{
                          minWidth: '20px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#FFF8DC'
                        }}>
                          {action.sequenceId}
                        </div>

                        {/* Action description with status */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '12px',
                            opacity: action.status === 'pending' ? 0.6 : 1,
                            textDecoration: action.status === 'completed' ? 'line-through' : 'none',
                            color: action.status === 'completed' ? 'rgba(255, 248, 220, 0.7)' : '#FFF8DC',
                            flex: 1
                          }}>
                            {action.explanation}
                          </span>

                          {/* Status icon */}
                          {action.status === 'completed' && (
                            <i className="pi pi-check-circle" style={{ fontSize: '12px', color: '#4CAF50' }}></i>
                          )}
                          {action.status === 'executing' && (
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '12px', color: '#2196F3' }}></i>
                          )}
                          {action.status === 'failed' && (
                            <i className="pi pi-times-circle" style={{ fontSize: '12px', color: '#F44336' }}></i>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              background: 'linear-gradient(180deg, #F5DEB3 0%, #DDBF94 50%, #D2B48C 100%)'
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#5D4037' }}>
                  <p>Gnawing... ask me to sniff the map</p>
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '12px', marginBottom: '10px' }}>Try:</p>
                    {suggestedQueries.slice(0, 4).map((query, idx) => (
                      <Button
                        key={idx}
                        label={query}
                        className="p-button-outlined p-button-sm"
                        style={{
                          margin: '5px',
                          fontSize: '11px',
                          borderColor: '#8D6E63',
                          color: '#5D4037',
                          backgroundColor: 'rgba(255, 248, 220, 0.8)',
                          transition: 'all 0.2s ease',
                          borderWidth: '2px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#8D6E63';
                          e.currentTarget.style.color = '#FFF8DC';
                          e.currentTarget.style.borderColor = '#654321';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(101, 67, 33, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 248, 220, 0.8)';
                          e.currentTarget.style.color = '#5D4037';
                          e.currentTarget.style.borderColor = '#8D6E63';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => setInput(query)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    {/* Avatar for assistant messages */}
                    {msg.role === 'assistant' && (
                      <img
                        src="/churro.png"
                        alt="Churro Assistant"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      />
                    )}

                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 15px',
                      borderRadius: '10px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)'
                        : 'linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%)',
                      color: msg.role === 'user' ? '#FFF8DC' : '#3E2723',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>{msg.content}</p>
                      {/* Timestamp and feedback row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '5px'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          opacity: 0.7
                        }}>
                          {msg.timestamp.toLocaleTimeString()}
                        </span>

                        {/* Feedback buttons for the last assistant message only */}
                        {msg.role === 'assistant' && msg.interactionId && idx === messages.length - 1 && (
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center'
                          }}>
                            <Button
                              label="🦴"
                              className={`p-button-text p-button-sm ${
                                msg.userFeedback === 'dog_treat' ? 'p-button-success' : ''
                              }`}
                              style={{
                                fontSize: '14px',
                                padding: '2px 4px',
                                opacity: msg.feedbackStatus === 'submitted' ? 0.6 : 1,
                                minWidth: '24px',
                                height: '24px'
                              }}
                              disabled={msg.feedbackStatus !== 'none'}
                              onClick={() => handleFeedback(idx, 'dog_treat')}
                              tooltip="Give Churro a treat! Good boy! 🐕"
                              tooltipOptions={{ position: 'top' }}
                            />
                            <Button
                              label="🚫"
                              className={`p-button-text p-button-sm ${
                                msg.userFeedback === 'no_treat' ? 'p-button-danger' : ''
                              }`}
                              style={{
                                fontSize: '12px',
                                padding: '2px 4px',
                                opacity: msg.feedbackStatus === 'submitted' ? 0.6 : 1,
                                minWidth: '24px',
                                height: '24px'
                              }}
                              disabled={msg.feedbackStatus !== 'none'}
                              onClick={() => handleFeedback(idx, 'no_treat')}
                              tooltip="To the dog house! 🐕"
                              tooltipOptions={{ position: 'top' }}
                            />
                            {msg.feedbackStatus === 'pending' && (
                              <i className="pi pi-spin pi-spinner" style={{ fontSize: '8px', marginLeft: '2px' }}></i>
                            )}
                            {msg.feedbackStatus === 'submitted' && (
                              <span style={{ fontSize: '8px', color: '#666', marginLeft: '2px' }}>
                                {msg.userFeedback === 'dog_treat' ? 'Woof!' : 'Got it!'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '15px',
              borderTop: '2px solid #8D6E63',
              background: 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <InputTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={width < 768 ? "Ask me..." : "Ask me anything about the map...gnawing..."}
                  rows={width < 768 ? 1 : 2}
                  style={{ flex: 1, resize: 'none', fontSize: width < 768 ? '14px' : '16px' }}
                  disabled={isProcessing}
                />
                <Button
                  icon="pi pi-send"
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  loading={isProcessing}
                  style={{
                    background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
                    border: '2px solid #8D6E63',
                    boxShadow: '0 2px 4px rgba(61, 39, 35, 0.3)'
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
