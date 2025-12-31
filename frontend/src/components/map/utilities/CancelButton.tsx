import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X } from 'lucide-react';

interface CancelButtonProps {
  hasSolarPlacement?: boolean;
  hasNeighborhoodExplorerPlacement?: boolean;
  onCancelSolar?: () => void;
  onCancelNeighborhoodExplorer?: () => void;
  onCancelAll?: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  hasSolarPlacement = false,
  hasNeighborhoodExplorerPlacement = false,
  onCancelSolar,
  onCancelNeighborhoodExplorer,
  onCancelAll,
  size = 'icon',
  variant = 'outline',
  className = '',
}) => {
  const hasAnythingToCancel = hasSolarPlacement || hasNeighborhoodExplorerPlacement;

  // Count active items to determine if we show "Cancel All"
  const activeItemCount = [hasSolarPlacement, hasNeighborhoodExplorerPlacement].filter(Boolean).length;

  // Double-click detection state
  const lastClickTimeRef = useRef<number>(0);
  const openDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCancelAll = () => {
    if (onCancelSolar && hasSolarPlacement) onCancelSolar();
    if (onCancelNeighborhoodExplorer && hasNeighborhoodExplorerPlacement) onCancelNeighborhoodExplorer();
    if (onCancelAll) onCancelAll();
  };

  // Handle button pointer down for double-click detection
  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    // If clicked within 3 seconds, trigger Cancel All
    if (timeSinceLastClick < 3000 && timeSinceLastClick > 0) {
      e.preventDefault();
      e.stopPropagation();

      // Cancel any pending dropdown open
      if (openDelayTimeoutRef.current) {
        clearTimeout(openDelayTimeoutRef.current);
        openDelayTimeoutRef.current = null;
      }

      setDropdownOpen(false);
      handleCancelAll();
      lastClickTimeRef.current = 0; // Reset after canceling
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
          className={`${hasAnythingToCancel ? 'utility-button-breathe' : '!opacity-0 !pointer-events-none hidden'} ${className}`}
          disabled={!hasAnythingToCancel}
          style={hasAnythingToCancel ? { backgroundColor: '#474a44', color: 'white', borderColor: '#474a44' } : {}}
        >
          <X className="h-4 w-4" />
          <span className="button-text">Cancel</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        {hasSolarPlacement && (
          <DropdownMenuItem onClick={onCancelSolar}>
            Cancel Solar Analysis
          </DropdownMenuItem>
        )}
        {hasNeighborhoodExplorerPlacement && (
          <DropdownMenuItem onClick={onCancelNeighborhoodExplorer}>
            Cancel Neighborhood Explorer
          </DropdownMenuItem>
        )}
        {activeItemCount > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleCancelAll}
              className="font-semibold"
            >
              Cancel All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
