import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { calculatorService, CalculatorConfiguration } from '../../../services/taxbenefits/calculatorService';
import { tokenService } from '../../../services/api';
import { PROPERTY_PRESETS } from '../../../utils/taxbenefits/propertyPresets';

interface PresetSelectorProps {
  onPresetSelect?: (presetId: string) => void;
  refreshTrigger?: number; // Used to trigger refresh when a new config is saved
}

interface ConfigurationItem {
  name: string;
  code: string;
  data?: CalculatorConfiguration;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  onPresetSelect,
  refreshTrigger = 0
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [userConfigurations, setUserConfigurations] = useState<CalculatorConfiguration[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<{ id: number; name: string } | null>(null);

  // Fetch ALL configurations (from all users for collaboration) on mount and when refreshTrigger changes
  useEffect(() => {
    const fetchUserConfigurations = async () => {
      if (tokenService.isAuthenticated()) {
        try {
          // Get all configurations from all users for collaboration
          const configs = await calculatorService.getAllConfigurations();
          setUserConfigurations(configs);
        } catch (error) {
          console.error('Error fetching configurations:', error);
        }
      }
    };
    fetchUserConfigurations();
  }, [refreshTrigger]);

  // Separate user configs by completion status
  const completeConfigs = userConfigurations.filter(config => config.completionStatus === 'complete');
  const inProgressConfigs = userConfigurations.filter(config => config.completionStatus === 'in-progress' || !config.completionStatus);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);

    if (value && onPresetSelect) {
      onPresetSelect(value);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedPreset) return;

    // Only allow deletion of saved configs, not built-in presets
    if (!selectedPreset.startsWith('saved-config-')) {
      toast.error('Cannot delete built-in presets');
      return;
    }

    // Extract config ID from selectedPreset value (format: "saved-config-123")
    const configId = parseInt(selectedPreset.split('-')[2]);
    const config = userConfigurations.find(c => c.id === configId);

    if (config) {
      setConfigToDelete({ id: config.id!, name: config.configurationName || `Config ${config.id}` });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;

    try {
      await calculatorService.deleteConfiguration(configToDelete.id);

      toast.success('Configuration Deleted', {
        description: `Configuration "${configToDelete.name}" has been deleted.`
      });

      // Refetch user configurations to update the dropdown
      const configs = await calculatorService.getConfigurations();
      setUserConfigurations(configs);

      // Clear selection if the deleted config was selected
      if (selectedPreset === `saved-config-${configToDelete.id}`) {
        setSelectedPreset('');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Delete Failed', {
        description: 'Failed to delete configuration. Please try again.'
      });
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{configToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold">
          Property Presets
        </label>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-full !border-border">
              <SelectValue placeholder="Select Configuration" />
            </SelectTrigger>
            <SelectContent>
              {/* Built-in Property Presets */}
              <SelectGroup>
                <SelectLabel>Built-in Presets</SelectLabel>
                {PROPERTY_PRESETS.map(preset => (
                  <SelectItem
                    key={preset.id}
                    value={preset.id}
                  >
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectGroup>

              {completeConfigs.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Complete Configurations</SelectLabel>
                  {completeConfigs.map(config => (
                    <SelectItem
                      key={config.id}
                      value={`saved-config-${config.id}`}
                    >
                      {config.configurationName || `Config ${config.id}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {inProgressConfigs.length > 0 && (
                <SelectGroup>
                  <SelectLabel>In-Progress Configurations</SelectLabel>
                  {inProgressConfigs.map(config => (
                    <SelectItem
                      key={config.id}
                      value={`saved-config-${config.id}`}
                    >
                      {config.configurationName || `Config ${config.id}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          {selectedPreset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
              onClick={handleDeleteClick}
              title="Delete selected configuration"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default PresetSelector;
