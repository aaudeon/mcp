/**
 * Types TypeScript pour les données météorologiques
 */

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex?: number;
  feelsLike: number;
  cloudCover: number;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  description: string;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
}

export interface WeatherApiParams {
  city: string;
  countryCode?: string;
  lang?: string;
  days?: number;
}

export interface CoordinatesParams {
  latitude: number;
  longitude: number;
  lang?: string;
}
