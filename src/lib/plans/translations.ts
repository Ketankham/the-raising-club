// Translations for database-driven plan content
// Maps English plan names/CTAs to Spanish equivalents

export const planTranslations: Record<string, string> = {
  // Plan names and CTAs
  "Families": "Familias",
  "Family": "Familia",
  "Caregiver": "Cuidador",
  "Caregiver & Educator": "Cuidador y Educador",
  "Centers & Programs": "Centros y Programas",

  // Common CTAs
  "Start Free": "Comenzar Gratis",
  "START HERE": "COMIENZA AQUÍ",
  "Get Started": "Comenzar",
  "Join for Free": "Únete Gratis",
  "Sign Up": "Registrarse",

  // Plan descriptions (common phrases)
  "For anyone caring for or spending": "Para cualquiera que cuide o pase tiempo",
  "Connect with families in your community": "Conecta con familias en tu comunidad",
  "professional childcare": "cuidado infantil profesional",
  "earn through referrals": "gana a través de recomendaciones",
  "trusted network": "red de confianza",

  // Feature labels
  "Access to": "Acceso a",
  "Unlimited": "Ilimitado",
  "Priority": "Prioridad",
  "24/7 Support": "Soporte 24/7",
  "Custom": "Personalizado",
  "Free forever": "Gratis por siempre",
};

/**
 * Translate plan content from English to Spanish
 * @param text - The text to translate
 * @param locale - The target locale (default: 'es' for Spanish)
 * @returns The translated text, or original text if no translation found
 */
export function translatePlanContent(text: string | undefined, locale: string = 'en'): string | undefined {
  if (!text || locale !== 'es') return text;

  // Check for exact matches first
  if (planTranslations[text]) {
    return planTranslations[text];
  }

  // For longer text, try to replace known phrases
  let result = text;
  Object.entries(planTranslations).forEach(([en, es]) => {
    result = result.replace(new RegExp(en, 'g'), es);
  });

  return result;
}

/**
 * Translate plan feature object
 */
export function translateFeature(
  feature: { label: string; body: string },
  locale: string = 'en'
): { label: string; body: string } {
  if (locale !== 'es') return feature;

  return {
    label: translatePlanContent(feature.label, locale) || feature.label,
    body: translatePlanContent(feature.body, locale) || feature.body,
  };
}
