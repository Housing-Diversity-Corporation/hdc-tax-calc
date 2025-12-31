import { useState, useEffect } from 'react';
import { Rating } from 'primereact/rating';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';

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

type MapAction =
  | ToggleLayerAction
  | SearchPlaceAction
  | ZoomToLocationAction
  | PerformIntersectionAction
  | ApplyFilterAction
  | CreateMarkerAction;

interface FeedbackComponentProps {
  query: string;
  actions: MapAction[];
  executionTime: number;
  sessionId: string;
  onFeedbackSubmit: (feedback: UserFeedback) => void;
}

interface UserFeedback {
  rating: number;
  helpfulActions: string[];
  unhelpfulActions: string[];
  missingCapability: string;
  additionalComments: string;
  preferredResponse?: string;
}

export default function FeedbackComponent({
  query,
  actions,
  executionTime,
  sessionId,
  onFeedbackSubmit
}: FeedbackComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [helpfulActions, setHelpfulActions] = useState<Set<string>>(new Set());
  const [unhelpfulActions, setUnhelpfulActions] = useState<Set<string>>(new Set());
  const [missingCapability, setMissingCapability] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [preferredResponse, setPreferredResponse] = useState('');
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Show feedback prompt after actions complete
  useEffect(() => {
    if (actions.length > 0 && !hasSubmitted) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actions, hasSubmitted]);

  const handleQuickFeedback = (quickRating: number) => {
    setRating(quickRating);
    
    if (quickRating >= 4) {
      // Good experience - submit immediately
      submitFeedback(quickRating, [], [], '', '');
    } else {
      // Not great - ask for more details
      setShowDetailedFeedback(true);
    }
  };

  const toggleActionFeedback = (actionId: string, isHelpful: boolean) => {
    if (isHelpful) {
      setUnhelpfulActions(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
      setHelpfulActions(prev => {
        const next = new Set(prev);
        if (next.has(actionId)) {
          next.delete(actionId);
        } else {
          next.add(actionId);
        }
        return next;
      });
    } else {
      setHelpfulActions(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
      setUnhelpfulActions(prev => {
        const next = new Set(prev);
        if (next.has(actionId)) {
          next.delete(actionId);
        } else {
          next.add(actionId);
        }
        return next;
      });
    }
  };

  const submitFeedback = async (
    finalRating?: number,
    helpful?: string[],
    unhelpful?: string[],
    missing?: string,
    comments?: string,
    preferred?: string
  ) => {
    const feedback: UserFeedback = {
      rating: finalRating || rating,
      helpfulActions: helpful || Array.from(helpfulActions),
      unhelpfulActions: unhelpful || Array.from(unhelpfulActions),
      missingCapability: missing || missingCapability,
      additionalComments: comments || additionalComments,
      preferredResponse: preferred || preferredResponse
    };

    // Send feedback to backend
    try {
      const response = await fetch('/api/rag/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          sessionId,
          query,
          actions,
          feedback,
          executionTime
        })
      });

      if (response.ok) {
        setHasSubmitted(true);
        setIsVisible(false);
        setShowDetailedFeedback(false);
        onFeedbackSubmit(feedback);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (hasSubmitted) {
    return null;
  }

  return (
    <>
      {/* Quick feedback bar */}
      {isVisible && !showDetailedFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'white',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '400px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 500 }}>
            How was this response?
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              icon="pi pi-thumbs-up"
              className="p-button-success p-button-text"
              onClick={() => handleQuickFeedback(5)}
              tooltip="Perfect!"
            />
            <Button
              icon="pi pi-thumbs-up"
              className="p-button-text"
              onClick={() => handleQuickFeedback(4)}
              tooltip="Good"
              style={{ opacity: 0.7 }}
            />
            <Button
              icon="pi pi-minus"
              className="p-button-text"
              onClick={() => handleQuickFeedback(3)}
              tooltip="Okay"
            />
            <Button
              icon="pi pi-thumbs-down"
              className="p-button-text"
              onClick={() => handleQuickFeedback(2)}
              tooltip="Not great"
              style={{ opacity: 0.7 }}
            />
            <Button
              icon="pi pi-thumbs-down"
              className="p-button-danger p-button-text"
              onClick={() => handleQuickFeedback(1)}
              tooltip="Poor"
            />
            <Button
              icon="pi pi-times"
              className="p-button-text p-button-secondary"
              onClick={() => setIsVisible(false)}
              style={{ marginLeft: 'auto' }}
            />
          </div>
        </div>
      )}

      {/* Detailed feedback dialog */}
      <Dialog
        header="Help us improve"
        visible={showDetailedFeedback}
        style={{ width: '500px' }}
        onHide={() => setShowDetailedFeedback(false)}
        modal
      >
        <div style={{ padding: '10px' }}>
          {/* Rating */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Overall rating:
            </label>
            <Rating
              value={rating}
              onChange={(e) => setRating(e.value || 0)}
              stars={5}
              cancel={false}
            />
          </div>

          {/* Action feedback */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Which actions were helpful/unhelpful?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {actions.map((action, idx) => {
                const actionId = `${action.type}-${idx}`;
                const isHelpful = helpfulActions.has(actionId);
                const isUnhelpful = unhelpfulActions.has(actionId);
                
                return (
                  <div key={actionId} style={{ display: 'flex', gap: '4px' }}>
                    <Chip
                      label={action.explanation || action.type}
                      className={
                        isHelpful ? 'p-chip-success' : 
                        isUnhelpful ? 'p-chip-danger' : ''
                      }
                      style={{
                        cursor: 'pointer',
                        opacity: (!isHelpful && !isUnhelpful) ? 0.7 : 1
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Button
                        icon="pi pi-thumbs-up"
                        className={`p-button-text p-button-sm ${isHelpful ? 'p-button-success' : ''}`}
                        onClick={() => toggleActionFeedback(actionId, true)}
                        style={{ padding: '2px', minWidth: '24px', height: '24px' }}
                      />
                      <Button
                        icon="pi pi-thumbs-down"
                        className={`p-button-text p-button-sm ${isUnhelpful ? 'p-button-danger' : ''}`}
                        onClick={() => toggleActionFeedback(actionId, false)}
                        style={{ padding: '2px', minWidth: '24px', height: '24px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missing capability */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              What were you trying to do that didn't work?
            </label>
            <InputTextarea
              value={missingCapability}
              onChange={(e) => setMissingCapability(e.target.value)}
              placeholder="E.g., 'I wanted to filter by specific parcel size' or 'I expected it to zoom to a different area'"
              rows={2}
              style={{ width: '100%' }}
            />
          </div>

          {/* Preferred response */}
          {rating <= 2 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                What actions would you have preferred?
              </label>
              <InputTextarea
                value={preferredResponse}
                onChange={(e) => setPreferredResponse(e.target.value)}
                placeholder="Describe what you expected to happen..."
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Additional comments */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Any other feedback?
            </label>
            <InputTextarea
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Optional additional comments..."
              rows={2}
              style={{ width: '100%' }}
            />
          </div>

          {/* Submit buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              label="Skip"
              className="p-button-text"
              onClick={() => {
                setShowDetailedFeedback(false);
                setIsVisible(false);
              }}
            />
            <Button
              label="Submit Feedback"
              icon="pi pi-send"
              onClick={() => submitFeedback()}
              disabled={rating === 0}
            />
          </div>
        </div>
      </Dialog>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .feedback-chip {
          transition: all 0.2s ease;
        }
        
        .feedback-chip:hover {
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
}