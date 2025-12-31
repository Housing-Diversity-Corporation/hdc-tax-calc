export interface ParcelInfo {
  pin?: string;
  owner?: string;
  jurisdiction?: string;
  presentUse?: string;
  address?: string;
  appraisedValue?: string;
  landValue?: string;
  buildingValue?: string;
  lotSqft?: string;
  accountArea?: string;
  city?: string;
  numBuildings?: string;
  numUnits?: string;
  levyCode?: string;
  yearBuilt?: string;
  zoning?: string;
  success?: boolean;
  message?: string;
}

/**
 * Generate King County Parcel Viewer URL from PIN
 */
export const getParcelViewerUrl = (pin?: string): string => {
  // King County Parcel Viewer URL format
  const baseUrl = 'https://gismaps.kingcounty.gov/parcelviewer2/';
  if (pin) {
    // Format: ?pin=123456789
    return `${baseUrl}?pin=${pin}`;
  }
  return baseUrl;
};

/**
 * Generate King County Property Report URL using PIN
 */
export const getPropertyReportUrl = (pin?: string): string => {
  // King County property search URL
  const baseUrl = 'https://blue.kingcounty.com/Assessor/eRealProperty/Dashboard.aspx';
  if (pin) {
    return `${baseUrl}?ParcelNbr=${pin}`;
  }
  return baseUrl;
};

/**
 * Extract King County from address (if it's in King County)
 */
export const isKingCountyAddress = (address: string): boolean => {
  if (!address) return false;

  // Check if address contains Seattle, Bellevue, Redmond, Kent, Renton, or other King County cities
  const kingCountyCities = [
    'Seattle', 'Bellevue', 'Kent', 'Auburn', 'Renton', 'Federal Way',
    'Kirkland', 'Shoreline', 'Redmond', 'Sammamish', 'Burien', 'Issaquah',
    'Des Moines', 'SeaTac', 'Mercer Island', 'Maple Valley', 'Kenmore',
    'Tukwila', 'Covington', 'Lake Forest Park', 'Enumclaw', 'Black Diamond',
    'Snoqualmie', 'Woodinville', 'Bothell', 'Newcastle', 'Normandy Park'
  ];

  const addressUpper = address.toUpperCase();
  return kingCountyCities.some(city => addressUpper.includes(city.toUpperCase()));
};

/**
 * Format parcel viewer link for display
 */
export const getParcelViewerLink = (pin: string | undefined, address: string): string => {
  if (!isKingCountyAddress(address)) {
    return ''; // Don't show link for non-King County addresses
  }

  const url = getParcelViewerUrl(pin);
  return `<a href="${url}" target="_blank" style="color: #0066cc; text-decoration: underline; display: block; margin-top: 8px;">
    View King County Parcel Info
  </a>`;
};

/**
 * Fetch parcel data from backend
 */
export const fetchParcelData = async (address: string, lat?: number, lng?: number): Promise<ParcelInfo | null> => {
  try {
    const params = new URLSearchParams();
    // Prefer coordinates over address for better accuracy
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    } else if (address) {
      params.append('address', address);
    }

    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`http://localhost:8080/api/parcel/info?${params}`, {
      headers
    });

    if (!response.ok) {
      console.warn('Failed to fetch parcel data, status:', response.status);
      return null;
    }

    const data = await response.json();
    return data as ParcelInfo;
  } catch (error) {
    console.error('Error fetching parcel data:', error);
    return null;
  }
};

/**
 * Format currency value
 */
const formatCurrency = (value: string | undefined): string => {
  if (!value || value === '0') return 'N/A';
  const num = parseInt(value);
  return isNaN(num) ? value : `$${num.toLocaleString()}`;
};

/**
 * Format square feet
 */
const formatSqft = (value: string | undefined): string => {
  if (!value || value === '0') return 'N/A';
  const num = parseInt(value);
  return isNaN(num) ? value : `${num.toLocaleString()} sq ft`;
};

/**
 * Generate parcel data HTML for display
 */
export const formatParcelDataHtml = (parcelData: ParcelInfo): string => {
  if (!parcelData.success) {
    return '';
  }

  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
      <div style="font-weight: bold; color: black; margin-bottom: 8px;">King County Parcel Data:</div>
      <table style="width: 100%; font-size: 12px; color: #333;">
        ${parcelData.pin ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">PIN:</td>
          <td style="padding: 2px 0;">${parcelData.pin}</td>
        </tr>` : ''}
        ${parcelData.owner ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Owner:</td>
          <td style="padding: 2px 0;">${parcelData.owner}</td>
        </tr>` : ''}
        ${parcelData.presentUse ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Use:</td>
          <td style="padding: 2px 0;">${parcelData.presentUse}</td>
        </tr>` : ''}
        ${parcelData.jurisdiction ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Jurisdiction:</td>
          <td style="padding: 2px 0;">${parcelData.jurisdiction}</td>
        </tr>` : ''}
        ${parcelData.appraisedValue ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Total Value:</td>
          <td style="padding: 2px 0;">${formatCurrency(parcelData.appraisedValue)}</td>
        </tr>` : ''}
        ${parcelData.landValue ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Land Value:</td>
          <td style="padding: 2px 0;">${formatCurrency(parcelData.landValue)}</td>
        </tr>` : ''}
        ${parcelData.buildingValue ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Building Value:</td>
          <td style="padding: 2px 0;">${formatCurrency(parcelData.buildingValue)}</td>
        </tr>` : ''}
        ${parcelData.lotSqft ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Lot Size:</td>
          <td style="padding: 2px 0;">${formatSqft(parcelData.lotSqft)}</td>
        </tr>` : ''}
        ${parcelData.yearBuilt && parcelData.yearBuilt !== '0' ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Year Built:</td>
          <td style="padding: 2px 0;">${parcelData.yearBuilt}</td>
        </tr>` : ''}
        ${parcelData.zoning ? `
        <tr>
          <td style="font-weight: bold; padding: 2px 8px 2px 0;">Zoning:</td>
          <td style="padding: 2px 0;">${parcelData.zoning}</td>
        </tr>` : ''}
      </table>
    </div>
  `;
};

/**
 * Generate links for both parcel viewer and property report
 */
export const getPropertyLinks = (address: string, pin?: string): string => {
  if (!isKingCountyAddress(address)) {
    return '';
  }

  const parcelUrl = getParcelViewerUrl(pin);
  const propertyUrl = getPropertyReportUrl(pin);

  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
      <div style="font-weight: bold; color: black; margin-bottom: 6px;">King County Resources:</div>
      <a href="${parcelUrl}" target="_blank" style="color: #0066cc; text-decoration: underline; display: block; margin-bottom: 4px;">
        📍 View Parcel Map
      </a>
      <a href="${propertyUrl}" target="_blank" style="color: #0066cc; text-decoration: underline; display: block;">
        📊 Property Report
      </a>
    </div>
  `;
};