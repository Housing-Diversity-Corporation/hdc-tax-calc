import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';

interface Photo {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions?: Array<{
    displayName: string;
    uri?: string;
    photoUri?: string;
  }>;
}

interface PhotoCarouselProps {
  photos: Photo[];
  placeName: string;
  apiKey: string;
  googlePlacePhotoUrl?: string; // Optional: Google's main place photo
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos, placeName, apiKey, googlePlacePhotoUrl }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  // Create photos array with Google's place photo first if available
  const allPhotos = googlePlacePhotoUrl
    ? [{ url: googlePlacePhotoUrl, isGooglePlacePhoto: true }, ...photos.map(p => ({ photo: p, isGooglePlacePhoto: false }))]
    : photos.map(p => ({ photo: p, isGooglePlacePhoto: false }));

  // Log photo carousel rendering
  // console.log(`📸 NEW PLACES API - Photo Carousel Rendering:`, {
  //   placeName: placeName,
  //   photoCount: allPhotos.length,
  //   hasGooglePlacePhoto: !!googlePlacePhotoUrl,
  //   apiMethod: 'Places Photos (New) API',
  //   endpoint: 'https://places.googleapis.com/v1/{resourceName}/media',
  //   photos: photos.map((p, i) => ({
  //     index: i + (googlePlacePhotoUrl ? 1 : 0),
  //     resourceName: p.name,
  //     dimensions: `${p.widthPx}x${p.heightPx}`,
  //     hasAuthor: !!p.authorAttributions?.length,
  //     authorName: p.authorAttributions?.[0]?.displayName
  //   }))
  // });

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {allPhotos.map((item, index) => {
            // Handle Google Place Photo (first photo if exists)
            if ('url' in item) {
              return (
                <CarouselItem key="google-place-photo" className="pl-2 md:pl-4">
                  <div className="overflow-hidden rounded-lg">
                    <div className="relative w-full h-48 md:h-56">
                      <img
                        src={item.url}
                        alt={`${placeName} - Main Photo`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white px-3 py-2 text-xs">
                        <span>📍 Google Place Photo</span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            }

            // Handle user-contributed photos
            const photo = item.photo;
            const photoURL = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`;

            // Log individual photo rendering
            // console.log(`🖼️ Rendering Photo ${index + 1}/${photos.length}:`, {
            //   placeName: placeName,
            //   photoResourceName: photo.name,
            //   requestedSize: '400x600 (max)',
            //   originalSize: `${photo.widthPx}x${photo.heightPx}`,
            //   photoURL: photoURL.replace(apiKey, 'API_KEY_HIDDEN'),
            //   author: photo.authorAttributions?.[0]?.displayName || 'Unknown'
            // });

            return (
              <CarouselItem key={index} className="pl-2 md:pl-4">
                <div className="overflow-hidden rounded-lg">
                  <div className="relative w-full h-48 md:h-56">
                    <img
                      src={photoURL}
                      alt={`${placeName} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.authorAttributions && photo.authorAttributions.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          {photo.authorAttributions[0].photoUri && (
                            <img
                              src={photo.authorAttributions[0].photoUri}
                              alt={photo.authorAttributions[0].displayName}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="truncate">
                            Photo by{' '}
                            {photo.authorAttributions[0].uri ? (
                              <a
                                href={photo.authorAttributions[0].uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-300"
                              >
                                {photo.authorAttributions[0].displayName}
                              </a>
                            ) : (
                              photo.authorAttributions[0].displayName
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {allPhotos.length > 1 && (
          <>
            <CarouselPrevious className="left-1 h-8 w-8" />
            <CarouselNext className="right-1 h-8 w-8" />
          </>
        )}
      </Carousel>
      <div className="text-center text-xs text-muted-foreground mt-1 pb-2">
        {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'}
      </div>
    </div>
  );
};

export default PhotoCarousel;
