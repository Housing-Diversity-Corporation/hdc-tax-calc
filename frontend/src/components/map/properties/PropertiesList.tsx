import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Marker } from '../../../types/map/marker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';

export interface ExtendedMarker extends Marker {
    isTemplate?: boolean;
}

interface PropertiesListProps {
    onMarkerSelect: (markers: ExtendedMarker[]) => void;
    onMarkerDeselect: (markers: ExtendedMarker[]) => void;
    onClearAllMarkers: () => void;
    initialSelectedMarkerId?: number;
    alwaysOpen?: boolean; // When true, renders content without popover wrapper
    onNeighborhoodExplorer?: (keyword: string, radius: number, lat: number, lng: number) => void;
}

const PropertiesList: React.FC<PropertiesListProps> = ({ onMarkerSelect, onMarkerDeselect, onClearAllMarkers, initialSelectedMarkerId, alwaysOpen = false, onNeighborhoodExplorer }) => {
    const [markers, setMarkers] = useState<ExtendedMarker[]>([]);
    const [selectedMarkers, setSelectedMarkers] = useState<Set<number>>(new Set());
    const [isOpen, setIsOpen] = useState(false);
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleTypeExpanded = (typeKey: string) => {
        setExpandedTypes(prev => {
            const next = new Set(prev);
            if (next.has(typeKey)) {
                next.delete(typeKey);
            } else {
                next.add(typeKey);
            }
            return next;
        });
    };

    const toggleCategoryExpanded = (categoryKey: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryKey)) {
                next.delete(categoryKey);
            } else {
                next.add(categoryKey);
            }
            return next;
        });
    };

    const fetchMarkers = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token found, skipping marker fetch');
            return;
        }

        try {
            // Fetch current user's markers
            const userMarkersResponse = await api.get<Marker[]>('/markers');
            const userMarkers = userMarkersResponse.data.map(m => ({ ...m, isTemplate: false }));

            // Fetch template markers from super user
            let templateMarkers: ExtendedMarker[] = [];
            try {
                // Use the new templates endpoint instead of user/8
                const templateMarkersResponse = await api.get<Marker[]>('/markers/templates', {
                    validateStatus: (status) => status < 500 // Don't throw on 4xx errors
                });

                if (templateMarkersResponse.status === 200) {
                    templateMarkers = templateMarkersResponse.data.map(m => ({ ...m, isTemplate: true }));
                } else {
                    console.warn('Could not fetch template markers, status:', templateMarkersResponse.status);
                }
            } catch (templateError) {
                console.warn('Could not fetch template markers:', templateError);
                // Continue without template markers if they fail to load
            }

            // Combine both user's markers and super user's markers
            setMarkers([...userMarkers, ...templateMarkers]);
        } catch (error) {
            console.error('Error fetching markers:', error);
            setMarkers([]); // Set empty array on error
        }
    };

    useEffect(() => {
        fetchMarkers();

        // Listen for marker deletion events
        const handleMarkerDeleted = () => {
            fetchMarkers();
        };

        window.addEventListener('marker-deleted', handleMarkerDeleted);

        return () => {
            window.removeEventListener('marker-deleted', handleMarkerDeleted);
        };
    }, []);

    // Auto-select marker from URL parameter
    useEffect(() => {
        if (initialSelectedMarkerId && markers.length > 0) {
            const marker = markers.find(m => m.id === initialSelectedMarkerId);
            if (marker) {
                setSelectedMarkers(new Set([initialSelectedMarkerId]));
                // Don't trigger onMarkerSelect here - the MapContainer already handles it
            }
        }
    }, [initialSelectedMarkerId, markers]);

    // Build property types with individual markers as third level
    const propertyTypes = [
        {
            key: 'development',
            label: 'Development',
            children: [
                {
                    key: 'acquisition',
                    label: 'Acquisition',
                    children: markers
                        .filter(m => m.propertyType === 'development' && m.propertyCategory === 'acquisition')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
                {
                    key: 'pre-development',
                    label: 'Pre-development',
                    children: markers
                        .filter(m => m.propertyType === 'development' && m.propertyCategory === 'pre-development')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
                {
                    key: 'construction',
                    label: 'Construction',
                    children: markers
                        .filter(m => m.propertyType === 'development' && m.propertyCategory === 'construction')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
                {
                    key: 'completed',
                    label: 'Completed',
                    children: markers
                        .filter(m => m.propertyType === 'development' && m.propertyCategory === 'completed')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
            ],
        },
        {
            key: 'gov-school',
            label: 'Government/School',
            children: [
                {
                    key: 'public',
                    label: 'Public',
                    children: markers
                        .filter(m => m.propertyType === 'gov-school' && m.propertyCategory === 'public')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
                {
                    key: 'private',
                    label: 'Private',
                    children: markers
                        .filter(m => m.propertyType === 'gov-school' && m.propertyCategory === 'private')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
                {
                    key: 'community',
                    label: 'Community',
                    children: markers
                        .filter(m => m.propertyType === 'gov-school' && m.propertyCategory === 'community')
                        .map(m => ({ key: `marker-${m.id}`, label: m.name }))
                },
            ],
        },
    ];

    // Toggle individual marker selection
    const toggleMarker = (markerId: number) => {
        const marker = markers.find(m => m.id === markerId);
        if (!marker) return;

        const newSelected = new Set(selectedMarkers);
        if (newSelected.has(markerId)) {
            newSelected.delete(markerId);
            onMarkerDeselect([marker]);
        } else {
            newSelected.add(markerId);
            onMarkerSelect([marker]);
        }
        setSelectedMarkers(newSelected);
    };

    // Toggle all markers in a category
    const toggleCategory = (propertyType: string, propertyCategory: string) => {
        const categoryMarkers = markers.filter(
            m => m.propertyType === propertyType && m.propertyCategory === propertyCategory
        );

        const categoryMarkerIds = categoryMarkers.map(m => m.id);
        const allSelected = categoryMarkerIds.every(id => selectedMarkers.has(id));

        const newSelected = new Set(selectedMarkers);
        if (allSelected) {
            categoryMarkerIds.forEach(id => newSelected.delete(id));
            onMarkerDeselect(categoryMarkers);
        } else {
            const markersToAdd = categoryMarkers.filter(m => !selectedMarkers.has(m.id));
            categoryMarkerIds.forEach(id => newSelected.add(id));
            if (markersToAdd.length > 0) {
                onMarkerSelect(markersToAdd);
            }
        }
        setSelectedMarkers(newSelected);
    };

    // Toggle all markers in a property type
    const togglePropertyType = (propertyType: string) => {
        const typeMarkers = markers.filter(m => m.propertyType === propertyType);
        const typeMarkerIds = typeMarkers.map(m => m.id);
        const allSelected = typeMarkerIds.every(id => selectedMarkers.has(id));

        const newSelected = new Set(selectedMarkers);
        if (allSelected) {
            typeMarkerIds.forEach(id => newSelected.delete(id));
            onMarkerDeselect(typeMarkers);
        } else {
            const markersToAdd = typeMarkers.filter(m => !selectedMarkers.has(m.id));
            typeMarkerIds.forEach(id => newSelected.add(id));
            if (markersToAdd.length > 0) {
                onMarkerSelect(markersToAdd);
            }
        }
        setSelectedMarkers(newSelected);
    };

    // Check if category is fully/partially selected
    const getCategoryState = (propertyType: string, propertyCategory: string) => {
        const categoryMarkers = markers.filter(
            m => m.propertyType === propertyType && m.propertyCategory === propertyCategory
        );
        if (categoryMarkers.length === 0) return { checked: false, indeterminate: false };

        const selectedCount = categoryMarkers.filter(m => selectedMarkers.has(m.id)).length;
        return {
            checked: selectedCount === categoryMarkers.length,
            indeterminate: selectedCount > 0 && selectedCount < categoryMarkers.length
        };
    };

    // Check if property type is fully/partially selected
    const getPropertyTypeState = (propertyType: string) => {
        const typeMarkers = markers.filter(m => m.propertyType === propertyType);
        if (typeMarkers.length === 0) return { checked: false, indeterminate: false };

        const selectedCount = typeMarkers.filter(m => selectedMarkers.has(m.id)).length;
        return {
            checked: selectedCount === typeMarkers.length,
            indeterminate: selectedCount > 0 && selectedCount < typeMarkers.length
        };
    };

    const clearAllMarkers = () => {
        setSelectedMarkers(new Set());
        onClearAllMarkers();
    };

    const getPlaceholderText = () => {
        if (selectedMarkers.size === 0) {
            return "Select Property Types";
        }

        const selectedMarkerObjs = markers.filter(m => selectedMarkers.has(m.id));
        if (selectedMarkerObjs.length === 1) {
            return selectedMarkerObjs[0].name;
        } else if (selectedMarkerObjs.length <= 3) {
            return selectedMarkerObjs.map(m => m.name).join(", ");
        } else {
            return `${selectedMarkerObjs.slice(0, 2).map(m => m.name).join(", ")} +${selectedMarkerObjs.length - 2} more`;
        }
    };

    // Render just the content when alwaysOpen is true
    if (alwaysOpen) {
        return (
            <TooltipProvider>
                <div className="overflow-y-auto p-2 space-y-1 h-full">
                <div className="space-y-1">
                    {propertyTypes.map((propertyType) => {
                        const typeState = getPropertyTypeState(propertyType.key);
                        const isTypeExpanded = expandedTypes.has(propertyType.key);
                        return (
                            <div key={propertyType.key} className="space-y-1">
                                <div className="flex items-center justify-between gap-3 py-1.5 border-b">
                                    <Button
                                        variant="ghost"
                                        onClick={() => toggleTypeExpanded(propertyType.key)}
                                        className="flex items-center gap-1 flex-1 text-left pl-2 h-auto p-0 hover:bg-transparent justify-start"
                                    >
                                        <span className="font-medium text-sm italic">{propertyType.label}</span>
                                        {isTypeExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Checkbox
                                        checked={typeState.checked}
                                        onCheckedChange={() => togglePropertyType(propertyType.key)}
                                        className={`${typeState.indeterminate ? "data-[state=checked]:bg-primary/50" : ""} mr-2`}
                                    />
                                </div>
                                {isTypeExpanded && (
                                    <div className="pl-6 space-y-0.5">
                                        {propertyType.children.map((category) => {
                                            const categoryMarkers = markers.filter(
                                                m => m.propertyType === propertyType.key && m.propertyCategory === category.key
                                            );

                                            if (categoryMarkers.length === 0) return null;

                                            const categoryState = getCategoryState(propertyType.key, category.key);
                                            const categoryKey = `${propertyType.key}-${category.key}`;
                                            const isCategoryExpanded = expandedCategories.has(categoryKey);

                                            return (
                                                <div key={category.key} className="space-y-0.5">
                                                    <div className="flex items-center justify-between gap-3 py-1">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => toggleCategoryExpanded(categoryKey)}
                                                            className="flex items-center gap-1 flex-1 text-left pl-2 h-auto p-0 hover:bg-transparent justify-start"
                                                        >
                                                            <span className="text-sm italic">{category.label}</span>
                                                            {isCategoryExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                        </Button>
                                                        <Checkbox
                                                            checked={categoryState.checked}
                                                            onCheckedChange={() => toggleCategory(propertyType.key, category.key)}
                                                            className={`${categoryState.indeterminate ? "data-[state=checked]:bg-primary/50" : ""} mr-2`}
                                                        />
                                                    </div>
                                                    {isCategoryExpanded && (
                                                        <div className="pl-6 space-y-0.5">
                                                            {categoryMarkers.map((marker) => (
                                                                <div key={marker.id} className="flex items-center justify-between gap-3 py-0.5">
                                                                    <span className="text-xs italic flex-1 pl-2">{marker.name}</span>
                                                                    <Checkbox
                                                                        checked={selectedMarkers.has(marker.id)}
                                                                        onCheckedChange={() => toggleMarker(marker.id)}
                                                                        className="mr-2"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            </TooltipProvider>
        );
    }

    // Normal render with Popover wrapper
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="w-full h-[50px] relative">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full h-full font-normal bg-background hover:bg-accent hover:text-accent-foreground absolute inset-0 flex items-center justify-center !px-0 !gap-0"
                    >
                        <span className={`truncate ${selectedMarkers.size === 0 ? 'text-muted-foreground' : ''}`} style={{ marginRight: '30px' }}>
                            {getPlaceholderText()}
                        </span>
                        <ChevronDown className="absolute right-4 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[calc(100vw-2rem)] p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto p-2 space-y-1">
                    {selectedMarkers.size > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllMarkers}
                            className="w-full"
                        >
                            Clear all
                        </Button>
                    )}

                    <div className="space-y-1">
                        {propertyTypes.map((propertyType) => {
                            const typeState = getPropertyTypeState(propertyType.key);
                            const isTypeExpanded = expandedTypes.has(propertyType.key);
                            return (
                                <div key={propertyType.key} className="space-y-1">
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-b">
                                        <Button
                                            variant="ghost"
                                            onClick={() => toggleTypeExpanded(propertyType.key)}
                                            className="flex items-center gap-1 flex-1 text-left pl-2 h-auto p-0 hover:bg-transparent justify-start"
                                        >
                                            <span className="font-medium text-sm italic">{propertyType.label}</span>
                                            {isTypeExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Checkbox
                                            checked={typeState.checked}
                                            onCheckedChange={() => togglePropertyType(propertyType.key)}
                                            className={`${typeState.indeterminate ? "data-[state=checked]:bg-primary/50" : ""} mr-2`}
                                        />
                                    </div>
                                    {isTypeExpanded && (
                                        <div className="pl-6 space-y-0.5">
                                            {propertyType.children.map((category) => {
                                                const categoryMarkers = markers.filter(
                                                    m => m.propertyType === propertyType.key && m.propertyCategory === category.key
                                                );

                                                if (categoryMarkers.length === 0) return null;

                                                const categoryState = getCategoryState(propertyType.key, category.key);
                                                const categoryKey = `${propertyType.key}-${category.key}`;
                                                const isCategoryExpanded = expandedCategories.has(categoryKey);

                                                return (
                                                    <div key={category.key} className="space-y-0.5">
                                                        <div className="flex items-center justify-between gap-3 py-1">
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => toggleCategoryExpanded(categoryKey)}
                                                                className="flex items-center gap-1 flex-1 text-left pl-2 h-auto p-0 hover:bg-transparent justify-start"
                                                            >
                                                                <span className="text-sm italic">{category.label}</span>
                                                                {isCategoryExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                            </Button>
                                                            <Checkbox
                                                                checked={categoryState.checked}
                                                                onCheckedChange={() => toggleCategory(propertyType.key, category.key)}
                                                                className={`${categoryState.indeterminate ? "data-[state=checked]:bg-primary/50" : ""} mr-2`}
                                                            />
                                                        </div>
                                                        {isCategoryExpanded && (
                                                            <div className="pl-6 space-y-0.5">
                                                                {categoryMarkers.map((marker) => (
                                                                    <div key={marker.id} className="flex items-center justify-between gap-3 py-0.5">
                                                                        <span className="text-xs italic flex-1 pl-2">{marker.name}</span>
                                                                        <Checkbox
                                                                            checked={selectedMarkers.has(marker.id)}
                                                                            onCheckedChange={() => toggleMarker(marker.id)}
                                                                            className="mr-2"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PropertiesList;
