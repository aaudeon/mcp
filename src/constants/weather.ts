/**
 * Constantes et configurations pour les codes météorologiques
 */

export const WEATHER_CODE_DESCRIPTIONS: {
  [key: number]: { fr: string; en: string; es: string; de: string };
} = {
  0: { fr: 'Ciel dégagé', en: 'Clear sky', es: 'Cielo despejado', de: 'Klarer Himmel' },
  1: {
    fr: 'Principalement dégagé',
    en: 'Mainly clear',
    es: 'Principalmente despejado',
    de: 'Überwiegend klar',
  },
  2: {
    fr: 'Partiellement nuageux',
    en: 'Partly cloudy',
    es: 'Parcialmente nublado',
    de: 'Teilweise bewölkt',
  },
  3: { fr: 'Couvert', en: 'Overcast', es: 'Nublado', de: 'Bedeckt' },
  45: { fr: 'Brouillard', en: 'Fog', es: 'Niebla', de: 'Nebel' },
  48: { fr: 'Brouillard givrant', en: 'Depositing rime fog', es: 'Niebla helada', de: 'Reifnebel' },
  51: {
    fr: 'Bruine légère',
    en: 'Light drizzle',
    es: 'Llovizna ligera',
    de: 'Leichter Nieselregen',
  },
  53: {
    fr: 'Bruine modérée',
    en: 'Moderate drizzle',
    es: 'Llovizna moderada',
    de: 'Mäßiger Nieselregen',
  },
  55: { fr: 'Bruine forte', en: 'Dense drizzle', es: 'Llovizna densa', de: 'Dichter Nieselregen' },
  61: { fr: 'Pluie légère', en: 'Light rain', es: 'Lluvia ligera', de: 'Leichter Regen' },
  63: { fr: 'Pluie modérée', en: 'Moderate rain', es: 'Lluvia moderada', de: 'Mäßiger Regen' },
  65: { fr: 'Pluie forte', en: 'Heavy rain', es: 'Lluvia fuerte', de: 'Starker Regen' },
  71: { fr: 'Neige légère', en: 'Light snow', es: 'Nieve ligera', de: 'Leichter Schnee' },
  73: { fr: 'Neige modérée', en: 'Moderate snow', es: 'Nieve moderada', de: 'Mäßiger Schnee' },
  75: { fr: 'Neige forte', en: 'Heavy snow', es: 'Nieve fuerte', de: 'Starker Schnee' },
  80: {
    fr: 'Averses légères',
    en: 'Light rain showers',
    es: 'Chubascos ligeros',
    de: 'Leichte Regenschauer',
  },
  81: {
    fr: 'Averses modérées',
    en: 'Moderate rain showers',
    es: 'Chubascos moderados',
    de: 'Mäßige Regenschauer',
  },
  82: {
    fr: 'Averses violentes',
    en: 'Violent rain showers',
    es: 'Chubascos violentos',
    de: 'Heftige Regenschauer',
  },
  95: { fr: 'Orage', en: 'Thunderstorm', es: 'Tormenta', de: 'Gewitter' },
  96: {
    fr: 'Orage avec grêle légère',
    en: 'Thunderstorm with light hail',
    es: 'Tormenta con granizo ligero',
    de: 'Gewitter mit leichtem Hagel',
  },
  99: {
    fr: 'Orage avec grêle forte',
    en: 'Thunderstorm with heavy hail',
    es: 'Tormenta con granizo fuerte',
    de: 'Gewitter mit schwerem Hagel',
  },
};

export const API_ENDPOINTS = {
  GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
  WEATHER: 'https://api.open-meteo.com/v1/forecast',
} as const;

export const DEFAULT_CONFIG = {
  LANGUAGE: 'fr',
  FORECAST_DAYS: 5,
  VISIBILITY_DEFAULT: 10,
  TIMEOUT: 5000,
} as const;
