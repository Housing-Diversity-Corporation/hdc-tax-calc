import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Save, Loader2, X, Plus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';
import { tokenService } from '../../../services/api';

const STATUS_OPTIONS = ['In Progress', 'Completed', 'Under Review', 'Archived'];
const PRESET_TAGS = ['OZ', 'LIHTC', 'HTC', 'NMTC', 'Solar', 'Wind', 'Rehab'];

export interface SaveConfigMetadata {
  isShared: boolean;
  statusCategory: string;
  tags: string[];
}

interface SaveConfigurationProps {
  onSaveConfiguration: (configName: string, metadata: SaveConfigMetadata) => Promise<void>;
  onConfigurationSaved?: () => void;
  buttonStyle?: 'full' | 'icon' | 'compact';
  buttonClassName?: string;
  buttonContainerStyle?: React.CSSProperties;
  autoTags?: string[];
  stateCode?: string;
  /** When set, the config name is locked (read-only) — used for shared configs owned by others */
  lockedName?: string;
}

const SaveConfiguration: React.FC<SaveConfigurationProps> = ({
  onSaveConfiguration,
  onConfigurationSaved,
  buttonStyle = 'full',
  buttonClassName = '',
  buttonContainerStyle = {},
  autoTags = [],
  stateCode,
  lockedName,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configName, setConfigName] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [statusCategory, setStatusCategory] = useState('In Progress');
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTag, setShowCustomTag] = useState(false);

  const handleSave = () => {
    const isAuth = tokenService.isAuthenticated();

    if (!isAuth) {
      toast.warning('Authentication Required', {
        description: 'Please sign in to save calculator configurations.'
      });
      return;
    }

    setConfigName(lockedName || '');
    setIsShared(true);
    setStatusCategory('In Progress');
    setCustomStatusInput('');
    setShowCustomStatus(false);
    setSelectedTags([...autoTags]);
    setCustomTagInput('');
    setShowCustomTag(false);
    setShowSaveDialog(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const val = customTagInput.trim();
    if (val && !selectedTags.includes(val)) {
      setSelectedTags(prev => [...prev, val]);
      setCustomTagInput('');
      setShowCustomTag(false);
    }
  };

  const addCustomStatus = () => {
    const val = customStatusInput.trim();
    if (val) {
      setStatusCategory(val);
      setCustomStatusInput('');
      setShowCustomStatus(false);
    }
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
      await onSaveConfiguration(configName, {
        isShared,
        statusCategory,
        tags: selectedTags,
      });

      toast.success('Configuration Saved', {
        description: `Configuration "${configName}" has been saved successfully!`
      });

      setShowSaveDialog(false);

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

  // All available tag options (preset + auto, deduplicated)
  const allTagOptions = [...new Set([...PRESET_TAGS, ...autoTags])];

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
          <div>
            <div className="grid gap-4 py-4">
              {/* Configuration name */}
              <div className="grid gap-1.5">
                <label htmlFor="configName" className="text-sm font-medium">Configuration Name</label>
                <Input
                  id="configName"
                  placeholder="e.g., Downtown Phoenix OZ Fund"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  disabled={isSaving || !!lockedName}
                  autoFocus={!lockedName}
                  className={lockedName ? 'opacity-60' : ''}
                />
                <p className="text-[11px] text-muted-foreground text-right italic">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(/(\w{3})/, '$1.')}
                </p>
              </div>

              {/* Share toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="shareToggle" className="text-sm font-medium">Share with team</label>
                <Switch
                  id="shareToggle"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                  disabled={isSaving}
                />
              </div>

              {/* Status category — dropdown with custom option */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status Category</label>
                {!showCustomStatus ? (
                  <Select
                    value={statusCategory}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setShowCustomStatus(true);
                      } else {
                        setStatusCategory(val);
                      }
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                      {/* Show current value if it's custom and not in preset list */}
                      {statusCategory && !STATUS_OPTIONS.includes(statusCategory) && (
                        <SelectItem value={statusCategory}>{statusCategory}</SelectItem>
                      )}
                      <SelectItem value="__custom__">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Plus className="h-3 w-3" /> Add your own
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom status"
                      value={customStatusInput}
                      onChange={(e) => setCustomStatusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addCustomStatus(); }
                        if (e.key === 'Escape') setShowCustomStatus(false);
                      }}
                      autoFocus
                      disabled={isSaving}
                    />
                    <Button type="button" size="sm" onClick={addCustomStatus} disabled={!customStatusInput.trim()}>
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags — dropdown with toggleable badges + custom option */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {stateCode && (
                    <Badge
                      variant="secondary"
                      className="text-xs opacity-60 cursor-default"
                    >
                      State:{stateCode}
                    </Badge>
                  )}
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="text-xs cursor-pointer gap-1"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground" disabled={isSaving}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add tags
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-3" align="start">
                    <div className="grid gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Select tags</p>
                      <div className="flex flex-wrap gap-1">
                        {allTagOptions.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            className="text-xs cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="border-t pt-2 mt-1">
                        {!showCustomTag ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-muted-foreground h-8"
                            onClick={() => setShowCustomTag(true)}
                          >
                            <Plus className="h-3 w-3 mr-1.5" /> Add your own
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Custom tag"
                              value={customTagInput}
                              onChange={(e) => setCustomTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); }
                                if (e.key === 'Escape') setShowCustomTag(false);
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button type="button" size="sm" className="h-8" onClick={addCustomTag} disabled={!customTagInput.trim()}>
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
                type="button"
                disabled={isSaving}
                className="!bg-[var(--hdc-sushi)]"
                onClick={() => handleSaveConfiguration()}
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
          </div>
        </DialogContent>
      </Dialog>

      {renderButton()}
    </>
  );
};

export default SaveConfiguration;
