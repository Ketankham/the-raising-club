"use client";

import { useLocale } from "next-intl";
import { Membership } from "./membership";
import type { Plan, Tab } from "@/lib/plans/types";

// Direct Spanish translations for membership page content
const SPANISH_TRANSLATIONS: Record<string, string> = {
  // Plan names
  "TRC Community": "Comunidad TRC",
  "TRC Pro Caregiver": "Profesional TRC",
  "TRC Lead Caregiver": "Líder TRC",
  "Family Essentials": "Esenciales Familiares",
  "Family Plus": "Familia Plus",
  "Program Core": "Programa Base",
  "Program Professional": "Programa Profesional",

  // CTAs and labels
  "START HERE": "COMIENZA AQUÍ",
  "GROW AS A PROFESSIONAL": "CRECE COMO PROFESIONAL",
  "LEAD AND SUPPORT OTHERS": "LIDERA Y APOYA A OTROS",
  "Join for Free": "Únete Gratis",
  "Become a TRC Pro Caregiver": "Conviértete en Profesional TRC",
  "Apply as a TRC Lead Caregiver": "Solicita ser Líder TRC",
  "Start Here": "Comienza Aquí",
  "Start as a Member": "Comienza como Miembro",
  "Upgrade to Pro": "Actualiza a Profesional",

  // Descriptions
  "Caregivers and educators starting on TRC, creating a professional profile, and applying to a limited number of roles.": "Cuidadores y educadores que comienzan en TRC, crean un perfil profesional y solicitan un número limitado de empleos.",
  "For career-focused caregivers & educators seeking consistent work and professional verification.": "Para cuidadores y educadores enfocados en su carrera que buscan trabajo consistente y verificación profesional.",
  "For experienced leaders managing pods, mentoring junior educators, or running micro-schools.": "Para líderes experimentados que manejan grupos, mentorizan educadores junior o dirigen microescuelas.",
  "For families beginning their search for quality care and community.": "Para familias que comienzan su búsqueda de cuidado de calidad y comunidad.",
  "For families seeking vetted caregivers and curriculum support.": "Para familias que buscan cuidadores verificados y apoyo curricular.",
  "For organizations building and scaling their staffing network.": "Para organizaciones que construyen y expanden su red de personal.",

  // Features
  "Job access": "Acceso a empleos",
  "Training & badge": "Capacitación y insignia",
  "Verified profile": "Perfil verificado",
  "Community access": "Acceso a la comunidad",
  "Professional verification": "Verificación profesional",
  "Priority job matching": "Emparejamiento de empleos prioritario",
  "Advanced analytics": "Análisis avanzados",
  "Direct family connections": "Conexiones directas con familias",
  "Curriculum resources": "Recursos curriculares",
  "Mentorship program": "Programa de mentoría",
  "Leadership toolkit": "Kit de herramientas de liderazgo",

  // Feature descriptions
  "Apply to a limited number of family and program roles each month.": "Solicita un número limitado de empleos de familia y programa cada mes.",
  "Foundational TRC lessons on safe care and professional practices.": "Lecciones TRC fundamentales sobre cuidado seguro y prácticas profesionales.",
  "TRC-verified profile that appears to families seeking vetted caregivers.": "Perfil verificado por TRC que aparece para familias que buscan cuidadores verificados.",
  "Connect with families in your community exploring quality care.": "Conecta con familias en tu comunidad que exploran cuidado de calidad.",
  "Verified by TRC for consistent work and professional growth.": "Verificado por TRC para trabajo consistente y crecimiento profesional.",
  "Matched with families seeking caregivers with your experience and skills.": "Emparejado con familias que buscan cuidadores con tu experiencia y habilidades.",
  "Real-time insights into your profile views and match rates.": "Información en tiempo real sobre vistas de perfil y tasas de compatibilidad.",
  "Direct communication channels with families you match with.": "Canales de comunicación directa con familias con las que te emparejas.",
  "Access to TRC-curated resources supporting child development.": "Acceso a recursos seleccionados por TRC que apoyan el desarrollo infantil.",
  "Structured guidance from experienced TRC community members.": "Orientación estructurada de miembros experimentados de la comunidad TRC.",
  "Resources for coaching, scheduling, and team management.": "Recursos para coaching, programación y gestión de equipos.",

  // Badges and labels
  "Best value": "Mejor valor",
  "Best for": "Mejor para",
  "Everything in": "Todo en",

  // Price text
  "Free": "Gratis",
  "Gratis": "Gratis",
  "Free forever": "Gratis para siempre",
  "/month": "/mes",
  "/year": "/año",
  "Billed monthly": "Facturado mensualmente",
  "Billed annually": "Facturado anualmente",
};

function translateText(text: string | undefined, locale: string): string | undefined {
  if (!text || locale === "en") return text;
  return SPANISH_TRANSLATIONS[text] || text;
}

function translateFeature(feature: { label: string; body: string }, locale: string): { label: string; body: string } {
  if (locale === "en") return feature;
  return {
    label: translateText(feature.label, locale) || feature.label,
    body: translateText(feature.body, locale) || feature.body,
  };
}

/**
 * Wrapper component that translates plan content using hardcoded Spanish translations
 * Handles: plan names, descriptions, CTAs, features, badges, subtitles
 */
export function TranslatingMembership({ tabs }: { tabs: Tab[] }) {
  const locale = useLocale();

  // If English, use original tabs
  if (locale === "en") {
    return <Membership tabs={tabs} />;
  }

  // Translate all tabs for Spanish
  const translatedTabs = tabs.map((tab) => ({
    ...tab,
    plans: tab.plans.map((plan) => {
      const translatedPlan: Plan = {
        ...plan,
        name: translateText(plan.name, locale) || plan.name,
        subtitle: translateText(plan.subtitle, locale),
        description: translateText(plan.description, locale) || plan.description,
        cta: translateText(plan.cta, locale) || plan.cta,
        badge: translateText(plan.badge, locale),
        features: plan.features.map((f) => translateFeature(f, locale)),
      };
      return translatedPlan;
    }),
  }));

  return <Membership tabs={translatedTabs} />;
}
