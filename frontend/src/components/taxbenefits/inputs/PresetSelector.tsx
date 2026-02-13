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
  const [presets, setPresets] = useState<CalculatorConfiguration[]>([]);
  const [userConfigurations, setUserConfigurations] = useState<CalculatorConfiguration[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; type: 'preset' | 'config' } | null>(null);

  // Fetch presets and configurations on mount and when refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch presets from database (replaces hardcoded PROPERTY_PRESETS)
        const dbPresets = await calculatorService.getPresets();
        setPresets(dbPresets);
      } catch (error) {
        console.error('Error fetching presets:', error);
      }

      if (tokenService.isAuthenticated()) {
        try {
          const configs = await calculatorService.getAllConfigurations();
          setUserConfigurations(configs);
        } catch (error) {
          console.error('Error fetching configurations:', error);
        }
      }
    };
    fetchData();
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

    if (selectedPreset.startsWith('preset-')) {
      const presetId = parseInt(selectedPreset.replace('preset-', ''));
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        setItemToDelete({ id: preset.id!, name: preset.dealName || preset.configurationName || `Preset ${preset.id}`, type: 'preset' });
        setDeleteDialogOpen(true);
      }
    } else if (selectedPreset.startsWith('config-')) {
      const configId = parseInt(selectedPreset.replace('config-', ''));
      const config = userConfigurations.find(c => c.id === configId);
      if (config) {
        setItemToDelete({ id: config.id!, name: config.configurationName || config.dealName || `Config ${config.id}`, type: 'config' });
        setDeleteDialogOpen(true);
      }
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'preset') {
        await calculatorService.deletePreset(itemToDelete.id);
        toast.success('Preset Deleted', {
          description: `Preset "${itemToDelete.name}" has been deleted.`
        });
        const dbPresets = await calculatorService.getPresets();
        setPresets(dbPresets);
      } else {
        await calculatorService.deleteConfiguration(itemToDelete.id);
        toast.success('Configuration Deleted', {
          description: `Configuration "${itemToDelete.name}" has been deleted.`
        });
        const configs = await calculatorService.getAllConfigurations();
        setUserConfigurations(configs);
      }

      // Clear selection if the deleted item was selected
      const prefix = itemToDelete.type === 'preset' ? 'preset' : 'config';
      if (selectedPreset === `${prefix}-${itemToDelete.id}`) {
        setSelectedPreset('');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Delete Failed', {
        description: `Failed to delete ${itemToDelete.type}. Please try again.`
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.type === 'preset' ? 'Preset' : 'Configuration'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
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
              {/* Built-in Property Presets (from database) */}
              {presets.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Built-in Presets</SelectLabel>
                  {presets.map(preset => (
                    <SelectItem
                      key={preset.id}
                      value={`preset-${preset.id}`}
                    >
                      {preset.dealName || preset.configurationName || `Preset ${preset.id}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {completeConfigs.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Complete Configurations</SelectLabel>
                  {completeConfigs.map(config => (
                    <SelectItem
                      key={config.id}
                      value={`config-${config.id}`}
                    >
                      {config.configurationName || config.dealName || `Config ${config.id}`}
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
                      value={`config-${config.id}`}
                    >
                      {config.configurationName || config.dealName || `Config ${config.id}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
            onClick={handleDeleteClick}
            disabled={!selectedPreset}
            title="Delete selected configuration"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default PresetSelector;
