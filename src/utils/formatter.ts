import type { WeatherData, WeatherForecast } from '../types/weather.js';

/**
 * Utilitaires pour formater les réponses météorologiques
 */
export class WeatherFormatter {
  /**
   * Formate les données météorologiques actuelles en texte lisible
   */
  static formatCurrentWeather(weather: WeatherData): string {
    return `🌤️ **Météo actuelle à ${weather.location}**

🌡️ **Température**: ${weather.temperature}°C (ressenti ${weather.feelsLike}°C)
☁️ **Conditions**: ${weather.description}  
💧 **Humidité**: ${weather.humidity}%
🌪️ **Vent**: ${weather.windSpeed} km/h
📊 **Pression**: ${weather.pressure} hPa
☁️ **Couverture nuageuse**: ${weather.cloudCover}%
${weather.uvIndex ? `☀️ **Index UV**: ${weather.uvIndex}` : ''}`;
  }

  /**
   * Formate les prévisions météorologiques en texte lisible
   */
  static formatWeatherForecast(forecasts: WeatherForecast[], location: string): string {
    let result = `📅 **Prévisions météo pour ${location}**\n\n`;

    forecasts.forEach((forecast, index) => {
      const date = new Date(forecast.date);
      const dateStr = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      result += `**${dateStr}**\n`;
      result += `🌡️ ${forecast.temperature.min}°C / ${forecast.temperature.max}°C\n`;
      result += `☁️ ${forecast.description}\n`;
      result += `💧 Humidité: ${forecast.humidity}%\n`;
      result += `🌪️ Vent: ${forecast.windSpeed} km/h\n`;
      result += `🌧️ Précipitations: ${forecast.precipitationProbability}%\n`;

      if (index < forecasts.length - 1) {
        result += '\n---\n\n';
      }
    });

    return result;
  }

  /**
   * Formate un message d'erreur en français
   */
  static formatError(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return `❌ Erreur lors de ${context}: ${message}`;
  }
}
