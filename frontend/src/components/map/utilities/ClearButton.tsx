import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';

interface ClearButtonProps {
  hasMarkers?: boolean;
  hasIntersection?: boolean;
  hasSearchResults?: boolean;
  hasSolarData?: boolean;
  onClearMarkers?: () => void;
  onClearIntersection?: () => void;
  onClearSearchResults?: () => void;
  onClearSolar?: () => void;
  onClearAll?: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const ClearButton: React.FC<ClearButtonProps> = ({
  hasMarkers = false,
  hasIntersection = false,
  hasSearchResults = false,
  hasSolarData = false,
  onClearMarkers,
  onClearIntersection,
  onClearSearchResults,
  onClearSolar,
  onClearAll,
  size = 'icon',
  variant = 'outline',
  className = '',
}) => {
  const hasAnythingToClear = hasMarkers || hasIntersection || hasSearchResults || hasSolarData;

  // Count active items to determine if we show "Clear All"
  const activeItemCount = [hasMarkers, hasIntersection, hasSearchResults, hasSolarData].filter(Boolean).length;

  // Double-click detection state
  const lastClickTimeRef = useRef<number>(0);
  const openDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClearAll = () => {
    if (onClearMarkers && hasMarkers) onClearMarkers();
    if (onClearIntersection && hasIntersection) onClearIntersection();
    if (onClearSearchResults && hasSearchResults) onClearSearchResults();
    if (onClearSolar && hasSolarData) onClearSolar();
    if (onClearAll) onClearAll();
  };

  // Handle button pointer down for double-click detection
  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    // If clicked within 3 seconds, trigger Clear All
    if (timeSinceLastClick < 3000 && timeSinceLastClick > 0) {
      e.preventDefault();
      e.stopPropagation();

      // Cancel any pending dropdown open
      if (openDelayTimeoutRef.current) {
        clearTimeout(openDelayTimeoutRef.current);
        openDelayTimeoutRef.current = null;
      }

      setDropdownOpen(false);
      handleClearAll();
      lastClickTimeRef.current = 0; // Reset after clearing
    } else {
      // First click - record timestamp and schedule dropdown to open
      lastClickTimeRef.current = now;

      // Clear any existing timeout
      if (openDelayTimeoutRef.current) {
        clearTimeout(openDelayTimeoutRef.current);
      }

      // Open dropdown after short delay to allow double-click detection
      openDelayTimeoutRef.current = setTimeout(() => {
        setDropdownOpen(true);
        openDelayTimeoutRef.current = null;
      }, 200);
    }
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant={variant}
          onPointerDown={handlePointerDown}
          className={`${hasAnythingToClear ? 'utility-button-breathe' : '!opacity-0 !pointer-events-none hidden'} ${className}`}
          disabled={!hasAnythingToClear}
          style={hasAnythingToClear ? { backgroundColor: '#bf7041', color: 'white', borderColor: '#bf7041' } : {}}
        >
          <Trash2 className="h-4 w-4" />
          <span className="button-text">Clear</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        {hasMarkers && (
          <DropdownMenuItem onClick={onClearMarkers}>
            Clear Markers
          </DropdownMenuItem>
        )}
        {hasIntersection && (
          <DropdownMenuItem onClick={onClearIntersection}>
            Clear Intersection
          </DropdownMenuItem>
        )}
        {hasSearchResults && (
          <DropdownMenuItem onClick={onClearSearchResults}>
            Clear Search Results
          </DropdownMenuItem>
        )}
        {hasSolarData && (
          <DropdownMenuItem onClick={onClearSolar}>
            Clear Solar Data
          </DropdownMenuItem>
        )}
        {activeItemCount > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClearAll}
              className="font-semibold"
            >
              Clear All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
