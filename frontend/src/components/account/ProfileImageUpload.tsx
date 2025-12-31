import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2, CloudUpload, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { tokenService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onUploadSuccess: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CropArea
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.95);
  });
};

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
}) => {
  const { isDarkMode } = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError('Please select an image file');
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      onUploadError('Image must be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setIsDialogOpen(true);
    });
    reader.readAsDataURL(file);
  }, [onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 20 * 1024 * 1024,
  });

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });

      const token = tokenService.getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8080/api/user/profile-image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUploadSuccess(data.imageUrl);
        toast.success('Profile image uploaded successfully!');
        setIsDialogOpen(false);
        setImageSrc(null);
      } else {
        const errorData = await response.json();
        onUploadError(errorData.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      onUploadError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setDeleting(true);

    try {
      const token = tokenService.getToken();
      const response = await fetch('http://localhost:8080/api/user/profile-image/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onUploadSuccess('');
        toast.success('Profile image deleted successfully!');
      } else {
        const errorData = await response.json();
        onUploadError(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      onUploadError('Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div>
      {/* Entire component is a dropzone */}
      <div
        {...getRootProps()}
        className={`
          p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
          ${isDragActive
            ? 'border-primary bg-accent shadow-md'
            : isDarkMode
              ? 'border-white/20'
              : 'border-black/20'
          }
          hover:border-primary hover:bg-accent hover:-translate-y-0.5
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <Avatar className="w-[120px] h-[120px] border-3 border-primary aspect-square flex-shrink-0" style={{ width: '120px', height: '120px', minWidth: '120px', minHeight: '120px', maxWidth: '120px', maxHeight: '120px' }}>
            <AvatarImage src={currentImageUrl} className="aspect-square object-cover" />
            <AvatarFallback className="text-4xl aspect-square">
              {currentImageUrl ? '' : '?'}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 w-full md:w-auto min-w-0">
            {/* Drag & Drop Message */}
            <div className="flex items-center gap-2 mb-4">
              <CloudUpload
                className={`w-6 h-6 md:w-8 md:h-8 flex-shrink-0 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <p className="font-medium text-sm md:text-base">
                {isDragActive
                  ? 'Drop your image here!'
                  : currentImageUrl
                    ? 'Drag & drop to replace, or use buttons below'
                    : 'Drag & drop your photo here'}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                asChild
              >
                <label className="cursor-pointer">
                  <Camera className="w-4 h-4 mr-2" />
                  {currentImageUrl ? 'Upload New' : 'Upload Photo'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        onDrop([files[0]]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </Button>

              {currentImageUrl && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleting}
                  className="text-destructive hover:text-destructive"
                >
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Supports: JPG, PNG, GIF, WEBP • Max size: 20MB • Recommended: Square image
            </p>
          </div>
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="border-b pb-3">
              Crop & Position Your Photo
            </DialogTitle>
          </DialogHeader>

          <div className="pt-3">
            <div
              className={`
                relative w-full h-[400px] rounded mb-6 overflow-hidden
                ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}
              `}
            >
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="px-4">
              <p className="font-medium mb-2">
                Zoom: {zoom.toFixed(1)}x
              </p>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use the slider to zoom, drag the image to reposition
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Save & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileImageUpload;
