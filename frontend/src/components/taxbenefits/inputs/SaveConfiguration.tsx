import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Save, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { tokenService } from '../../../services/api';

interface SaveConfigurationProps {
  onSaveConfiguration: (configName: string) => Promise<void>;
  onConfigurationSaved?: () => void; // Callback to trigger preset list refresh
  buttonStyle?: 'full' | 'icon' | 'compact'; // Different button styles
  buttonClassName?: string;
  buttonContainerStyle?: React.CSSProperties;
}

const SaveConfiguration: React.FC<SaveConfigurationProps> = ({
  onSaveConfiguration,
  onConfigurationSaved,
  buttonStyle = 'full',
  buttonClassName = '',
  buttonContainerStyle = {}
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configName, setConfigName] = useState(`Configuration - ${new Date().toLocaleDateString()}`);

  const handleSave = () => {
    // Check if user is authenticated
    if (!tokenService.isAuthenticated()) {
      toast.warning('Authentication Required', {
        description: 'Please sign in to save calculator configurations.'
      });
      return;
    }

    // Reset config name with new timestamp
    setConfigName(`Configuration - ${new Date().toLocaleDateString()}`);
    // Show the save dialog
    setShowSaveDialog(true);
  };

  const handleSaveConfiguration = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!configName.trim()) {
      toast.error('Invalid Name', {
        description: 'Please enter a configuration name.'
      });
      return;
    }

    setIsSaving(true);

    try {
      // Call the parent's save function with the configuration name
      await onSaveConfiguration(configName);

      // Show success toast
      toast.success('Configuration Saved', {
        description: `Configuration "${configName}" has been saved successfully!`
      });

      // Close dialog
      setShowSaveDialog(false);

      // Trigger callback if provided
      if (onConfigurationSaved) {
        onConfigurationSaved();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Save Failed', {
        description: 'Failed to save configuration. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderButton = () => {
    switch (buttonStyle) {
      case 'icon':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="icon"
                  className={`!bg-[var(--hdc-sushi)] ${buttonClassName}`}
                  style={{
                    ...buttonContainerStyle
                  }}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Configuration</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'compact':
        return (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`!bg-[var(--hdc-sushi)] !px-1.5 !py-1 sm:!px-3 md:!px-4 md:!py-2 text-[10px] sm:text-xs md:text-sm ${buttonClassName}`}
            style={{
              ...buttonContainerStyle
            }}
          >
            {isSaving ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Save className="h-3 w-3 md:h-4 md:w-4" />}
            <span className="hidden md:inline md:ml-2">Save Configuration</span>
            <span className="hidden sm:inline md:hidden sm:ml-1">Save</span>
          </Button>
        );
      case 'full':
      default:
        return (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`!bg-[var(--hdc-sushi)] w-full ${buttonClassName}`}
            style={{
              ...buttonContainerStyle
            }}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Current Configuration"}
          </Button>
        );
    }
  };

  return (
    <>
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Calculator Configuration</DialogTitle>
            <DialogDescription>
              Enter a name for this configuration. You can load it later from your saved presets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfiguration}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="configName"
                  placeholder="Enter configuration name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  disabled={isSaving}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="!bg-[var(--hdc-sushi)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {renderButton()}
    </>
  );
};

export default SaveConfiguration;
