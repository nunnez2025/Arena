import { UNSPLASH_ACCESS_KEY } from './config';
import { UnsplashPhoto, UnsplashSearchResponse, UnsplashSearchParams } from './types';

const BASE_URL = 'https://api.unsplash.com';

class UnsplashAPI {
  private accessKey: string;

  constructor(accessKey: string = UNSPLASH_ACCESS_KEY) {
    this.accessKey = accessKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for photos
   */
  async searchPhotos(params: UnsplashSearchParams): Promise<UnsplashSearchResponse> {
    return this.makeRequest<UnsplashSearchResponse>('/search/photos', params);
  }

  /**
   * Get a random photo
   */
  async getRandomPhoto(params: {
    collections?: string;
    topics?: string;
    username?: string;
    query?: string;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    content_filter?: 'low' | 'high';
    count?: number;
  } = {}): Promise<UnsplashPhoto | UnsplashPhoto[]> {
    return this.makeRequest<UnsplashPhoto | UnsplashPhoto[]>('/photos/random', params);
  }

  /**
   * List photos (latest, oldest, popular)
   */
  async listPhotos(params: {
    page?: number;
    per_page?: number;
    order_by?: 'latest' | 'oldest' | 'popular';
  } = {}): Promise<UnsplashPhoto[]> {
    return this.makeRequest<UnsplashPhoto[]>('/photos', params);
  }

  /**
   * Get a photo by ID
   */
  async getPhoto(id: string): Promise<UnsplashPhoto> {
    return this.makeRequest<UnsplashPhoto>(`/photos/${id}`);
  }

  /**
   * Track download for analytics
   */
  async trackDownload(downloadLocation: string): Promise<void> {
    await fetch(downloadLocation, {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
      },
    });
  }

  /**
   * Get photo statistics
   */
  async getPhotoStats(id: string): Promise<any> {
    return this.makeRequest(`/photos/${id}/statistics`);
  }
}

// Create a singleton instance
export const unsplashAPI = new UnsplashAPI();

// Export the class for custom instances
export { UnsplashAPI };

// Utility functions
export const getOptimizedImageUrl = (photo: UnsplashPhoto, size: 'thumb' | 'small' | 'regular' | 'full' = 'regular'): string => {
  return photo.urls[size];
};

export const getResizedImageUrl = (photo: UnsplashPhoto, width?: number, height?: number, quality?: number): string => {
  const baseUrl = photo.urls.raw;
  const params = new URLSearchParams();
  
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  
  return `${baseUrl}&${params.toString()}`;
};

export const getPhotoAttribution = (photo: UnsplashPhoto): string => {
  return `Photo by ${photo.user.name} on Unsplash`;
};

export const getPhotoAttributionLink = (photo: UnsplashPhoto): string => {
  return `${photo.links.html}?utm_source=arena_game&utm_medium=referral`;
};

