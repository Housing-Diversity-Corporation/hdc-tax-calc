// Global singleton to track all open InfoWindows across the application
class InfoWindowManager {
  private allInfoWindows: Set<google.maps.InfoWindow> = new Set();

  /**
   * Opens an InfoWindow and ensures any previously open InfoWindow is closed first
   * This prevents positioning conflicts when multiple markers have InfoWindows
   */
  openInfoWindow(
    infoWindow: google.maps.InfoWindow,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement,
    position?: google.maps.LatLng | google.maps.LatLngLiteral | null
  ) {
    // Close ALL existing InfoWindows first
    this.closeAllInfoWindows();

    // If position is provided, use position-based opening (better for zoom stability)
    // Otherwise, use anchor-based opening (traditional approach)
    if (position) {
      infoWindow.setPosition(position);
      infoWindow.open({
        map: map,
        shouldFocus: false,
      });
    } else {
      infoWindow.open({
        map: map,
        anchor: marker,
        shouldFocus: false,
      });
    }

    // Track this InfoWindow
    this.allInfoWindows.add(infoWindow);
  }

  /**
   * Closes all tracked InfoWindows
   */
  closeAllInfoWindows() {
    this.allInfoWindows.forEach(iw => {
      try {
        iw.close();
      } catch (e) {
        // Ignore errors from already closed windows
      }
    });
    this.allInfoWindows.clear();
  }

  /**
   * Closes the currently open InfoWindow if any
   * @deprecated Use closeAllInfoWindows instead
   */
  closeCurrentInfoWindow() {
    this.closeAllInfoWindows();
  }
}

// Export singleton instance
export const infoWindowManager = new InfoWindowManager();
