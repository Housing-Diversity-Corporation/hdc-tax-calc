import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitMerge, Save, Download } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  apiTableId?: string;
  data?: unknown[];
  intersectionData?: unknown;
}

interface IntersectionControlsProps {
  layers: LayerConfig[];
  onIntersection: () => void;
  onSaveIntersection: () => void;
  onExportCsv: () => void;
  isIntersecting?: boolean;
}

const IntersectionControls: React.FC<IntersectionControlsProps> = ({
  layers,
  onIntersection,
  onSaveIntersection,
  onExportCsv,
  isIntersecting
}) => {
  const { isMobile } = useResponsive();
  const enabledLayers = layers.filter(layer => layer.enabled);
  const showIntersectionButton = enabledLayers.length > 1;
  const hasIntersectionResults = layers.some(layer => layer.id === 'intersection' && layer.enabled);

  if (!showIntersectionButton && !hasIntersectionResults) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '10px' : '50px',
      left: isMobile ? '10px' : '20px',
      right: isMobile ? '10px' : 'auto',
      zIndex: 1000,
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: isMobile ? '4px' : '8px'
    }}>
      {showIntersectionButton && (
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-1' : ''}`}>
          <Button
            onClick={onIntersection}
            disabled={isIntersecting}
            className={`${isMobile ? 'text-[9px] h-7 px-2 min-w-[70px]' : 'min-w-[120px] text-xs h-10'} font-semibold shadow-lg`}
            size={isMobile ? "sm" : "default"}
            style={{
              backgroundColor: isIntersecting ? '#cccccc' : '#bfb05e',
              color: 'white'
            }}
          >
            <GitMerge className={`${isMobile ? 'h-2.5 w-2.5 mr-0.5' : 'h-4 w-4 mr-2'}`} />
            {isIntersecting ? '...' : 'Intersect'}
          </Button>
          {!isMobile && (
            <Badge className="text-xs bg-white text-gray-900 border border-gray-300 shadow-md">
              {enabledLayers.length} layers
            </Badge>
          )}
        </div>
      )}

      {hasIntersectionResults && (
        <>
          <Button
            onClick={onSaveIntersection}
            className={`${isMobile ? 'text-[9px] h-7 px-2 min-w-[50px]' : 'min-w-[120px] text-xs h-10'} font-semibold shadow-lg`}
            size={isMobile ? "sm" : "default"}
            style={{
              backgroundColor: '#734968',
              color: 'white'
            }}
          >
            <Save className={`${isMobile ? 'h-2.5 w-2.5' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? '' : 'Save'}
          </Button>
          <Button
            onClick={onExportCsv}
            className={`${isMobile ? 'text-[9px] h-7 px-2 min-w-[60px]' : 'min-w-[120px] text-xs h-10'} font-semibold shadow-lg`}
            size={isMobile ? "sm" : "default"}
            style={{
              backgroundColor: '#43778a',
              color: 'white'
            }}
          >
            <Download className={`${isMobile ? 'h-2.5 w-2.5 mr-0.5' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? 'CSV' : 'Export CSV'}
          </Button>
        </>
      )}
    </div>
  );
};

export default IntersectionControls;
