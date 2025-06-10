import axios from 'axios';
import { API_ENDPOINTS, DEFAULT_CONFIG, WEATHER_CODE_DESCRIPTIONS } from '../constants/weather.js';
import type { GeoLocation, WeatherData, WeatherForecast } from '../types/weather.js';

/**
 * Service pour les opérations météorologiques avec Open-Meteo API
 */
export class WeatherService {
  private readonly geocodingApiUrl = API_ENDPOINTS.GEOCODING;
  private readonly weatherApiUrl = API_ENDPOINTS.WEATHER;

  /**
   * Géocoder une ville avec Open-Meteo Geocoding API
   */
  async geocodeCity(city: string, countryCode?: string): Promise<GeoLocation> {
    try {
      const searchQuery = countryCode ? `${city},${countryCode}` : city;
      const response = await axios.get(this.geocodingApiUrl, {
        params: {
          name: searchQuery,
          count: 1,
          language: 'fr',
          format: 'json',
        },
        timeout: DEFAULT_CONFIG.TIMEOUT,
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`Ville "${city}" non trouvée`);
      }

      const location = response.data.results[0];
      return {
        lat: location.latitude,
        lon: location.longitude,
        name: `${location.name}, ${location.country}`,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erreur de géocodage: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * Traduire un code météo Open-Meteo
   */
  translateWeatherCode(code: number, lang: string = DEFAULT_CONFIG.LANGUAGE): string {
    const description = WEATHER_CODE_DESCRIPTIONS[code];
    if (description) {
      return description[lang as keyof typeof description] || description.fr;
    }
    return lang === 'en' ? 'Unknown conditions' : 'Conditions inconnues';
  }

  /**
   * Obtenir les conditions météorologiques actuelles
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    locationName: string,
    lang: string = DEFAULT_CONFIG.LANGUAGE
  ): Promise<WeatherData> {
    try {
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude,
          longitude,
          current:
            'temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,apparent_temperature,cloud_cover',
          timezone: 'auto',
          forecast_days: 1,
        },
        timeout: DEFAULT_CONFIG.TIMEOUT,
      });

      const current = response.data.current;
      return {
        location: locationName,
        temperature: Math.round(current.temperature_2m),
        description: this.translateWeatherCode(current.weather_code, lang),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 3.6), // Conversion m/s vers km/h
        pressure: Math.round(current.surface_pressure),
        visibility: DEFAULT_CONFIG.VISIBILITY_DEFAULT,
        uvIndex: current.uv_index,
        feelsLike: Math.round(current.apparent_temperature),
        cloudCover: current.cloud_cover,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erreur API météo: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * Obtenir les prévisions météorologiques
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = DEFAULT_CONFIG.FORECAST_DAYS,
    lang: string = DEFAULT_CONFIG.LANGUAGE
  ): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude,
          longitude,
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,wind_speed_10m_max,precipitation_probability_max',
          timezone: 'auto',
          forecast_days: days,
        },
        timeout: DEFAULT_CONFIG.TIMEOUT,
      });

      const daily = response.data.daily;
      const forecasts: WeatherForecast[] = [];

      for (let i = 0; i < days && i < daily.time.length; i++) {
        forecasts.push({
          date: daily.time[i],
          temperature: {
            min: Math.round(daily.temperature_2m_min[i]),
            max: Math.round(daily.temperature_2m_max[i]),
          },
          description: this.translateWeatherCode(daily.weather_code[i], lang),
          humidity: daily.relative_humidity_2m_max[i],
          windSpeed: Math.round(daily.wind_speed_10m_max[i] * 3.6),
          precipitationProbability: daily.precipitation_probability_max[i] || 0,
        });
      }

      return forecasts;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erreur API prévisions: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }
}
