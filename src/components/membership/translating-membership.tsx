"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Membership } from "./membership";
import { batchTranslate } from "@/lib/google-translate";
import type { Plan, Tab, Feature } from "@/lib/plans/types";

/**
 * Wrapper component that translates plan content before rendering
 * Handles: plan names, descriptions, CTAs, features, badges, subtitles
 */
export function TranslatingMembership({ tabs }: { tabs: Tab[] }) {
  const locale = useLocale();
  const [translatedTabs, setTranslatedTabs] = useState<Tab[]>(tabs);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Don't translate for English locale
    if (locale === "en") {
      setTranslatedTabs(tabs);
      setIsTranslating(false);
      return;
    }

    // Show membership immediately while translating in background
    setTranslatedTabs(tabs);
    setIsTranslating(true);

    // Translate all plan content in background
    const translateTabs = async () => {
      try {
        const textsToTranslate: string[] = [];

        // Collect all text that needs translation (deduplicated)
        const uniqueTexts = new Set<string>();
        tabs.forEach((tab) => {
          tab.plans.forEach((plan) => {
            if (plan.name) uniqueTexts.add(plan.name);
            if (plan.subtitle) uniqueTexts.add(plan.subtitle);
            if (plan.description) uniqueTexts.add(plan.description);
            if (plan.cta) uniqueTexts.add(plan.cta);
            if (plan.badge) uniqueTexts.add(plan.badge);
            plan.features.forEach((feature) => {
              if (feature.label) uniqueTexts.add(feature.label);
              if (feature.body) uniqueTexts.add(feature.body);
            });
          });
        });

        textsToTranslate.push(...Array.from(uniqueTexts));

        if (!textsToTranslate.length) {
          setIsTranslating(false);
          return;
        }

        console.log(`[Translation] Translating ${textsToTranslate.length} unique texts to ${locale}`);

        // Translate all texts
        const translations = await batchTranslate(textsToTranslate, locale);

        // Build translation map
        const translationMap = new Map(
          textsToTranslate.map((text, i) => [text, translations[i]])
        );

        // Apply translations to tabs
        const newTabs = tabs.map((tab) => ({
          ...tab,
          plans: tab.plans.map((plan) => {
            const newPlan: Plan = {
              ...plan,
              name: translationMap.get(plan.name) || plan.name,
              subtitle: plan.subtitle ? translationMap.get(plan.subtitle) || plan.subtitle : plan.subtitle,
              description: translationMap.get(plan.description) || plan.description,
              cta: translationMap.get(plan.cta) || plan.cta,
              badge: plan.badge ? translationMap.get(plan.badge) || plan.badge : plan.badge,
              features: plan.features.map((feature) => ({
                label: translationMap.get(feature.label) || feature.label,
                body: translationMap.get(feature.body) || feature.body,
              })),
            };
            return newPlan;
          }),
        }));

        console.log(`[Translation] Successfully translated ${textsToTranslate.length} texts`);
        setTranslatedTabs(newTabs);
      } catch (error) {
        console.error("[Translation] Error translating plans:", error);
        // Silently fail - membership already shown in original language
      } finally {
        setIsTranslating(false);
      }
    };

    translateTabs();
  }, [locale, tabs]);

  return <Membership tabs={translatedTabs} />;
}
