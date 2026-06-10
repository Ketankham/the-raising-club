"use client";

import { useLocale } from "next-intl";
import { Membership } from "./membership";
import type { Plan, Tab } from "@/lib/plans/types";

// Direct Spanish translations for membership page content - COMPLETE
const SPANISH_TRANSLATIONS: Record<string, string> = {
  // ===== CAREGIVER PLANS =====
  "TRC Community": "Comunidad TRC",
  "TRC Pro Caregiver": "Profesional TRC",
  "TRC Lead Caregiver": "Líder TRC",

  // Caregiver CTAs
  "START HERE": "COMIENZA AQUÍ",
  "GROW AS A PROFESSIONAL": "CRECE COMO PROFESIONAL",
  "LEAD AND SUPPORT OTHERS": "LIDERA Y APOYA A OTROS",
  "Join for Free": "Únete Gratis",
  "Become a TRC Pro Caregiver": "Conviértete en Profesional TRC",
  "Apply as a TRC Lead Caregiver": "Solicita ser Líder TRC",

  // ===== FAMILY PLANS =====
  "Family Essentials": "Esenciales Familiares",
  "Family Access": "Acceso Familiar",
  "Family Club+": "Club+ Familiar",
  "Family Plus": "Familia Plus",
  "Start as a Member": "Comienza como Miembro",
  "Upgrade to Pro": "Actualiza a Profesional",

  // Family subtitles/CTAs
  "GO DEEPER": "PROFUNDIZA",
  "COORDINATE CARE TOGETHER": "COORDINA EL CUIDADO JUNTOS",
  "Explore TRC": "Explora TRC",
  "Get Family Access": "Obtén Acceso Familiar",
  "Get Family Club+": "Obtén Club+ Familiar",

  // ===== ORGANIZATION/CENTERS PLANS =====
  "Program Core": "Programa Base",
  "Program Professional": "Programa Profesional",
  "Program Growth": "Programa Crecimiento",
  "Program Partner": "Programa Socio",
  "Launch your program": "Lanza tu programa",
  "Scale your organization": "Expande tu organización",
  "Get Started": "Comienza",
  "See How It Works": "Ver cómo funciona",
  "Contact Us": "Contáctanos",

  // Centers subtitle/description text
  "BEST FOR SMALL CENTERS NEEDING ESSENTIAL TOOLS AND BASIC COVERAGE.": "MEJOR PARA CENTROS PEQUEÑOS QUE NECESITAN HERRAMIENTAS ESENCIALES Y COBERTURA BÁSICA.",
  "BEST FOR GROWING PROGRAMS NEEDING VISIBILITY AND ADVANCED TRACKING.": "MEJOR PARA PROGRAMAS EN CRECIMIENTO QUE NECESITAN VISIBILIDAD Y SEGUIMIENTO AVANZADO.",
  "BEST FOR LARGE NETWORKS OR FRANCHISE OPERATORS NEEDING ENTERPRISE SOLUTIONS.": "MEJOR PARA REDES GRANDES U OPERADORES DE FRANQUICIAS QUE NECESITAN SOLUCIONES EMPRESARIALES.",

  // ===== PLAN DESCRIPTIONS =====
  // Caregiver descriptions
  "Caregivers and educators starting on TRC, creating a professional profile, and applying to a limited number of roles.": "Cuidadores y educadores que comienzan en TRC, crean un perfil profesional y solicitan un número limitado de empleos.",
  "For career-focused caregivers & educators seeking consistent work and professional verification.": "Para cuidadores y educadores enfocados en su carrera que buscan trabajo consistente y verificación profesional.",
  "For experienced leaders managing pods, mentoring junior educators, or running micro-schools.": "Para líderes experimentados que manejan grupos, mentorizan educadores junior o dirigen microescuelas.",

  // Family descriptions
  "For families beginning their search for quality care and community.": "Para familias que comienzan su búsqueda de cuidado de calidad y comunidad.",
  "For anyone caring for or spending time with a child—parents, grandparents, aunts, uncles—who wants to understand the basics of child development and explore The Raising Club's events and community at their own pace.": "Para cualquiera que cuide o pase tiempo con un niño—padres, abuelos, tías, tíos—que quiera entender los conceptos básicos del desarrollo infantil y explorar los eventos y la comunidad de The Raising Club a su propio ritmo.",
  "For families who want deeper learning, and to start connecting with other families and caregivers as part of everyday family life.": "Para familias que desean aprendizaje más profundo y comenzar a conectar con otras familias y cuidadores como parte de la vida familiar cotidiana.",
  "For families coordinating care with others—including nanny shares, shared-care setups, or extended family—who want a more integrated way of doing things together.": "Para familias que coordinan el cuidado con otros—incluyendo servicios de niñera compartida, arreglos de cuidado compartido o familia extendida—que desean una forma más integrada de hacer las cosas juntos.",
  "For families seeking vetted caregivers and curriculum support.": "Para familias que buscan cuidadores verificados y apoyo curricular.",

  // Organization descriptions
  "For organizations building and scaling their staffing network.": "Para organizaciones que construyen y expanden su red de personal.",

  // ===== FEATURE LABELS =====
  // Caregiver features
  "Job access": "Acceso a empleos",
  "Training & badge": "Capacitación y insignia",
  "Verified profile": "Perfil verificado",
  "Community access": "Acceso a la comunidad",
  "Professional verification": "Verificación profesional",
  "Priority job matching": "Emparejamiento de empleos prioritario",
  "Advanced analytics": "Análisis avanzados",
  "Mentorship program": "Programa de mentoría",
  "Leadership toolkit": "Kit de herramientas de liderazgo",
  "Community & growth": "Comunidad y crecimiento",

  // Family features
  "Caregiver search": "Búsqueda de cuidadores",
  "Curriculum resources": "Recursos curriculares",
  "Vetting & verification": "Verificación y validación",

  // Organization features
  "Job posting": "Publicación de empleos",
  "Staff directory": "Directorio de personal",
  "Team management": "Gestión de equipo",

  // ===== FEATURE DESCRIPTIONS =====
  // Caregiver feature descriptions
  "Apply to a limited number of family and program roles each month.": "Solicita un número limitado de empleos de familia y programa cada mes.",
  "Foundational TRC lessons on safe care and professional practices.": "Lecciones TRC fundamentales sobre cuidado seguro y prácticas profesionales.",
  "Standard caregiver profile visible to families and programs.": "Perfil de cuidador estándar visible para familias y programas.",
  "Connect with families in your community exploring quality care.": "Conecta con familias en tu comunidad que exploran cuidado de calidad.",
  "Verified by TRC for consistent work and professional growth.": "Verificado por TRC para trabajo consistente y crecimiento profesional.",
  "Access to the full range of roles, including leadership opportunities, pods, and TRC-led initiatives.": "Acceso a la gama completa de empleos, incluyendo oportunidades de liderazgo, grupos y iniciativas dirigidas por TRC.",
  "Structured TRC training with verified badges that make your skills visible to families and programs.": "Capacitación estructurada de TRC con insignias verificadas que hacen visible tus habilidades ante familias y programas.",
  "Enhanced profile visibility, prioritized for better-aligned family and program roles.": "Visibilidad mejorada del perfil, priorizado para empleos de familia y programa mejor alineados.",
  "Real-time insights into your profile views and match rates.": "Información en tiempo real sobre vistas de perfil y tasas de compatibilidad.",
  "Structured guidance from experienced TRC community members.": "Orientación estructurada de miembros experimentados de la comunidad TRC.",
  "Lead pods, circles, and learning spaces, and support the growth of other caregivers.": "Lidera grupos, círculos y espacios de aprendizaje, y apoya el crecimiento de otros cuidadores.",
  "Resources for coaching, scheduling, and team management.": "Recursos para coaching, programación y gestión de equipos.",

  // Family feature descriptions
  "Foundational TRC guidance on child development.": "Orientación fundamental de TRC sobre desarrollo infantil.",
  "Search for vetted caregivers matching your needs and values.": "Busca cuidadores verificados que coincidan con tus necesidades y valores.",
  "Everything in Family Essentials, plus the full A Raising Approach™ (one-on-one care) framework to raise a child with structure and purpose.": "Todo en Esenciales Familiares, más el marco completo del Enfoque A Raising™ (cuidado uno a uno) para criar a un niño con estructura y propósito.",
  "Everything in Family Access, plus the A Raising Approach™ (shared care) framework, community support, and guidance for coordinating care with nanny shares and extended family.": "Todo en Acceso Familiar, más el marco del Enfoque A Raising™ (cuidado compartido), apoyo comunitario y orientación para coordinar el cuidado con servicios de niñera compartida y familia extendida.",
  "Access to TRC-curated resources supporting child development.": "Acceso a recursos seleccionados por TRC que apoyan el desarrollo infantil.",
  "Direct communication channels with families you match with.": "Canales de comunicación directa con cuidadores verificados.",
  "Learning & guidance": "Aprendizaje y orientación",
  "Community & support": "Comunidad y apoyo",

  // Organization feature descriptions
  "Post unlimited job listings and connect with qualified caregivers.": "Publica ofertas de empleo ilimitadas y conecta con cuidadores calificados.",
  "Build your team directory with verified staff members.": "Construye tu directorio de equipo con miembros del personal verificados.",
  "Tools for scheduling, payroll, and staff communication.": "Herramientas para programación, nómina y comunicación del personal.",

  // Organization plan descriptions
  "Home daycares and single-site programs building a stable, aligned team.": "Guarderías en el hogar y programas de un solo sitio que construyen un equipo estable y alineado.",
  "Multi-site networks and chains standardizing hiring and training across locations.": "Redes multi-sitio y cadenas que estandarizan la contratación y capacitación en diferentes ubicaciones.",
  "Custom pricing. Get in touch to design your program.": "Precio personalizado. Contáctanos para diseñar tu programa.",

  // Organization features (expanded)
  "Training seats & tracking": "Asientos de capacitación y seguimiento",
  "Starter training seats to onboard staff into TRC foundations (up to 4 staff members).": "Asientos de capacitación inicial para incorporar personal a los fundamentos de TRC (hasta 4 miembros del personal).",
  "Director dashboard to assign, track, and verify courses and badges (up to 10 staff members).": "Panel director para asignar, rastrear y verificar cursos e insignias (hasta 10 miembros del personal).",
  "Custom training seats with advanced reporting and a co-branded learning hub (seat count tailored to your program).": "Asientos de capacitación personalizados con informes avanzados y un centro de aprendizaje co-marcado (recuento de asientos adaptado a tu programa).",

  // ===== BADGES AND LABELS =====
  "Best value": "Mejor valor",
  "Best for": "Mejor para",
  "Everything in": "Todo en",
  "Visibility": "Visibilidad",

  // ===== PRICING TEXT =====
  "Free": "Gratis",
  "Gratis": "Gratis",
  "Free forever": "Gratis para siempre",
  "/month": "/mes",
  "/month per site": "/mes por sitio",
  "/year": "/año",
  "Billed monthly": "Facturado mensualmente",
  "Billed annually": "Facturado anualmente",
  "Save 15%": "Ahorra 15%",
  "per month": "por mes",
  "per site": "por sitio",
  "Monthly": "Mensual",
  "Annual": "Anual",
  "Ahorra 15%": "Ahorra 15%",
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
