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
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex?: number;
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
}

class WeatherMCPServer {
  private server: Server;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.server = new Server(
      {
        name: 'weather-server',
        version: '1.0.0',
      }
    );

    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY environment variable is required');
    }

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_weather',
            description: 'Obtient les informations météorologiques actuelles pour une ville',
            inputSchema: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                  description: 'Nom de la ville (ex: Paris, London, New York)',
                },
                country: {
                  type: 'string',
                  description: 'Code pays optionnel (ex: FR, US, GB)',
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial', 'kelvin'],
                  description: 'Unités de mesure (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)',
                  default: 'metric',
                },
                lang: {
                  type: 'string',
                  description: 'Langue pour la description (ex: fr, en, es)',
                  default: 'fr',
                },
              },
              required: ['city'],
            },
          },
          {
            name: 'get_weather_forecast',
            description: 'Obtient les prévisions météorologiques sur 5 jours pour une ville',
            inputSchema: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                  description: 'Nom de la ville (ex: Paris, London, New York)',
                },
                country: {
                  type: 'string',
                  description: 'Code pays optionnel (ex: FR, US, GB)',
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial', 'kelvin'],
                  description: 'Unités de mesure (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)',
                  default: 'metric',
                },
                lang: {
                  type: 'string',
                  description: 'Langue pour la description (ex: fr, en, es)',
                  default: 'fr',
                },
              },
              required: ['city'],
            },
          },
          {
            name: 'get_weather_by_coordinates',
            description: 'Obtient les informations météorologiques actuelles par coordonnées GPS',
            inputSchema: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude',
                },
                lon: {
                  type: 'number',
                  description: 'Longitude',
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial', 'kelvin'],
                  description: 'Unités de mesure (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)',
                  default: 'metric',
                },
                lang: {
                  type: 'string',
                  description: 'Langue pour la description (ex: fr, en, es)',
                  default: 'fr',
                },
              },
              required: ['lat', 'lon'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_weather':
            return await this.getCurrentWeather(args);
          case 'get_weather_forecast':
            return await this.getWeatherForecast(args);
          case 'get_weather_by_coordinates':
            return await this.getWeatherByCoordinates(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`
        );
      }
    });
  }

  private async getCurrentWeather(args: any) {
    const { city, country = '', units = 'metric', lang = 'fr' } = args;
    const location = country ? `${city},${country}` : city;

    try {
      const response = await axios.get(`${this.apiUrl}/weather`, {
        params: {
          q: location,
          appid: this.apiKey,
          units,
          lang,
        },
      });

      const data = response.data;
      const weatherData: WeatherData = {
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 0,
      };

      const unitsSymbol = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
      const windUnits = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';

      return {
        content: [
          {
            type: 'text',
            text: `🌤️ Météo actuelle pour ${weatherData.location}:

🌡️ **Température**: ${weatherData.temperature}${unitsSymbol}
☁️ **Description**: ${weatherData.description}
💧 **Humidité**: ${weatherData.humidity}%
🌬️ **Vent**: ${weatherData.windSpeed} ${windUnits}
🏔️ **Pression**: ${weatherData.pressure} hPa
👁️ **Visibilité**: ${weatherData.visibility} km

*Données fournies par OpenWeatherMap*`,
          },
        ],
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Ville introuvable: ${location}`
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Erreur lors de la récupération des données météo: ${error.message}`
      );
    }
  }

  private async getWeatherForecast(args: any) {
    const { city, country = '', units = 'metric', lang = 'fr' } = args;
    const location = country ? `${city},${country}` : city;

    try {
      const response = await axios.get(`${this.apiUrl}/forecast`, {
        params: {
          q: location,
          appid: this.apiKey,
          units,
          lang,
        },
      });

      const data = response.data;
      const forecasts: WeatherForecast[] = [];
      
      // Grouper les prévisions par jour (OpenWeatherMap donne des prévisions toutes les 3h)
      const dailyForecasts = new Map<string, any[]>();
      
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecasts.has(date)) {
          dailyForecasts.set(date, []);
        }
        dailyForecasts.get(date)!.push(item);
      });

      // Prendre les 5 premiers jours
      let count = 0;
      for (const [date, items] of dailyForecasts) {
        if (count >= 5) break;
        
        const temps = items.map(item => item.main.temp);
        const forecast: WeatherForecast = {
          date: new Date(date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          }),
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
          },
          description: items[0].weather[0].description,
          humidity: Math.round(items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length),
          windSpeed: Math.round(items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length * 10) / 10,
        };
        
        forecasts.push(forecast);
        count++;
      }

      const unitsSymbol = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
      const windUnits = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';

      let forecastText = `🗓️ Prévisions météo sur 5 jours pour ${data.city.name}, ${data.city.country}:\n\n`;
      
      forecasts.forEach((forecast, index) => {
        const emoji = index === 0 ? '📅' : '📆';
        forecastText += `${emoji} **${forecast.date}**\n`;
        forecastText += `🌡️ ${forecast.temperature.min}${unitsSymbol} - ${forecast.temperature.max}${unitsSymbol}\n`;
        forecastText += `☁️ ${forecast.description}\n`;
        forecastText += `💧 Humidité: ${forecast.humidity}%\n`;
        forecastText += `🌬️ Vent: ${forecast.windSpeed} ${windUnits}\n\n`;
      });

      forecastText += '*Données fournies par OpenWeatherMap*';

      return {
        content: [
          {
            type: 'text',
            text: forecastText,
          },
        ],
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Ville introuvable: ${location}`
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Erreur lors de la récupération des prévisions météo: ${error.message}`
      );
    }
  }

  private async getWeatherByCoordinates(args: any) {
    const { lat, lon, units = 'metric', lang = 'fr' } = args;

    try {
      const response = await axios.get(`${this.apiUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units,
          lang,
        },
      });

      const data = response.data;
      const weatherData: WeatherData = {
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 0,
      };

      const unitsSymbol = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
      const windUnits = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';

      return {
        content: [
          {
            type: 'text',
            text: `🌤️ Météo actuelle pour ${weatherData.location} (${lat}, ${lon}):

🌡️ **Température**: ${weatherData.temperature}${unitsSymbol}
☁️ **Description**: ${weatherData.description}
💧 **Humidité**: ${weatherData.humidity}%
🌬️ **Vent**: ${weatherData.windSpeed} ${windUnits}
🏔️ **Pression**: ${weatherData.pressure} hPa
👁️ **Visibilité**: ${weatherData.visibility} km

*Données fournies par OpenWeatherMap*`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Erreur lors de la récupération des données météo: ${error.message}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }
}

const server = new WeatherMCPServer();
server.run().catch(console.error);
