import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TreeSelect, TreeSelectChangeEvent } from 'primereact/treeselect';
import { Marker } from '../types/marker';

interface ExtendedMarker extends Marker {
    isTemplate?: boolean;
}

interface PropertiesListProps {
    onMarkerSelect: (markers: ExtendedMarker[]) => void;
    onMarkerDeselect: (markers: ExtendedMarker[]) => void;
    onClearAllMarkers: () => void;
    initialSelectedMarkerId?: number;
}

const PropertiesList: React.FC<PropertiesListProps> = ({ onMarkerSelect, onMarkerDeselect, onClearAllMarkers, initialSelectedMarkerId }) => {
    const [markers, setMarkers] = useState<ExtendedMarker[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<Record<string, { checked: boolean; partialChecked: boolean }> | Record<string, boolean>>({});
    const [previousSelection, setPreviousSelection] = useState<Record<string, { checked: boolean; partialChecked: boolean }> | Record<string, boolean>>({});

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
                const markerKey = `marker-${initialSelectedMarkerId}`;

                // Build selection hierarchy: parent type, category, and marker
                const newSelection: Record<string, any> = {
                    [marker.propertyType]: {
                        checked: false,
                        partialChecked: true
                    },
                    [marker.propertyCategory]: {
                        checked: false,
                        partialChecked: true
                    },
                    [markerKey]: {
                        checked: true,
                        partialChecked: false
                    }
                };

                setSelectedNodes(newSelection);
                setPreviousSelection(newSelection);

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

    const getChildCategories = (parentKey: string): string[] => {
        const parentType = propertyTypes.find(type => type.key === parentKey);
        return parentType ? parentType.children.map(child => child.key) : [];
    }

    const getMarkersForCategory = (categoryKey: string): Marker[] => {
        // Check if this is a specific marker selection (e.g., "marker-32")
        if (categoryKey.startsWith('marker-')) {
            const markerId = parseInt(categoryKey.replace('marker-', ''));
            const marker = markers.find(m => m.id === markerId);
            return marker ? [marker] : [];
        }

        const isParentCategory = propertyTypes.some(type => type.key === categoryKey);

        if (isParentCategory) {
            // For parent categories, only show markers that have this as their propertyType
            // AND have any of the child categories as propertyCategory
            const childCategories = getChildCategories(categoryKey);
            return markers.filter(marker =>
                marker.propertyType === categoryKey &&
                childCategories.includes(marker.propertyCategory)
            );
        } else {
            // For child categories, only show markers that specifically match this category
            return markers.filter(marker => marker.propertyCategory === categoryKey);
        }
    }

    const clearAllMarkers = () => {
        onClearAllMarkers();
    }

    const getSelectedChildCategories = (selection: Record<string, { checked: boolean; partialChecked: boolean } | boolean>) => {
        const selected = Object.keys(selection).filter(key => {
            const item = selection[key];
            if (typeof item === 'boolean') {
                return item;
            }
            return item?.checked === true;
        });

        // Only return child categories (not parents)
        return selected.filter(key => !propertyTypes.some(type => type.key === key));
    };

    const getPlaceholderText = () => {
        const selectedChildren = getSelectedChildCategories(selectedNodes);
        if (selectedChildren.length === 0) {
            return "Select Property Types";
        }

        // Get the display names for selected categories and individual markers
        const selectedNames = selectedChildren.map(key => {
            // Check if this is an individual marker selection
            if (key.startsWith('marker-')) {
                const markerId = parseInt(key.replace('marker-', ''));
                const marker = markers.find(m => m.id === markerId);
                return marker ? marker.name : key;
            }

            // Otherwise it's a category - find its label
            for (const parentType of propertyTypes) {
                const child = parentType.children.find(child => child.key === key);
                if (child) {
                    return child.label;
                }
            }
            return key; // fallback to key if label not found
        });

        if (selectedNames.length === 1) {
            return selectedNames[0];
        } else if (selectedNames.length <= 3) {
            return selectedNames.join(", ");
        } else {
            return `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2} more`;
        }
    };

    const handleSelectionChange = (e: TreeSelectChangeEvent) => {
        const newSelection = (e.value as Record<string, boolean>) || {};
        const prevSelection = previousSelection;

        // Get the actually selected categories (avoid parent/child cascade issues)
        const getEffectiveSelection = (selection: Record<string, { checked: boolean; partialChecked: boolean } | boolean>) => {
            // Extract only fully checked items (not partial)
            const selected = Object.keys(selection).filter(key => {
                const item = selection[key];
                // Handle both boolean values and TreeSelect's {checked, partialChecked} format
                if (typeof item === 'boolean') {
                    return item;
                }
                return item?.checked === true;
            });
            
            // If a parent is selected along with its children, only consider the parent
            const effectiveSelection: string[] = [];
            selected.forEach(key => {
                const isParent = propertyTypes.some(type => type.key === key);
                if (isParent) {
                    // If parent is selected, ignore any selected children of this parent
                    effectiveSelection.push(key);
                } else {
                    // Only add child if its parent is not already selected
                    const parentKey = propertyTypes.find(type => 
                        type.children.some(child => child.key === key)
                    )?.key;
                    if (!parentKey || !selected.includes(parentKey)) {
                        effectiveSelection.push(key);
                    }
                }
            });
            return effectiveSelection;
        };

        const prevEffective = getEffectiveSelection(prevSelection);
        const newEffective = getEffectiveSelection(newSelection);

        // Get all currently visible markers based on effective selection
        const currentlyVisibleMarkers: Marker[] = [];
        prevEffective.forEach(key => {
            const categoryMarkers = getMarkersForCategory(key);
            categoryMarkers.forEach(marker => {
                // Avoid duplicates by checking if marker already exists
                if (!currentlyVisibleMarkers.some(existing => existing.id === marker.id)) {
                    currentlyVisibleMarkers.push(marker);
                }
            });
        });

        // Get all markers that should be visible with new effective selection
        const newlyVisibleMarkers: Marker[] = [];
        newEffective.forEach(key => {
            const categoryMarkers = getMarkersForCategory(key);
            categoryMarkers.forEach(marker => {
                // Avoid duplicates by checking if marker already exists
                if (!newlyVisibleMarkers.some(existing => existing.id === marker.id)) {
                    newlyVisibleMarkers.push(marker);
                }
            });
        });

        // Find markers to add (in new selection but not in previous)
        const markersToAdd = newlyVisibleMarkers.filter(newMarker => 
            !currentlyVisibleMarkers.some(current => current.id === newMarker.id)
        );

        // Find markers to remove (in previous selection but not in new)
        const markersToRemove = currentlyVisibleMarkers.filter(currentMarker => 
            !newlyVisibleMarkers.some(newMarker => newMarker.id === currentMarker.id)
        );

        // Add new markers
        if (markersToAdd.length > 0) {
            onMarkerSelect(markersToAdd);
        }

        // Remove deselected markers
        if (markersToRemove.length > 0) {
            onMarkerDeselect(markersToRemove);
        }

        // If nothing is selected, clear all markers
        if (Object.keys(newSelection).length === 0 || !Object.values(newSelection).some(val => val)) {
            clearAllMarkers();
        }

        setSelectedNodes(newSelection);
        setPreviousSelection(newSelection);
    }

    return (
        <div>
            <TreeSelect 
                value={selectedNodes} 
                options={propertyTypes} 
                onChange={handleSelectionChange}
                selectionMode="checkbox" 
                placeholder={getPlaceholderText()}
                style={{width: '100%'}}
            />
        </div>
    );
};

export default PropertiesList;
