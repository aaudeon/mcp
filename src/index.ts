#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { createServer } from 'http';
import { URL } from 'url';

interface WeatherData {
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

interface WeatherForecast {
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

// Codes météo Open-Meteo vers descriptions
const weatherCodeDescriptions: { [key: number]: { fr: string; en: string; es: string; de: string } } = {
  0: { fr: 'Ciel dégagé', en: 'Clear sky', es: 'Cielo despejado', de: 'Klarer Himmel' },
  1: { fr: 'Principalement dégagé', en: 'Mainly clear', es: 'Principalmente despejado', de: 'Überwiegend klar' },
  2: { fr: 'Partiellement nuageux', en: 'Partly cloudy', es: 'Parcialmente nublado', de: 'Teilweise bewölkt' },
  3: { fr: 'Couvert', en: 'Overcast', es: 'Nublado', de: 'Bedeckt' },
  45: { fr: 'Brouillard', en: 'Fog', es: 'Niebla', de: 'Nebel' },
  48: { fr: 'Brouillard givrant', en: 'Depositing rime fog', es: 'Niebla helada', de: 'Reifnebel' },
  51: { fr: 'Bruine légère', en: 'Light drizzle', es: 'Llovizna ligera', de: 'Leichter Nieselregen' },
  53: { fr: 'Bruine modérée', en: 'Moderate drizzle', es: 'Llovizna moderada', de: 'Mäßiger Nieselregen' },
  55: { fr: 'Bruine forte', en: 'Dense drizzle', es: 'Llovizna densa', de: 'Dichter Nieselregen' },
  61: { fr: 'Pluie légère', en: 'Light rain', es: 'Lluvia ligera', de: 'Leichter Regen' },
  63: { fr: 'Pluie modérée', en: 'Moderate rain', es: 'Lluvia moderada', de: 'Mäßiger Regen' },
  65: { fr: 'Pluie forte', en: 'Heavy rain', es: 'Lluvia fuerte', de: 'Starker Regen' },
  71: { fr: 'Neige légère', en: 'Light snow', es: 'Nieve ligera', de: 'Leichter Schnee' },
  73: { fr: 'Neige modérée', en: 'Moderate snow', es: 'Nieve moderada', de: 'Mäßiger Schnee' },
  75: { fr: 'Neige forte', en: 'Heavy snow', es: 'Nieve fuerte', de: 'Starker Schnee' },
  80: { fr: 'Averses légères', en: 'Light rain showers', es: 'Chubascos ligeros', de: 'Leichte Regenschauer' },
  81: { fr: 'Averses modérées', en: 'Moderate rain showers', es: 'Chubascos moderados', de: 'Mäßige Regenschauer' },
  82: { fr: 'Averses violentes', en: 'Violent rain showers', es: 'Chubascos violentos', de: 'Heftige Regenschauer' },
  95: { fr: 'Orage', en: 'Thunderstorm', es: 'Tormenta', de: 'Gewitter' },
  96: { fr: 'Orage avec grêle légère', en: 'Thunderstorm with light hail', es: 'Tormenta con granizo ligero', de: 'Gewitter mit leichtem Hagel' },
  99: { fr: 'Orage avec grêle forte', en: 'Thunderstorm with heavy hail', es: 'Tormenta con granizo fuerte', de: 'Gewitter mit schwerem Hagel' }
};

class WeatherMCPServer {
  private server: Server;
  private geocodingApiUrl: string = 'https://geocoding-api.open-meteo.com/v1/search';
  private weatherApiUrl: string = 'https://api.open-meteo.com/v1/forecast';

