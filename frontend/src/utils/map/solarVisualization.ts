// Solar Visualization Utilities
/// <reference types="@types/google.maps" />
import type { GeoTiff } from '../../types/map/solar';

/**
 * Color scales for different solar data visualizations
 */
export const SOLAR_COLOR_SCALES = {
  // Solar flux intensity (kWh/kW/year)
  FLUX: [
    { value: 0, color: [0, 0, 139, 255] },      // Dark blue (low)
    { value: 500, color: [0, 100, 255, 255] },  // Blue
    { value: 1000, color: [0, 200, 200, 255] }, // Cyan
    { value: 1300, color: [0, 255, 0, 255] },   // Green
    { value: 1500, color: [255, 255, 0, 255] }, // Yellow
    { value: 1700, color: [255, 150, 0, 255] }, // Orange
    { value: 2000, color: [255, 0, 0, 255] },   // Red (high)
  ],

  // Shade/sunlight hours
  SHADE: [
    { value: 0, color: [50, 50, 50, 255] },      // Dark (full shade)
    { value: 0.25, color: [100, 100, 150, 255] },
    { value: 0.5, color: [150, 150, 200, 255] },
    { value: 0.75, color: [200, 200, 100, 255] },
    { value: 1, color: [255, 255, 0, 255] },     // Bright yellow (full sun)
  ],
};

/**
 * Interpolate between two colors based on a value
 */
function interpolateColor(
  color1: number[],
  color2: number[],
  factor: number
): number[] {
  return color1.map((c1, i) => Math.round(c1 + factor * (color2[i] - c1)));
}

/**
 * Get color for a value based on color scale
 */
export function getColorForValue(
  value: number,
  colorScale: typeof SOLAR_COLOR_SCALES.FLUX
): number[] {
  // Handle out of range values
  if (value <= colorScale[0].value) {
    return colorScale[0].color;
  }
  if (value >= colorScale[colorScale.length - 1].value) {
    return colorScale[colorScale.length - 1].color;
  }

  // Find the two color stops to interpolate between
  for (let i = 0; i < colorScale.length - 1; i++) {
    const lower = colorScale[i];
    const upper = colorScale[i + 1];

    if (value >= lower.value && value <= upper.value) {
      const factor = (value - lower.value) / (upper.value - lower.value);
      return interpolateColor(lower.color, upper.color, factor);
    }
  }

  return [128, 128, 128, 255]; // Default gray
}

/**
 * Normalize raster values to 0-1 range
 * Optimized for large arrays - avoids spread operator
 */
