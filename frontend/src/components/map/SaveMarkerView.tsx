import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Check } from 'lucide-react';

export interface PropertyType {
  name: string;
  code: string;
  subCategories: { name: string; code: string }[];
}

export interface SelectedPropertyType {
  parent: PropertyType | null;
  code: string | undefined;
}

interface SaveMarkerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, propertyType: SelectedPropertyType) => void;
  onCancel: () => void;
  defaultName: string;
}

const propertyTypes: PropertyType[] = [
  {
    name: 'Development',
    code: 'development',
    subCategories: [
      { name: 'Acquisition', code: 'acquisition' },
      { name: 'Pre-development', code: 'pre-development' },
      { name: 'Construction', code: 'construction' },
      { name: 'Completed', code: 'completed' },
    ],
  },
  {
    name: 'Government/School',
    code: 'gov-school',
    subCategories: [
      { name: 'Public', code: 'public' },
      { name: 'Private', code: 'private' },
      { name: 'Community', code: 'community' },
    ],
  },
];

const SaveMarkerView: React.FC<SaveMarkerViewProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  defaultName
}) => {
  const [name, setName] = useState(defaultName);
  const [propertyType, setPropertyType] = useState<string>('');

  // Update name when defaultName changes or dialog opens
  useEffect(() => {
    if (open && defaultName) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  const handleConfirm = () => {
    if (!name || !propertyType) return;

    // Find parent and subcategory
    let parent: PropertyType | null = null;
    let code: string | undefined = undefined;

    for (const type of propertyTypes) {
      const subCategory = type.subCategories.find(sub => sub.code === propertyType);
      if (subCategory) {
        parent = type;
        code = subCategory.code;
        break;
      }
    }

    onConfirm(name, { parent, code });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Marker</DialogTitle>
          <DialogDescription>
            Save this location with a name and property type
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3 sm:gap-4 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="name" className="text-sm">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter location name"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="propertyType" className="text-sm">Property Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger id="propertyType" className="h-9 text-sm">
                <SelectValue placeholder="Select a property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map(type => (
                  <SelectGroup key={type.code}>
                    <SelectLabel>{type.name}</SelectLabel>
                    {type.subCategories.map(sub => (
                      <SelectItem key={sub.code} value={sub.code}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="gap-1.5 h-9 text-sm sm:h-10"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name || !propertyType}
            className="gap-1.5 h-9 text-sm sm:h-10 bg-[#7fbd45] hover:bg-[#6ba836]"
          >
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMarkerView;
