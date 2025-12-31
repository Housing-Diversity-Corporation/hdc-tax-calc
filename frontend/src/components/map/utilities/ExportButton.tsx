import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  hasIntersection?: boolean;
  hasSearchResults?: boolean;
  onExportIntersection?: () => void;
  onExportSearchResults?: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  hasIntersection = false,
  hasSearchResults = false,
  onExportIntersection,
  onExportSearchResults,
  size = 'icon',
  variant = 'outline',
  className = '',
}) => {
  const hasAnythingToExport = hasIntersection || hasSearchResults;

  // If only one thing to export, trigger it directly
  const handleButtonClick = (e: React.MouseEvent) => {
    const exportOptions = [
      { has: hasIntersection, fn: onExportIntersection },
      { has: hasSearchResults, fn: onExportSearchResults },
    ].filter(opt => opt.has);

    if (exportOptions.length === 1 && exportOptions[0].fn) {
      e.preventDefault();
      exportOptions[0].fn();
    }
    // Otherwise, let the dropdown open naturally
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant={variant}
          onClick={handleButtonClick}
          disabled={!hasAnythingToExport}
          className={`${hasAnythingToExport ? 'utility-button-breathe' : '!opacity-0 !pointer-events-none hidden'} ${className}`}
          style={hasAnythingToExport ? { backgroundColor: '#43778a', color: 'white', borderColor: '#43778a' } : {}}
        >
          <Download className="h-4 w-4" />
          <span className="button-text">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        {hasIntersection && (
          <DropdownMenuItem onClick={onExportIntersection}>
            Export Intersection CSV
          </DropdownMenuItem>
        )}
        {hasSearchResults && (
          <DropdownMenuItem onClick={onExportSearchResults}>
            Export Search Results CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
