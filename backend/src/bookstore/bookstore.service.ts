import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    [key: string]: any;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface NearbyBookstore {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  rating: number;
  totalReviews: number;
}

@Injectable()
export class BookstoreService {
  async findNearby(lat: number, lon: number): Promise<NearbyBookstore[]> {
    const query = `
      [out:json];
      (
        node["shop"="books"](around:8000,${lat},${lon});
        way["shop"="books"](around:8000,${lat},${lon});
        node["amenity"="library"](around:8000,${lat},${lon});
        way["amenity"="library"](around:8000,${lat},${lon});
      );
      out center;`;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get<OverpassResponse>(url);

      return response.data.elements.map(
        (el: OverpassElement): NearbyBookstore => {
          const latitude = el.lat ?? el.center?.lat ?? 0;
          const longitude = el.lon ?? el.center?.lon ?? 0;

          return {
            id: el.id,
            name: el.tags.name ?? 'Librería especializada',
            latitude,
            longitude,
            address: el.tags['addr:street']
              ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] ?? ''}`
              : 'Dirección disponible en local',
            rating: 0,
            totalReviews: 0,
          };
        },
      );
    } catch (error) {
      console.error('Error con OpenStreetMap:', error);
      return [];
    }
  }
}