  constructor() {
    this.server = new Server(
      {
        name: 'weather-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_weather',
          description: 'Obtenir les conditions météorologiques actuelles pour une ville',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: 'Nom de la ville (ex: "Paris", "London")'
              },
              countryCode: {
                type: 'string',
                description: 'Code pays optionnel (ex: "FR", "GB")',
                pattern: '^[A-Z]{2}$'
              },
              lang: {
                type: 'string',
                description: 'Langue pour les descriptions (fr, en, es, de, etc.)',
                enum: ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'],
                default: 'fr'
              }
            },
            required: ['city']
          }
        },
        {
          name: 'get_weather_forecast',
          description: 'Obtenir les prévisions météorologiques pour plusieurs jours',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: 'Nom de la ville (ex: "Paris", "London")'
              },
              countryCode: {
                type: 'string',
                description: 'Code pays optionnel (ex: "FR", "GB")',
                pattern: '^[A-Z]{2}$'
              },
              days: {
                type: 'number',
                description: 'Nombre de jours de prévisions (1-7)',
                minimum: 1,
                maximum: 7,
                default: 5
              },
              lang: {
                type: 'string',
                description: 'Langue pour les descriptions (fr, en, es, de, etc.)',
                enum: ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'],
                default: 'fr'
              }
            },
            required: ['city']
          }
        },
        {
          name: 'get_weather_by_coordinates',
          description: 'Obtenir la météo par coordonnées géographiques',
          inputSchema: {
            type: 'object',
            properties: {
              latitude: {
                type: 'number',
                description: 'Latitude (ex: 48.8566 pour Paris)',
                minimum: -90,
                maximum: 90
              },
              longitude: {
                type: 'number',
                description: 'Longitude (ex: 2.3522 pour Paris)',
                minimum: -180,
                maximum: 180
              },
              lang: {
                type: 'string',
                description: 'Langue pour les descriptions (fr, en, es, de, etc.)',
                enum: ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'],
                default: 'fr'
              }
            },
            required: ['latitude', 'longitude']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_weather':
            return await this.handleGetWeather(args);
          case 'get_weather_forecast':
            return await this.handleGetWeatherForecast(args);
          case 'get_weather_by_coordinates':
            return await this.handleGetWeatherByCoordinates(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Outil inconnu: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Erreur lors de l'exécution de ${name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        );
      }
    });
  }

  // Géocoder une ville avec Open-Meteo Geocoding API
  private async geocodeCity(city: string, countryCode?: string): Promise<{ lat: number; lon: number; name: string }> {
    try {
      const searchQuery = countryCode ? `${city},${countryCode}` : city;
      const response = await axios.get(this.geocodingApiUrl, {
        params: {
          name: searchQuery,
          count: 1,
          language: 'fr',
          format: 'json'
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`Ville "${city}" non trouvée`);
      }

      const location = response.data.results[0];
      return {
        lat: location.latitude,
        lon: location.longitude,
        name: `${location.name}, ${location.country}`
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erreur de géocodage: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  // Traduire un code météo Open-Meteo
  private translateWeatherCode(code: number, lang: string = 'fr'): string {
    const description = weatherCodeDescriptions[code];
    if (description) {
      return description[lang as keyof typeof description] || description.fr;
    }
    return lang === 'en' ? 'Unknown conditions' : 'Conditions inconnues';
  }

  private async handleGetWeather(args: any): Promise<any> {
    const { city, countryCode, lang = 'fr' } = args;

    if (!city) {
      throw new McpError(ErrorCode.InvalidParams, 'Le paramètre "city" est requis');
    }

    try {
      // Géocoder la ville
      const location = await this.geocodeCity(city, countryCode);

      // Obtenir les données météo actuelles
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          current: 'temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,apparent_temperature,cloud_cover',
          timezone: 'auto',
          forecast_days: 1
        }
      });

      const current = response.data.current;
      const weatherData: WeatherData = {
        location: location.name,
        temperature: Math.round(current.temperature_2m),
        description: this.translateWeatherCode(current.weather_code, lang),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 3.6), // Conversion m/s vers km/h
        pressure: Math.round(current.surface_pressure),
        visibility: 10, // Open-Meteo ne fournit pas cette donnée, valeur par défaut
        uvIndex: current.uv_index,
        feelsLike: Math.round(current.apparent_temperature),
        cloudCover: current.cloud_cover
      };

      return {
        content: [
          {
            type: 'text',
            text: `🌤️ **Météo actuelle à ${weatherData.location}**

🌡️ **Température**: ${weatherData.temperature}°C (ressenti ${weatherData.feelsLike}°C)
☁️ **Conditions**: ${weatherData.description}
💧 **Humidité**: ${weatherData.humidity}%
🌪️ **Vent**: ${weatherData.windSpeed} km/h
📊 **Pression**: ${weatherData.pressure} hPa
☁️ **Couverture nuageuse**: ${weatherData.cloudCover}%
${weatherData.uvIndex ? `☀️ **Index UV**: ${weatherData.uvIndex}` : ''}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Impossible d'obtenir la météo pour "${city}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  private async handleGetWeatherForecast(args: any): Promise<any> {
    const { city, countryCode, days = 5, lang = 'fr' } = args;

    if (!city) {
      throw new McpError(ErrorCode.InvalidParams, 'Le paramètre "city" est requis');
    }

    if (days < 1 || days > 7) {
      throw new McpError(ErrorCode.InvalidParams, 'Le nombre de jours doit être entre 1 et 7');
    }

    try {
      // Géocoder la ville
      const location = await this.geocodeCity(city, countryCode);

      // Obtenir les prévisions météo
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max',
          timezone: 'auto',
          forecast_days: days
        }
      });

      const daily = response.data.daily;
      const forecasts: WeatherForecast[] = [];

      for (let i = 0; i < days; i++) {
        const forecast: WeatherForecast = {
          date: daily.time[i],
          temperature: {
            min: Math.round(daily.temperature_2m_min[i]),
            max: Math.round(daily.temperature_2m_max[i])
          },
          description: this.translateWeatherCode(daily.weather_code[i], lang),
          humidity: daily.relative_humidity_2m_mean[i],
          windSpeed: Math.round(daily.wind_speed_10m_max[i] * 3.6), // Conversion m/s vers km/h
          precipitationProbability: daily.precipitation_probability_max[i] || 0
        };
        forecasts.push(forecast);
      }

      let forecastText = `🌤️ **Prévisions météo pour ${location.name}** (${days} jour${days > 1 ? 's' : ''})\n\n`;

      forecasts.forEach((forecast, index) => {
        const date = new Date(forecast.date);
        const dateStr = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });

        forecastText += `📅 **${dateStr}**
🌡️ ${forecast.temperature.min}°C / ${forecast.temperature.max}°C
☁️ ${forecast.description}
💧 Humidité: ${forecast.humidity}%
🌪️ Vent: ${forecast.windSpeed} km/h
🌧️ Probabilité de pluie: ${forecast.precipitationProbability}%

`;
      });

      return {
        content: [
          {
            type: 'text',
            text: forecastText.trim()
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Impossible d'obtenir les prévisions pour "${city}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  private async handleGetWeatherByCoordinates(args: any): Promise<any> {
    const { latitude, longitude, lang = 'fr' } = args;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new McpError(ErrorCode.InvalidParams, 'Les paramètres "latitude" et "longitude" sont requis et doivent être des nombres');
    }

    if (latitude < -90 || latitude > 90) {
      throw new McpError(ErrorCode.InvalidParams, 'La latitude doit être entre -90 et 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new McpError(ErrorCode.InvalidParams, 'La longitude doit être entre -180 et 180');
    }

    try {
      // Obtenir les données météo actuelles
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,apparent_temperature,cloud_cover',
          timezone: 'auto',
          forecast_days: 1
        }
      });

      const current = response.data.current;
      const weatherData: WeatherData = {
        location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        temperature: Math.round(current.temperature_2m),
        description: this.translateWeatherCode(current.weather_code, lang),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 3.6),
        pressure: Math.round(current.surface_pressure),
        visibility: 10,
        uvIndex: current.uv_index,
        feelsLike: Math.round(current.apparent_temperature),
        cloudCover: current.cloud_cover
      };

      return {
        content: [
          {
            type: 'text',
            text: `🌤️ **Météo actuelle aux coordonnées ${weatherData.location}**

🌡️ **Température**: ${weatherData.temperature}°C (ressenti ${weatherData.feelsLike}°C)
☁️ **Conditions**: ${weatherData.description}
💧 **Humidité**: ${weatherData.humidity}%
🌪️ **Vent**: ${weatherData.windSpeed} km/h
📊 **Pression**: ${weatherData.pressure} hPa
☁️ **Couverture nuageuse**: ${weatherData.cloudCover}%
${weatherData.uvIndex ? `☀️ **Index UV**: ${weatherData.uvIndex}` : ''}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Impossible d'obtenir la météo pour les coordonnées ${latitude}, ${longitude}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }

  // Méthode pour obtenir la météo (pour intégration HTTP)
  async getWeatherData(city: string, countryCode?: string, lang: string = 'fr') {
    try {
      const location = await this.geocodeCity(city, countryCode);
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          current: 'temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,apparent_temperature,cloud_cover',
          timezone: 'auto',
          forecast_days: 1
        }
      });

      const current = response.data.current;
      return {
        location: location.name,
        temperature: Math.round(current.temperature_2m),
        description: this.translateWeatherCode(current.weather_code, lang),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 3.6),
        pressure: Math.round(current.surface_pressure),
        feelsLike: Math.round(current.apparent_temperature),
        cloudCover: current.cloud_cover,
        uvIndex: current.uv_index
      };
    } catch (error) {
      throw new Error(`Erreur météo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

const server = new WeatherMCPServer();

// Serveur HTTP simple pour intégration avec n8n
const httpServer = createServer(async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url!, `http://${req.headers.host}`);
  
  try {
    // Endpoint de test
    if (url.pathname === '/api/test') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'ok', 
        message: 'Serveur MCP Weather actif',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Endpoint météo simple
    if (url.pathname === '/api/weather' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { city, countryCode, lang = 'fr' } = JSON.parse(body);
          
          if (!city) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Paramètre "city" requis' }));
            return;
          }

          const weatherData = await server.getWeatherData(city, countryCode, lang);
          res.writeHead(200);
          res.end(JSON.stringify(weatherData));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
          }));
        }
      });
      return;
    }

    // Route par défaut
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route non trouvée' }));
    
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Erreur serveur' }));
  }
});

// Démarrage des serveurs
const port = process.env.MCP_SERVER_PORT || 3000;

// Démarrer le serveur HTTP pour n8n
httpServer.listen(port, () => {
  console.error(`HTTP server for n8n integration running on port ${port}`);
});

// Démarrer le serveur MCP
server.run().catch(console.error);
