import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Download, X, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportIntersectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (filename: string) => Promise<void>;
  defaultFilename?: string;
}

/**
 * Dialog for exporting intersection results to CSV
 * Provides filename validation and user-friendly export interface
 */
export const ExportIntersectionDialog: React.FC<ExportIntersectionDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  defaultFilename = 'intersection_data.csv',
}) => {
  const [filename, setFilename] = useState(defaultFilename);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFilename(defaultFilename);
  }, [defaultFilename, open]);

  // Ensure .csv extension
  const ensureCsvExtension = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'intersection_data.csv';

    if (trimmed.toLowerCase().endsWith('.csv')) {
      return trimmed;
    }
    return `${trimmed}.csv`;
  };

  const handleExport = async () => {
    if (!filename.trim()) return;

    const finalFilename = ensureCsvExtension(filename);

    setIsLoading(true);
    try {
      await onExport(finalFilename);
      onOpenChange(false);
      setFilename(defaultFilename);
    } catch (error) {
      // Error handling is done in the parent hook
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFilename(defaultFilename);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filename.trim()) {
      e.preventDefault();
      handleExport();
    }
  };

  const finalFilename = ensureCsvExtension(filename);
  const isValidFilename = filename.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export to CSV
          </DialogTitle>
          <DialogDescription>
            Export the intersection results as a CSV file for use in spreadsheets or GIS tools.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="intersection_data.csv"
              autoFocus
              disabled={isLoading}
            />
            {isValidFilename && filename !== finalFilename && (
              <p className="text-xs text-muted-foreground">
                Will be saved as: <span className="font-medium">{finalFilename}</span>
              </p>
            )}
          </div>

          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="text-xs">
              The CSV will contain all properties from intersected layers formatted as <strong>property.tablename</strong> (e.g., <code className="text-xs bg-muted px-1 rounded">zone_type.seattle_zoning</code>). Geometry data is excluded.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!isValidFilename || isLoading}
            className="bg-[#43778a] hover:bg-[#356271]"
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