function normalizeRaster(raster: number[]): number[] {
  let min = Infinity;
  let max = -Infinity;

  // Find min/max without spread operator (avoids stack overflow)
  for (let i = 0; i < raster.length; i++) {
    const v = raster[i];
    if (!isNaN(v) && isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const range = max - min;

  return raster.map(v => {
    if (isNaN(v) || !isFinite(v)) return 0;
    return range > 0 ? (v - min) / range : 0;
  });
}

/**
 * Create a canvas element with RGB imagery from GeoTIFF data
 * For aerial imagery with 3 bands (R, G, B)
 */
export function createRGBCanvas(geoTiff: GeoTiff): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = geoTiff.width;
  canvas.height = geoTiff.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const imageData = ctx.createImageData(geoTiff.width, geoTiff.height);

  // RGB imagery has 3 bands: R, G, B
  const hasRGB = geoTiff.rasters.length >= 3;

  if (hasRGB) {
    const rBand = geoTiff.rasters[0];
    const gBand = geoTiff.rasters[1];
    const bBand = geoTiff.rasters[2];

    // Copy RGB values directly
    for (let i = 0; i < geoTiff.width * geoTiff.height; i++) {
      const pixelIdx = i * 4;
      imageData.data[pixelIdx] = rBand[i];     // R
      imageData.data[pixelIdx + 1] = gBand[i]; // G
      imageData.data[pixelIdx + 2] = bBand[i]; // B
      imageData.data[pixelIdx + 3] = 255;      // A (opaque)
    }
  } else {
    // Fallback: grayscale from first band
    const band = geoTiff.rasters[0];
    for (let i = 0; i < geoTiff.width * geoTiff.height; i++) {
      const pixelIdx = i * 4;
      const val = band[i];
      imageData.data[pixelIdx] = val;
      imageData.data[pixelIdx + 1] = val;
      imageData.data[pixelIdx + 2] = val;
      imageData.data[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Create a canvas element with heatmap visualization from GeoTIFF data
 */
export function createHeatmapCanvas(
  geoTiff: GeoTiff,
  colorScale: typeof SOLAR_COLOR_SCALES.FLUX,
  normalize: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = geoTiff.width;
  canvas.height = geoTiff.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const imageData = ctx.createImageData(geoTiff.width, geoTiff.height);
  const raster = geoTiff.rasters[0]; // Use first band

  // Normalize if requested
  const values = normalize ? normalizeRaster(raster) : raster;

  // Apply color scale to each pixel
  for (let y = 0; y < geoTiff.height; y++) {
    for (let x = 0; x < geoTiff.width; x++) {
      const idx = y * geoTiff.width + x;
      const value = values[idx];

      let color: number[];
      if (normalize) {
        // For normalized values, scale to color scale range
        const scaledValue = value * colorScale[colorScale.length - 1].value;
        color = getColorForValue(scaledValue, colorScale);
      } else {
        color = getColorForValue(value, colorScale);
      }

      const pixelIdx = idx * 4;
      imageData.data[pixelIdx] = color[0];     // R
      imageData.data[pixelIdx + 1] = color[1]; // G
      imageData.data[pixelIdx + 2] = color[2]; // B
      imageData.data[pixelIdx + 3] = color[3]; // A
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Create a Google Maps GroundOverlay from GeoTIFF data
 * Note: google.maps must be loaded before calling this function
 */
export function createSolarOverlay(
  geoTiff: GeoTiff,
  colorScale: typeof SOLAR_COLOR_SCALES.FLUX,
  opacity: number = 0.7,
  normalize: boolean = false
): google.maps.GroundOverlay {
  const canvas = createHeatmapCanvas(geoTiff, colorScale, normalize);
  const imageUrl = canvas.toDataURL('image/png');

  const bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(geoTiff.bounds.south, geoTiff.bounds.west),
    new google.maps.LatLng(geoTiff.bounds.north, geoTiff.bounds.east)
  );

  const overlay = new google.maps.GroundOverlay(imageUrl, bounds, {
    opacity: opacity,
    clickable: false,
  });

  return overlay;
}

/**
 * Create a legend canvas for the color scale
 */
export function createColorScaleLegend(
  colorScale: typeof SOLAR_COLOR_SCALES.FLUX,
  width: number = 200,
  height: number = 30,
  title: string = 'Solar Irradiance (kWh/kW/year)'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height + 40; // Extra space for title and labels

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 15);

  // Draw gradient
  const gradientY = 25;
  const gradientHeight = 20;

  for (let x = 0; x < width; x++) {
    const value = (x / width) * (colorScale[colorScale.length - 1].value - colorScale[0].value) + colorScale[0].value;
    const color = getColorForValue(value, colorScale);
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
    ctx.fillRect(x, gradientY, 1, gradientHeight);
  }

  // Draw border
  ctx.strokeStyle = 'black';
  ctx.strokeRect(0, gradientY, width, gradientHeight);

  // Draw value labels
  ctx.fillStyle = 'black';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(colorScale[0].value.toString(), 0, gradientY + gradientHeight + 12);
  ctx.textAlign = 'right';
  ctx.fillText(colorScale[colorScale.length - 1].value.toString(), width, gradientY + gradientHeight + 12);

  return canvas;
}

/**
 * Calculate statistics for GeoTIFF raster data
 */
export function calculateRasterStats(raster: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
} {
  const validValues = raster.filter(v => !isNaN(v) && isFinite(v));
  const sorted = validValues.sort((a, b) => a - b);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / validValues.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  return { min, max, mean, median };
}
