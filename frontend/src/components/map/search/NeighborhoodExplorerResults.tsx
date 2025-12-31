import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MultiSelect } from '@/components/ui/multi-select';
import { useContainerWidth, useResponsiveText } from '@/hooks/useResponsiveText';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  X,
  Save,
  Download,
  Star,
  Compass,
  MapPin,
  Phone,
  Globe,
  Clock,
  DollarSign,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Trees,
  Dog,
  Sparkles,
  MessageSquare,
  Navigation,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search
} from 'lucide-react';
import PhotoCarousel from './PhotoCarousel';
import MarkerTypeSelector from './MarkerTypeSelector';
import { SearchResult } from '@/types/map/map.types';
import { categoriesToOptions, NEIGHBORHOOD_CATEGORIES } from '@/utils/map/neighborhoodCategories';
import '../../../styles/map/neighborhoodExplorerResults.css';

interface NeighborhoodResultsProps {
  results: SearchResult[];
  visible: boolean;
  onResultClick?: (result: SearchResult) => void;
  onClearResults?: () => void;
  onExportCsv?: (filename: string) => void;
  onSaveSearch?: (searchName: string) => void;
  onSaveLocation?: (result: SearchResult, locationName: string) => void;
  onSaveDialogOpen?: (openFn: () => void) => void;
  onExportDialogOpen?: (openFn: () => void) => void;
  onDeleteResult?: (result: SearchResult) => void;
  onMarkerTypeChange?: (result: SearchResult, newType: string) => void;
  searchMetadata?: { textQuery: string; radius: number; centerLat: number; centerLng: number; selectedCategories?: string[] };
  onNewSearch?: (textQuery: string, categories?: string[]) => void;
}

