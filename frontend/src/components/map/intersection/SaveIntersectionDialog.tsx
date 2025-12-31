import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface SaveIntersectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
  defaultName?: string;
}

/**
 * Dialog for saving intersection results
 * Provides a user-friendly interface for naming and saving intersection data
 */
export const SaveIntersectionDialog: React.FC<SaveIntersectionDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  defaultName = '',
}) => {
  const [name, setName] = useState(defaultName);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName, open]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSave(name.trim());
      onOpenChange(false);
      setName('');
    } catch (error) {
      // Error handling is done in the parent hook
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Intersection</DialogTitle>
          <DialogDescription>
            Save this intersection result for future reference. You can reload it later from your saved intersections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Intersection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Downtown Transit Hub Zones"
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name to easily identify this intersection later
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="bg-[#7fbd45] hover:bg-[#6fa03a]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Intersection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
