import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';

interface SaveButtonProps {
  hasMarker?: boolean;
  hasIntersection?: boolean;
  hasSearchResults?: boolean;
  onSaveMarker?: () => void;
  onSaveIntersection?: () => void;
  onSaveSearchResults?: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  hasMarker = false,
  hasIntersection = false,
  hasSearchResults = false,
  onSaveMarker,
  onSaveIntersection,
  onSaveSearchResults,
  size = 'icon',
  variant = 'outline',
  className = '',
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasAnythingToSave = hasMarker || hasIntersection || hasSearchResults;

  const handleSaveClick = (saveFunction?: () => void) => {
    if (saveFunction) {
      saveFunction();
      setDialogOpen(false);
    }
  };

  // If only one thing to save, trigger it directly
  const handleButtonClick = () => {
    const saveOptions = [
      { has: hasMarker, fn: onSaveMarker },
      { has: hasIntersection, fn: onSaveIntersection },
      { has: hasSearchResults, fn: onSaveSearchResults },
    ].filter(opt => opt.has);

    if (saveOptions.length === 1 && saveOptions[0].fn) {
      saveOptions[0].fn();
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleButtonClick}
        disabled={!hasAnythingToSave}
        className={`${hasAnythingToSave ? 'utility-button-breathe' : '!opacity-0 !pointer-events-none hidden'} ${className}`}
        style={hasAnythingToSave ? { backgroundColor: '#734968', color: 'white', borderColor: '#734968' } : {}}
      >
        <Save className="h-4 w-4" />
        <span className="button-text">Save</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Data</DialogTitle>
            <DialogDescription>
              Choose what you'd like to save
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {hasMarker && onSaveMarker && (
              <Button
                onClick={() => handleSaveClick(onSaveMarker)}
                className="justify-start"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Marker
              </Button>
            )}
            {hasIntersection && onSaveIntersection && (
              <Button
                onClick={() => handleSaveClick(onSaveIntersection)}
                className="justify-start"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Intersection
              </Button>
            )}
            {hasSearchResults && onSaveSearchResults && (
              <Button
                onClick={() => handleSaveClick(onSaveSearchResults)}
                className="justify-start"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Search Results
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