const NeighborhoodExplorerResults: React.FC<NeighborhoodResultsProps> = ({
  results,
  visible,
  onResultClick,
  onClearResults,
  onExportCsv,
  onSaveSearch,
  onSaveLocation,
  onSaveDialogOpen,
  onExportDialogOpen,
  onDeleteResult,
  onMarkerTypeChange,
  searchMetadata,
  onNewSearch
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [exportFilename, setExportFilename] = useState('');
  const [favoritedPlaces, setFavoritedPlaces] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [newTextQuery, setNewTextQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pastSearches, setPastSearches] = useState<Array<{ query: string; categories: string[]; timestamp: number }>>([]);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);

  // Responsive placeholder for category MultiSelect
  const { ref: categoryMultiSelectRef, width: categoryMultiSelectWidth } = useContainerWidth<HTMLDivElement>();
  const availablePlaceholderWidth = Math.max(0, categoryMultiSelectWidth - 60);
  const fullPlaceholder = 'Select categories...';
  const { displayText: responsivePlaceholder } = useResponsiveText(
    fullPlaceholder,
    availablePlaceholderWidth,
    {
      minFontSize: 12,
      maxFontSize: 14,
      truncateThreshold: 0.9,
    }
  );

  // Sync selected categories from search metadata
  React.useEffect(() => {
    if (searchMetadata?.selectedCategories) {
      setSelectedCategories(searchMetadata.selectedCategories);
    }
  }, [searchMetadata?.selectedCategories]);

  // Add initial search to past searches when metadata changes
  React.useEffect(() => {
    if (searchMetadata && (searchMetadata.textQuery || searchMetadata.selectedCategories?.length)) {
      const searchEntry = {
        query: searchMetadata.textQuery,
        categories: searchMetadata.selectedCategories || [],
        timestamp: Date.now()
      };

      // Only add if it's not a duplicate of the most recent search
      setPastSearches(prev => {
        if (prev.length === 0 ||
            prev[0].query !== searchEntry.query ||
            JSON.stringify(prev[0].categories) !== JSON.stringify(searchEntry.categories)) {
          return [searchEntry, ...prev.slice(0, 4)]; // Keep only last 5
        }
        return prev;
      });
    }
  }, [searchMetadata?.textQuery, searchMetadata?.selectedCategories]);

  const handleSaveClick = React.useCallback(() => {
    setSearchName('');
    setShowSaveDialog(true);
  }, []);

  const handleExportClick = React.useCallback(() => {
    const defaultFilename = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
    setExportFilename(defaultFilename);
    setShowExportDialog(true);
  }, []);

  // Expose dialog opening functions to parent
  React.useEffect(() => {
    if (onSaveDialogOpen) {
      onSaveDialogOpen(handleSaveClick);
    }
  }, [onSaveDialogOpen, handleSaveClick]);

  React.useEffect(() => {
    if (onExportDialogOpen) {
      onExportDialogOpen(handleExportClick);
    }
  }, [onExportDialogOpen, handleExportClick]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    } else {
      return (meters / 1000).toFixed(1) + ' km';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Result clicked - Full JSON response:', JSON.stringify(result, null, 2));
    onResultClick?.(result);
  };

  const handleSaveConfirm = () => {
    if (searchName.trim()) {
      onSaveSearch?.(searchName);
      setShowSaveDialog(false);
      setSearchName('');
    }
  };

  const handleExportConfirm = () => {
    if (exportFilename.trim()) {
      onExportCsv?.(exportFilename);
      setShowExportDialog(false);
      setExportFilename('');
    }
  };

  const handleSaveLocationClick = (result: SearchResult) => {
    const defaultName = result.name || 'Saved Location';
    onSaveLocation?.(result, defaultName);

    // Mark this place as favorited
    if (result.place_id) {
      setFavoritedPlaces(prev => new Set(prev).add(result.place_id!));
    }
  };

  const toggleCardExpansion = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const isCardExpanded = (placeId: string) => expandedCards.has(placeId);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if ((newTextQuery.trim() || selectedCategories.length > 0) && searchMetadata && onNewSearch) {
      // Record this search in past searches
      const searchEntry = {
        query: newTextQuery.trim(),
        categories: [...selectedCategories],
        timestamp: Date.now()
      };
      setPastSearches(prev => [searchEntry, ...prev.slice(0, 4)]); // Keep only last 5

      onNewSearch(newTextQuery.trim(), selectedCategories);
      setNewTextQuery('');
    }
  };

  const handlePastSearchClick = (search: { query: string; categories: string[] }) => {
    if (onNewSearch) {
      setNewTextQuery(search.query);
      setSelectedCategories(search.categories);
      onNewSearch(search.query, search.categories);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="h-full bg-background border-l shadow-lg flex flex-col w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50 flex-shrink-0">
        <h3 className="text-lg font-semibold truncate">
          Search Results ({results.length})
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearResults}
          title="Close"
          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Combined scrollable area for search controls and results */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        {/* New Search Input - Collapsible */}
        {searchMetadata && (
          <Collapsible open={isSearchPanelOpen} onOpenChange={setIsSearchPanelOpen}>
            <div className="p-3 border-b bg-background">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto"
                >
                  <span className="text-sm font-medium">Search Controls</span>
                  {isSearchPanelOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="p-3 border-b bg-background space-y-3">
                {/* Text Query Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Text Search (optional)
                  </Label>
                  <Input
                    value={newTextQuery}
                    onChange={(e) => setNewTextQuery(e.target.value)}
                    placeholder={`e.g., "Best coffee shops"`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNewSearch(e as any);
                      }
                    }}
                  />
                </div>

                {/* Category MultiSelect */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Browse by Category (optional)
                  </Label>
                  <div ref={categoryMultiSelectRef} className="neighborhood-explorer-multiselect">
                    <MultiSelect
                      options={categoriesToOptions()}
                      value={selectedCategories}
                      onValueChange={setSelectedCategories}
                      placeholder={responsivePlaceholder}
                      maxCount={3}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleNewSearch}
                  disabled={!newTextQuery.trim() && selectedCategories.length === 0}
                  className="w-full bg-map-green hover:bg-[#1a4a17] text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>

                {/* Past Searches */}
                {pastSearches.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Recent Searches
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {pastSearches.map((search, idx) => (
                        search.query && (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80 text-xs truncate max-w-[200px]"
                            onClick={() => handlePastSearchClick(search)}
                          >
                            {search.query}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Using same location: {searchMetadata.centerLat.toFixed(4)}, {searchMetadata.centerLng.toFixed(4)}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Results List */}
        <div className="p-3 space-y-3 pb-6 max-w-full">
          {results.map((result, index) => {
                const expanded = isCardExpanded(result.place_id || `${index}`);

                return (
                <Card
                  key={result.place_id || index}
                  className="overflow-hidden hover:shadow-md transition-shadow max-w-full"
                >
                  {/* Photo Carousel */}
                  {result.photos && result.photos.length > 0 && (
                    <div onClick={() => handleResultClick(result)} className="cursor-pointer overflow-hidden">
                      <PhotoCarousel
                        photos={result.photos.slice(0, 3)}
                        placeName={result.name || 'Unknown'}
                        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                        googlePlacePhotoUrl={
                          result.photos[0]?.name
                            ? `https://places.googleapis.com/v1/${result.photos[0].name}/media?maxHeightPx=400&maxWidthPx=600&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
                            : undefined
                        }
                      />
                    </div>
                  )}

                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {result.name || 'Unknown'}
                      </CardTitle>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Marker Type Selector */}
                        <MarkerTypeSelector
                          currentType={result.types || ['default']}
                          customType={result.customMarkerType}
                          onTypeChange={(newType) => {
                            console.log('🎨 [NeighborhoodExplorerResults] onTypeChange called:', {
                              resultName: result.name,
                              place_id: result.place_id,
                              newType,
                              currentCustomType: result.customMarkerType,
                              hasCallback: !!onMarkerTypeChange
                            });
                            if (onMarkerTypeChange) {
                              onMarkerTypeChange(result, newType);
                            } else {
                              console.error('🎨 [NeighborhoodExplorerResults] onMarkerTypeChange is undefined!');
                            }
                          }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteResult?.(result);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove from results</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveLocationClick(result);
                              }}
                              className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                            >
                              <Star className={`h-4 w-4 ${favoritedPlaces.has(result.place_id || '') ? 'fill-yellow-500' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{favoritedPlaces.has(result.place_id || '') ? "Already favorited" : "Save to favorites"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {result.distance && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Compass className="h-3.5 w-3.5" />
                        <span>{formatDistance(result.distance)}</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-3 pt-0 space-y-2 max-w-full" onClick={() => handleResultClick(result)}>
                    {/* Rating & Price Level Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {result.rating && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{result.rating}/5</span>
                          </Badge>
                          {result.user_ratings_total && (
                            <span className="text-xs text-muted-foreground">
                              ({result.user_ratings_total})
                            </span>
                          )}
                        </div>
                      )}
                      {result.price_level !== undefined && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                          {(() => {
                            const priceMap: Record<string, string> = {
                              'FREE': 'Free',
                              'INEXPENSIVE': '$',
                              'MODERATE': '$$',
                              'EXPENSIVE': '$$$',
                              'VERY_EXPENSIVE': '$$$$'
                            };
                            if (typeof result.price_level === 'string') {
                              return priceMap[result.price_level] || result.price_level;
                            } else {
                              return Array(result.price_level + 1).fill('$').join('');
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* AI Summaries & Editorial Summary */}
                    {(result.editorial_summary || result.generative_summary?.overview || result.review_summary) && (
                      <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                        {result.editorial_summary && (
                          <div className="flex gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {result.editorial_summary.text}
                            </p>
                          </div>
                        )}
                        {result.generative_summary?.overview && (
                          <div className="flex gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {result.generative_summary.overview.text}
                            </p>
                          </div>
                        )}
                        {result.review_summary && (
                          <div className="flex gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              {result.review_summary.text}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Opening Hours */}
                    {result.current_opening_hours?.openNow !== undefined && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className={result.current_opening_hours.openNow ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {result.current_opening_hours.openNow ? 'Open Now' : 'Closed'}
                        </span>
                        {result.current_opening_hours?.weekdayDescriptions && expanded && (
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {result.current_opening_hours.weekdayDescriptions.map((day: string, idx: number) => (
                              <div key={idx}>{day}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address with Descriptor */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {result.formatted_address || result.vicinity}
                        </span>
                      </div>
                      {result.address_descriptor?.landmarks && result.address_descriptor.landmarks.length > 0 && expanded && (
                        <div className="ml-5 text-xs text-blue-600 dark:text-blue-400">
                          <Navigation className="h-3 w-3 inline mr-1" />
                          {result.address_descriptor.landmarks[0].spatialRelationship}{' '}
                          {result.address_descriptor.landmarks[0].displayName?.text || result.address_descriptor.landmarks[0].name}
                          {result.address_descriptor.landmarks[0].straightLineDistanceMeters && (
                            <span className="text-muted-foreground ml-1">
                              ({Math.round(result.address_descriptor.landmarks[0].straightLineDistanceMeters)}m)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    {(result.takeout || result.delivery || result.dine_in || result.outdoor_seating || result.allows_dogs) && (
                      <div className="flex gap-2 flex-wrap">
                        {result.delivery && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Bike className="h-3 w-3" />
                            Delivery
                          </Badge>
                        )}
                        {result.takeout && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Takeout
                          </Badge>
                        )}
                        {result.dine_in && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <UtensilsCrossed className="h-3 w-3" />
                            Dine-in
                          </Badge>
                        )}
                        {result.outdoor_seating && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Trees className="h-3 w-3" />
                            Outdoor
                          </Badge>
                        )}
                        {result.allows_dogs && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Dog className="h-3 w-3" />
                            Dog-friendly
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1.5">
                      {result.formatted_phone_number && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <a
                            href={`tel:${result.formatted_phone_number}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {result.formatted_phone_number}
                          </a>
                        </div>
                      )}
                      {result.website && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Reviews Section (Collapsed by Default) */}
                    {result.reviews && result.reviews.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleCardExpansion(result.place_id || `${index}`, e)}
                          className="w-full justify-between h-8 px-2"
                        >
                          <span className="text-xs font-medium flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {result.reviews.length} Reviews
                          </span>
                          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>

                        {expanded && (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {result.reviews.slice(0, 3).map((review, reviewIdx) => (
                              <div key={reviewIdx} className="bg-muted/50 p-2 rounded text-xs space-y-1.5">
                                <div className="flex items-center gap-2">
                                  {review.profile_photo_url && (
                                    <img
                                      src={review.profile_photo_url}
                                      alt={review.author_name}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{review.author_name}</div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex">
                                        {Array(5).fill(0).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-2.5 w-2.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-muted-foreground text-xs">
                                        {review.relative_time_description}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {review.text && (
                                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                    {review.text}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Business Status */}
                    {result.business_status && result.business_status !== 'OPERATIONAL' && (
                      <Badge variant="destructive" className="text-xs">
                        {result.business_status}
                      </Badge>
                    )}

                    {/* Types */}
                    {result.types && result.types.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="text-xs text-muted-foreground italic">
                          {result.types.slice(0, 3).join(', ')}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save this text search for easy access later. You found {results.length} results.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., Coffee shops in downtown"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveConfirm();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfirm}
              disabled={!searchName.trim()}
              className="bg-green-700 hover:bg-green-800"
            >
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export CSV Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export to CSV</DialogTitle>
            <DialogDescription>
              Export {results.length} search results to a CSV file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder="search_results.csv"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExportConfirm();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExportConfirm}
              disabled={!exportFilename.trim()}
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default NeighborhoodExplorerResults;
