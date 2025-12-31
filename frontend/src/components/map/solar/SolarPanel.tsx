import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sun, X, BarChart3, Map } from 'lucide-react';
import type { SolarAnalysis } from '../../../types/map/solar';

interface SolarPanelProps {
  visible: boolean;
  isLoading: boolean;
  solarData: SolarAnalysis | null;
  activeTab: 'analysis' | 'layers';
  onTabChange: (tab: 'analysis' | 'layers') => void;
  onClose: () => void;
  onClearAll: () => void;

  // Data layers props
  loadingOverlay: boolean;
  showFluxOverlay: boolean;
  showMapWideHeatmap: boolean;
  overlayOpacity: number;
  onToggleFluxOverlay: () => void;
  onToggleMapWideHeatmap: () => void;
  onUpdateOverlayOpacity: (value: number) => void;
  onClearAllOverlays: () => void;
}

const SolarPanel: React.FC<SolarPanelProps> = ({
  visible,
  isLoading,
  solarData,
  activeTab,
  onTabChange,
  onClose,
  onClearAll,
  loadingOverlay,
  showFluxOverlay,
  showMapWideHeatmap,
  overlayOpacity,
  onToggleFluxOverlay,
  onToggleMapWideHeatmap,
  onUpdateOverlayOpacity,
  onClearAllOverlays,
}) => {
  console.log('[SolarPanel] Rendered with:', { visible, isLoading, hasSolarData: !!solarData, activeTab });

  if (!visible) return null;

  return (
    <div className="@container flex flex-col h-full overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate">Solar Analysis</h2>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:block">Powered by Google Solar API</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
              title="Close"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'analysis' | 'layers')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full rounded-none border-b flex-shrink-0">
              <TabsTrigger
                value="analysis"
                disabled={!solarData}
                className="flex-1 text-[10px] sm:text-xs md:text-sm gap-1 sm:gap-1.5 md:gap-2 [@media(max-width:640px)]:data-[state=active]:!bg-transparent [@media(max-width:640px)]:data-[state=active]:!shadow-none"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Analysis</span>
              </TabsTrigger>
              <TabsTrigger
                value="layers"
                disabled={!solarData}
                className="flex-1 text-[10px] sm:text-xs md:text-sm gap-1 sm:gap-1.5 md:gap-2 [@media(max-width:640px)]:data-[state=active]:!bg-transparent [@media(max-width:640px)]:data-[state=active]:!shadow-none"
              >
                <Map className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Data Layers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="flex-1 m-0 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing solar potential...</p>
                </div>
              ) : solarData ? (
                <ScrollArea className="h-full">
                  <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
                    {/* Data Quality Info */}
                    <Card>
                      <CardHeader className="p-2 sm:p-3 md:p-4">
                        <CardTitle className="text-xs sm:text-sm md:text-base">Data Quality</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm p-2 sm:p-3 md:p-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quality:</span>
                          <Badge variant={solarData.buildingInsights.imageryQuality === 'HIGH' ? 'default' : 'secondary'}>
                            {solarData.buildingInsights.imageryQuality}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Imagery Date:</span>
                          <span>{solarData.buildingInsights.imageryDate.month}/{solarData.buildingInsights.imageryDate.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{solarData.buildingInsights.postalCode || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-1.5 @xs:gap-2 @md:gap-3">
                      <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                        <CardContent className="p-1.5 @xs:p-2 @md:p-3 @lg:p-4 text-center">
                          <div className="text-sm @md:text-xl @lg:text-2xl @xl:text-3xl font-bold text-orange-600 dark:text-orange-400">{solarData.summary.maxPanels}</div>
                          <div className="text-[8px] @md:text-xs @lg:text-sm text-muted-foreground mt-0.5 @xs:mt-1">Max Panels</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                        <CardContent className="p-1.5 @xs:p-2 @md:p-3 @lg:p-4 text-center">
                          <div className="text-sm @md:text-xl @lg:text-2xl @xl:text-3xl font-bold text-orange-600 dark:text-orange-400">{solarData.summary.maxArrayAreaM2.toFixed(0)}</div>
                          <div className="text-[8px] @md:text-xs @lg:text-sm text-muted-foreground mt-0.5 @xs:mt-1">Roof (m²)</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-1.5 @xs:p-2 @md:p-3 @lg:p-4 text-center">
                          <div className="text-sm @md:text-xl @lg:text-2xl @xl:text-3xl font-bold text-green-600 dark:text-green-400">{solarData.summary.yearlyEnergyKwh.toLocaleString()}</div>
                          <div className="text-[8px] @md:text-xs @lg:text-sm text-muted-foreground mt-0.5 @xs:mt-1">Energy (kWh/yr)</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <CardContent className="p-1.5 @xs:p-2 @md:p-3 @lg:p-4 text-center">
                          <div className="text-sm @md:text-xl @lg:text-2xl @xl:text-3xl font-bold text-blue-600 dark:text-blue-400">{solarData.summary.carbonOffsetKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="text-[8px] @md:text-xs @lg:text-sm text-muted-foreground mt-0.5 @xs:mt-1">Carbon (kg/yr)</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Additional Details */}
                    <Card>
                      <CardContent className="p-2 sm:p-3 md:p-4 space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Roof Segments:</span>
                          <span className="font-medium">{solarData.summary.roofSegments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Sunshine Hours:</span>
                          <span className="font-medium">{solarData.buildingInsights.solarPotential.maxSunshineHoursPerYear.toLocaleString()}/year</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              ) : null}
            </TabsContent>

            <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
              {loadingOverlay ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Loading overlay data...</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      Visualize solar data as heatmap overlays
                    </p>

                    {/* Overlay Options */}
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                      <Card
                        className={`cursor-pointer transition-colors ${showFluxOverlay ? 'border-primary bg-primary/5' : ''} ${loadingOverlay ? 'opacity-60' : ''}`}
                        onClick={() => {
                          if (!loadingOverlay) {
                            console.log('[SolarPanel] Flux overlay card clicked');
                            onToggleFluxOverlay();
                          }
                        }}
                      >
                        <CardContent className="p-2 sm:p-3 md:p-4">
                          <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            {loadingOverlay ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                            ) : (
                              <Checkbox
                                id="flux"
                                checked={showFluxOverlay}
                                disabled={loadingOverlay}
                                onCheckedChange={() => {
                                  console.log('[SolarPanel] Flux overlay checkbox changed');
                                  onToggleFluxOverlay();
                                }}
                                className="mt-0.5"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <label htmlFor="flux" className="font-medium text-[10px] sm:text-xs md:text-sm cursor-pointer block">
                                Solar Flux Heatmap
                              </label>
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                {loadingOverlay ? 'Loading heatmap data...' : 'Building solar potential'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-colors ${showMapWideHeatmap ? 'border-primary bg-primary/5' : ''} ${loadingOverlay ? 'opacity-60' : ''}`}
                        onClick={() => {
                          if (!loadingOverlay) {
                            onToggleMapWideHeatmap();
                          }
                        }}
                      >
                        <CardContent className="p-2 sm:p-3 md:p-4">
                          <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            {loadingOverlay ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                            ) : (
                              <Checkbox
                                id="mapwide"
                                checked={showMapWideHeatmap}
                                disabled={loadingOverlay}
                                onCheckedChange={onToggleMapWideHeatmap}
                                className="mt-0.5"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <label htmlFor="mapwide" className="font-medium text-[10px] sm:text-xs md:text-sm cursor-pointer block">
                                Map-Wide Heatmap
                              </label>
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                {loadingOverlay ? 'Loading heatmap data...' : 'Large area coverage'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Opacity Slider */}
                    <Card>
                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        <label className="text-xs sm:text-sm font-medium block">
                          Opacity: {Math.round(overlayOpacity * 100)}%
                        </label>
                        <Slider
                          value={[overlayOpacity]}
                          onValueChange={(value) => onUpdateOverlayOpacity(value[0])}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </CardContent>
                    </Card>

                    {/* Clear Button */}
                    <Button
                      onClick={onClearAllOverlays}
                      variant="secondary"
                      className="w-full text-xs sm:text-sm"
                      size="sm"
                    >
                      Clear Overlays
                    </Button>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
    </div>
  );
};

export default SolarPanel;
