import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '../../ui/command';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../../ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
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
import { Check, ChevronsUpDown, Trash2, ArrowDownAZ, ArrowUpZA, CalendarArrowDown, CalendarArrowUp, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculatorService,
  type CalculatorConfiguration,
  type ConfigurationWithOwner,
  autoDetectTags,
} from '../../../services/taxbenefits/calculatorService';
import { tokenService } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

export interface UpdateNotification {
  green: number;  // Collaborator updates (user owns the config)
  yellow: number; // Non-collaborator updates (shared by others)
}

interface PresetSelectorProps {
  onPresetSelect?: (presetId: string) => void;
  refreshTrigger?: number;
  currentUserId?: number;
  hideLabel?: boolean;
  hideDelete?: boolean;
  onSelectionChange?: (presetId: string | null) => void;
  onDeleteRequest?: () => void;
  onUpdatesDetected?: (notification: UpdateNotification | null) => void;
}

type SortMode = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

const LAST_VISIT_KEY = 'hdc-preset-last-visit';

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  onPresetSelect,
  refreshTrigger = 0,
  currentUserId,
  hideLabel = false,
  hideDelete = false,
  onSelectionChange,
  onDeleteRequest,
  onUpdatesDetected,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presets, setPresets] = useState<CalculatorConfiguration[]>([]);
  const [enrichedConfigs, setEnrichedConfigs] = useState<ConfigurationWithOwner[]>([]);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [activeStateFilters, setActiveStateFilters] = useState<string[]>([]);
  const [activeOwnerFilters, setActiveOwnerFilters] = useState<number[]>([]);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false);
  const [updatedConfigIds, setUpdatedConfigIds] = useState<Set<number>>(new Set());
  const [lastLoadTimestamp, setLastLoadTimestamp] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; type: 'preset' | 'config' } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const lastLoadTimestampRef = useRef<string | null>(null);
  const prevVisitTimestamp = useRef<number>(
    (() => {
      const stored = localStorage.getItem(LAST_VISIT_KEY);
      return stored ? new Date(stored).getTime() : Infinity;
    })()
  );
  const enrichedConfigIdsRef = useRef<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const { isMobile } = useResponsive();

  // Fetch presets and configurations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbPresets = await calculatorService.getPresets();
        setPresets(dbPresets);
      } catch (error) {
        console.error('Error fetching presets:', error);
      }

      if (tokenService.isAuthenticated()) {
        try {
          const prevTimestamp = lastLoadTimestampRef.current;

          const configs = await calculatorService.getAllConfigurationsWithOwners();
          setEnrichedConfigs(configs);
          const now = new Date().toISOString();
          setLastLoadTimestamp(now);
          lastLoadTimestampRef.current = now;

          // Immediate poll using previous timestamp to detect fresh updates
          if (prevTimestamp && refreshTrigger > 0) {
            try {
              const updatedIds = await calculatorService.getUpdatedSince(prevTimestamp);
              if (updatedIds.length > 0) {
                setUpdatedConfigIds(new Set(updatedIds));
              }
            } catch { /* silent */ }
          }
        } catch (error) {
          console.error('Error fetching configurations:', error);
        }
      }
    };
    fetchData();
  }, [refreshTrigger]);

  // Update localStorage with current visit timestamp (for cross-reload badge detection)
  useEffect(() => {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  // Keep enrichedConfigIdsRef in sync for polling comparison
  useEffect(() => {
    enrichedConfigIdsRef.current = new Set(
      enrichedConfigs.map(ec => ec.configuration.id).filter((id): id is number => id != null)
    );
  }, [enrichedConfigs]);

  // Poll for shared config updates every 10s
  useEffect(() => {
    if (!lastLoadTimestamp || !tokenService.isAuthenticated()) return;
    const interval = setInterval(async () => {
      try {
        const updatedIds = await calculatorService.getUpdatedSince(lastLoadTimestamp);
        if (updatedIds.length > 0) {
          const currentIds = enrichedConfigIdsRef.current;
          const hasNewConfigs = updatedIds.some(id => !currentIds.has(id));
          setUpdatedConfigIds(new Set(updatedIds));

          // Re-fetch configs when new ones are detected (so they appear in the dropdown)
          if (hasNewConfigs) {
            const configs = await calculatorService.getAllConfigurationsWithOwners();
            setEnrichedConfigs(configs);
          }
        }
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastLoadTimestamp]);

  // Categorize updates as green (collaborator) or yellow (non-collaborator) and notify parent
  useEffect(() => {
    if (updatedConfigIds.size === 0) {
      onUpdatesDetected?.(null);
      return;
    }
    let green = 0;
    let yellow = 0;
    updatedConfigIds.forEach(id => {
      const ec = enrichedConfigs.find(e => e.configuration.id === id);
      if (!ec) { yellow++; return; }
      const isOwner = ec.ownerUserId === currentUserId;
      const isCollaborator = ec.collaborators?.some(c => c.userId === currentUserId);
      if (isOwner || isCollaborator) {
        green++;
      } else {
        yellow++;
      }
    });
    onUpdatesDetected?.({ green, yellow });
  }, [updatedConfigIds, enrichedConfigs, currentUserId, onUpdatesDetected]);

  // Sort configs
  const sortConfigs = useCallback((configs: ConfigurationWithOwner[]) => {
    const sorted = [...configs];
    switch (sortMode) {
      case 'date-desc':
        sorted.sort((a, b) => (b.configuration.updatedAt || b.configuration.createdAt || '').localeCompare(a.configuration.updatedAt || a.configuration.createdAt || ''));
        break;
      case 'date-asc':
        sorted.sort((a, b) => (a.configuration.updatedAt || a.configuration.createdAt || '').localeCompare(b.configuration.updatedAt || b.configuration.createdAt || ''));
        break;
      case 'alpha-asc':
        sorted.sort((a, b) => {
          const na = (a.configuration.configurationName || a.configuration.dealName || '').toLowerCase();
          const nb = (b.configuration.configurationName || b.configuration.dealName || '').toLowerCase();
          return na.localeCompare(nb);
        });
        break;
      case 'alpha-desc':
        sorted.sort((a, b) => {
          const na = (a.configuration.configurationName || a.configuration.dealName || '').toLowerCase();
          const nb = (b.configuration.configurationName || b.configuration.dealName || '').toLowerCase();
          return nb.localeCompare(na);
        });
        break;
    }
    return sorted;
  }, [sortMode]);

  const toggleDateSort = () => {
    setSortMode(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc');
  };

  const toggleAlphaSort = () => {
    setSortMode(prev => prev === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc');
  };

  // Separate shared vs personal configs
  // Shared: any config explicitly shared (isShared === true), including user's own
  // Personal: only the current user's own configs that are NOT shared
  const sharedConfigs = useMemo(() =>
    enrichedConfigs.filter(ec => ec.configuration.isShared === true),
    [enrichedConfigs]
  );

  const personalConfigs = useMemo(() =>
    enrichedConfigs.filter(ec =>
      ec.ownerUserId === currentUserId && ec.configuration.isShared !== true
    ),
    [enrichedConfigs, currentUserId]
  );

  // Collect feature tags and available states separately
  const { featureTags, availableStates } = useMemo(() => {
    const featureSet = new Set<string>();
    const stateSet = new Set<string>();
    enrichedConfigs.forEach(ec => {
      const stored = ec.configuration.tags?.split(',').filter(Boolean) || [];
      const auto = autoDetectTags(ec.configuration);
      [...stored, ...auto].forEach(t => {
        if (US_STATES.has(t)) {
          stateSet.add(t);
        } else {
          featureSet.add(t);
        }
      });
    });
    return {
      featureTags: Array.from(featureSet),
      availableStates: Array.from(stateSet).sort(),
    };
  }, [enrichedConfigs]);

  // Collect unique owners (for avatar filter)
  interface OwnerInfo { userId: number; fullName: string; profileImageUrl: string | null; }
  const availableOwners = useMemo(() => {
    const map = new Map<number, OwnerInfo>();
    enrichedConfigs.forEach(ec => {
      if (ec.ownerUserId != null && !map.has(ec.ownerUserId)) {
        map.set(ec.ownerUserId, {
          userId: ec.ownerUserId,
          fullName: ec.ownerFullName || 'Unknown',
          profileImageUrl: ec.ownerProfileImageUrl || null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [enrichedConfigs]);

  // Filter by active tags, state filters, and owner filters
  const filterByTags = useCallback((configs: ConfigurationWithOwner[]) => {
    let filtered = configs;
    if (activeTagFilters.length > 0) {
      filtered = filtered.filter(ec => {
        const configTags = new Set([
          ...(ec.configuration.tags?.split(',').filter(Boolean) || []),
          ...autoDetectTags(ec.configuration),
        ]);
        return activeTagFilters.every(t => configTags.has(t));
      });
    }
    if (activeStateFilters.length > 0) {
      filtered = filtered.filter(ec =>
        ec.configuration.selectedState && activeStateFilters.includes(ec.configuration.selectedState)
      );
    }
    if (activeOwnerFilters.length > 0) {
      filtered = filtered.filter(ec =>
        ec.ownerUserId != null && activeOwnerFilters.includes(ec.ownerUserId)
      );
    }
    return filtered;
  }, [activeTagFilters, activeStateFilters, activeOwnerFilters]);

  const toggleStateFilter = (state: string) => {
    setActiveStateFilters(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const toggleOwnerFilter = (userId: number) => {
    setActiveOwnerFilters(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Group by statusCategory
  const groupByStatus = useCallback((configs: ConfigurationWithOwner[]) => {
    const groups: Record<string, ConfigurationWithOwner[]> = {};
    configs.forEach(ec => {
      const cat = ec.configuration.statusCategory || ec.configuration.completionStatus || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ec);
    });
    return groups;
  }, []);


  const toggleTagFilter = (tag: string) => {
    setActiveTagFilters(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSelect = (value: string) => {
    setSelectedPreset(value);
    setOpen(false);
    // Clear update badge for this config if applicable
    const configId = parseInt(value.replace(/^(config|preset)-/, ''));
    if (updatedConfigIds.has(configId)) {
      setUpdatedConfigIds(prev => {
        const next = new Set(prev);
        next.delete(configId);
        return next;
      });
    }
    // Dismiss timestamp-based badges for this config
    if (!isNaN(configId)) {
      setDismissedIds(prev => new Set([...prev, configId]));
    }
    onSelectionChange?.(value);
    if (onPresetSelect) {
      onPresetSelect(value);
    }
  };

  // Find the display name for the selected value
  const selectedLabel = useMemo(() => {
    if (!selectedPreset) return null;
    if (selectedPreset.startsWith('preset-')) {
      const id = parseInt(selectedPreset.replace('preset-', ''));
      const preset = presets.find(p => p.id === id);
      return preset?.dealName || preset?.configurationName || `Preset ${id}`;
    }
    if (selectedPreset.startsWith('config-')) {
      const id = parseInt(selectedPreset.replace('config-', ''));
      const ec = enrichedConfigs.find(e => e.configuration.id === id);
      if (ec) return ec.configuration.configurationName || ec.configuration.dealName || `Config ${id}`;
    }
    return null;
  }, [selectedPreset, presets, enrichedConfigs]);

  // Delete handling
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
      const ec = enrichedConfigs.find(e => e.configuration.id === configId);
      if (ec) {
        const config = ec.configuration;
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
        const configs = await calculatorService.getAllConfigurationsWithOwners();
        setEnrichedConfigs(configs);
      }

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

  // Render a single config item
  const renderConfigItem = (ec: ConfigurationWithOwner, showAvatar: boolean) => {
    const config = ec.configuration;
    const value = `config-${config.id}`;
    const allItemTags = [
      ...(config.tags?.split(',').filter(Boolean) || []),
      ...autoDetectTags(config),
    ];
    const uniqueTags = [...new Set(allItemTags)];
    const isSelected = selectedPreset === value;
    // Per-config collaborators (people who edited this config but don't own it)
    const collabs = ec.collaborators || [];
    const dateLabel = formatShortDate(showAvatar ? (config.updatedAt || config.createdAt) : config.createdAt);
    // Badge logic: timestamp-based detection (survives reloads via localStorage)
    const isFromOtherUser = ec.ownerUserId !== currentUserId;
    const isDismissed = config.id != null && dismissedIds.has(config.id);
    const prevVisit = prevVisitTimestamp.current;
    const createdTime = config.createdAt ? new Date(config.createdAt).getTime() : 0;
    const updatedTime = config.updatedAt ? new Date(config.updatedAt).getTime() : 0;
    // "New" = created since last page load (by another user, or the user's own fresh save)
    const showNewBadge = !isDismissed && createdTime > prevVisit;
    // "Updated" = modified since last page load (by another user, or own config edited by collaborator)
    const showUpdatedBadge = !isDismissed && !showNewBadge && updatedTime > prevVisit && (isFromOtherUser || collabs.length > 0);
    const firstCollab = collabs[0] || null;
    const extraCount = collabs.length > 1 ? collabs.length - 1 : 0;
    const tooltipNames = [ec.ownerFullName, ...collabs.map(c => c.fullName)].filter(Boolean).join(', ');

    return (
      <CommandItem key={value} value={value} keywords={[config.configurationName || '', config.dealName || '']} onSelect={() => handleSelect(value)}>
        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="min-w-0 flex items-baseline gap-1.5" style={{ maxWidth: '75%' }}>
            <span className="truncate text-sm">
              {config.configurationName || config.dealName || `Config ${config.id}`}
            </span>
            {showNewBadge && (
              <Badge
                variant="default"
                className="text-[8px] leading-tight px-1 py-0 h-4 text-white flex-shrink-0"
                style={{ backgroundColor: '#43778a' }}
              >
                New
              </Badge>
            )}
            {showUpdatedBadge && (
              <Badge
                variant="default"
                className="text-[8px] leading-tight px-1 py-0 h-4 text-white flex-shrink-0"
                style={{ backgroundColor: '#734968' }}
              >
                Updated
              </Badge>
            )}
            {dateLabel && (
              <span className="text-[9px] text-muted-foreground italic whitespace-nowrap flex-shrink-0">
                {dateLabel}
              </span>
            )}
          </div>
          {!isMobile && (
            <div className="flex gap-0.5 flex-shrink-0 ml-auto">
              {uniqueTags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-[8px] leading-tight px-1 py-0 h-4">{tag}</Badge>
              ))}
            </div>
          )}
          {isMobile && <div className="ml-auto" />}
          {showAvatar && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AvatarGroup className="flex-shrink-0 !cursor-pointer">
                    {/* Owner avatar (always shown) */}
                    <Avatar style={{ height: '23px', width: '23px' }}>
                      {ec.ownerProfileImageUrl ? (
                        <AvatarImage src={ec.ownerProfileImageUrl} alt={ec.ownerFullName || ''} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {ec.ownerFullName?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {/* First collaborator avatar */}
                    {firstCollab && (
                      <Avatar style={{ height: '23px', width: '23px' }}>
                        {firstCollab.profileImageUrl ? (
                          <AvatarImage src={firstCollab.profileImageUrl} alt={firstCollab.fullName} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {firstCollab.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {/* +N count for additional collaborators */}
                    {extraCount > 0 && (
                      <AvatarGroupCount
                        style={{ height: '23px', width: '23px', fontSize: '9px' }}
                      >
                        +{extraCount}
                      </AvatarGroupCount>
                    )}
                  </AvatarGroup>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{tooltipNames || 'Unknown user'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CommandItem>
    );
  };

  // Computed filtered/grouped/sorted data
  const filteredSharedGroups = useMemo(
    () => groupByStatus(sortConfigs(filterByTags(sharedConfigs))),
    [groupByStatus, sortConfigs, filterByTags, sharedConfigs]
  );
  const filteredPersonalGroups = useMemo(
    () => groupByStatus(sortConfigs(filterByTags(personalConfigs))),
    [groupByStatus, sortConfigs, filterByTags, personalConfigs]
  );
  const hasShared = Object.keys(filteredSharedGroups).length > 0;
  const hasPersonal = Object.keys(filteredPersonalGroups).length > 0;
  const hasPresets = presets.length > 0;

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.type === 'preset' ? 'Preset' : 'Configuration'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
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

      <div>
        {!hideLabel && (
          <label className="block mb-1.5 text-sm font-semibold">
            Property Presets
          </label>
        )}
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between !border-border relative"
              >
                <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
                  {selectedLabel || "Select Configuration"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                {updatedConfigIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search configurations..." />

                {/* Tag filter bar + sort toggle */}
                <div className="flex items-center gap-1 px-3 py-2 border-b">
                  {(featureTags.length > 0 || availableStates.length > 0 || availableOwners.length > 1) && (
                    <div className="flex flex-wrap gap-1 flex-1">
                      {featureTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={activeTagFilters.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px] leading-tight px-1.5 py-0 h-5"
                          onClick={() => toggleTagFilter(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {availableStates.length > 0 && (
                        <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Badge
                              variant={activeStateFilters.length > 0 ? 'default' : 'outline'}
                              className="cursor-pointer text-[10px] leading-tight px-1.5 py-0 h-5 gap-0.5"
                            >
                              State{activeStateFilters.length > 0 && ` (${activeStateFilters.length})`}
                              <ChevronDown className="h-2.5 w-2.5" />
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {availableStates.map(st => (
                                <Badge
                                  key={st}
                                  variant={activeStateFilters.includes(st) ? 'default' : 'outline'}
                                  className="cursor-pointer text-[10px] leading-tight px-1.5 py-0 h-5"
                                  onClick={() => toggleStateFilter(st)}
                                >
                                  {st}
                                </Badge>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      {availableOwners.length > 1 && (
                        <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Badge
                              variant={activeOwnerFilters.length > 0 ? 'default' : 'outline'}
                              className="cursor-pointer text-[10px] leading-tight px-1.5 py-0 h-5 gap-0.5"
                            >
                              <Users className="h-2.5 w-2.5" />
                              {activeOwnerFilters.length > 0 ? ` (${activeOwnerFilters.length})` : ''}
                              <ChevronDown className="h-2.5 w-2.5" />
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="grid gap-1.5 max-w-[220px]">
                              {availableOwners.map(owner => (
                                <div
                                  key={owner.userId}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-sm hover:bg-accent",
                                    activeOwnerFilters.includes(owner.userId) && "bg-accent"
                                  )}
                                  onClick={() => toggleOwnerFilter(owner.userId)}
                                >
                                  <Avatar className="flex-shrink-0" style={{ height: '20px', width: '20px' }}>
                                    {owner.profileImageUrl ? (
                                      <AvatarImage src={owner.profileImageUrl} alt={owner.fullName} />
                                    ) : null}
                                    <AvatarFallback className="text-[9px]">
                                      {owner.fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate">{owner.fullName}</span>
                                  {activeOwnerFilters.includes(owner.userId) && (
                                    <Check className="h-3 w-3 ml-auto flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )}
                  {!featureTags.length && !availableStates.length && availableOwners.length <= 1 && <div className="flex-1" />}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={toggleDateSort}
                        >
                          {sortMode === 'date-asc'
                            ? <CalendarArrowUp className="h-3.5 w-3.5" />
                            : <CalendarArrowDown className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{sortMode === 'date-asc' ? 'Oldest first' : 'Newest first'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={toggleAlphaSort}
                        >
                          {sortMode === 'alpha-desc'
                            ? <ArrowUpZA className="h-3.5 w-3.5" />
                            : <ArrowDownAZ className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{sortMode === 'alpha-desc' ? 'Z → A' : 'A → Z'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <CommandList>
                  <CommandEmpty>No configurations found.</CommandEmpty>

                  {/* Section 1: Shared Configurations (first) */}
                  {hasShared && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground italic">Shared Configurations</div>
                      {Object.entries(filteredSharedGroups).map(([status, configs]) => (
                        <CommandGroup key={`shared-${status}`} heading={status}>
                          {configs.map(ec => renderConfigItem(ec, true))}
                        </CommandGroup>
                      ))}
                    </div>
                  )}

                  {hasShared && hasPersonal && <CommandSeparator />}

                  {/* Section 2: Personal Configurations */}
                  {hasPersonal && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground italic">Personal</div>
                      {Object.entries(filteredPersonalGroups).map(([status, configs]) => (
                        <CommandGroup key={`personal-${status}`} heading={status}>
                          {configs.map(ec => renderConfigItem(ec, false))}
                        </CommandGroup>
                      ))}
                    </div>
                  )}

                  {(hasShared || hasPersonal) && hasPresets && <CommandSeparator />}

                  {/* Section 3: Built-in Presets */}
                  {hasPresets && (
                    <CommandGroup heading="Built-in Presets">
                      {presets.map(preset => (
                        <CommandItem
                          key={`preset-${preset.id}`}
                          value={`preset-${preset.id}`}
                          keywords={[preset.dealName || '', preset.configurationName || '']}
                          onSelect={() => handleSelect(`preset-${preset.id}`)}
                        >
                          <Check className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            selectedPreset === `preset-${preset.id}` ? "opacity-100" : "opacity-0"
                          )} />
                          {preset.dealName || preset.configurationName || `Preset ${preset.id}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {!hideDelete && (
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
          )}
        </div>
      </div>
    </>
  );
};

export default PresetSelector;
