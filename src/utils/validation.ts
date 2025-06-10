/**
 * Utilitaires de validation pour les paramètres d'entrée
 */
export class ValidationUtils {
  /**
   * Valide les paramètres de base pour une requête météo
   */
  static validateCityParams(params: any): { city: string; countryCode?: string; lang: string } {
    if (!params.city || typeof params.city !== 'string') {
      throw new Error('Le paramètre "city" est requis et doit être une chaîne de caractères');
    }

    if (
      params.countryCode &&
      (typeof params.countryCode !== 'string' || !/^[A-Z]{2}$/.test(params.countryCode))
    ) {
      throw new Error('Le paramètre "countryCode" doit être un code pays à 2 lettres (ex: FR, GB)');
    }

    const validLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'];
    const lang = params.lang || 'fr';

    if (!validLanguages.includes(lang)) {
      throw new Error(
        `Langue non supportée: ${lang}. Langues disponibles: ${validLanguages.join(', ')}`
      );
    }

    return {
      city: params.city.trim(),
      countryCode: params.countryCode?.toUpperCase(),
      lang,
    };
  }

  /**
   * Valide les paramètres pour les prévisions météo
   */
  static validateForecastParams(params: any): {
    city: string;
    countryCode?: string;
    lang: string;
    days: number;
  } {
    const baseParams = this.validateCityParams(params);

    const days = params.days || 5;
    if (typeof days !== 'number' || days < 1 || days > 7) {
      throw new Error('Le paramètre "days" doit être un nombre entre 1 et 7');
    }

    return { ...baseParams, days: Math.round(days) };
  }

  /**
   * Valide les coordonnées géographiques
   */
  static validateCoordinates(params: any): { latitude: number; longitude: number; lang: string } {
    if (typeof params.latitude !== 'number' || params.latitude < -90 || params.latitude > 90) {
      throw new Error('Le paramètre "latitude" doit être un nombre entre -90 et 90');
    }

    if (typeof params.longitude !== 'number' || params.longitude < -180 || params.longitude > 180) {
      throw new Error('Le paramètre "longitude" doit être un nombre entre -180 et 180');
    }

    const validLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'];
    const lang = params.lang || 'fr';

    if (!validLanguages.includes(lang)) {
      throw new Error(
        `Langue non supportée: ${lang}. Langues disponibles: ${validLanguages.join(', ')}`
      );
    }

    return {
      latitude: params.latitude,
      longitude: params.longitude,
      lang,
    };
  }
}
