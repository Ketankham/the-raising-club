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
  const [isLoading, setIsLoading] = useState(locale !== "en");

  useEffect(() => {
    // Don't translate for English locale
    if (locale === "en") {
      setTranslatedTabs(tabs);
      setIsLoading(false);
      return;
    }

    // Translate all plan content
    const translateTabs = async () => {
      try {
        const textsToTranslate: string[] = [];
        const textIndexMap: { text: string; tabIdx: number; planIdx: number; field: string }[] = [];

        // Collect all text that needs translation
        tabs.forEach((tab, tabIdx) => {
          tab.plans.forEach((plan, planIdx) => {
            if (plan.name) {
              textsToTranslate.push(plan.name);
              textIndexMap.push({ text: plan.name, tabIdx, planIdx, field: "name" });
            }
            if (plan.subtitle) {
              textsToTranslate.push(plan.subtitle);
              textIndexMap.push({ text: plan.subtitle, tabIdx, planIdx, field: "subtitle" });
            }
            if (plan.description) {
              textsToTranslate.push(plan.description);
              textIndexMap.push({ text: plan.description, tabIdx, planIdx, field: "description" });
            }
            if (plan.cta) {
              textsToTranslate.push(plan.cta);
              textIndexMap.push({ text: plan.cta, tabIdx, planIdx, field: "cta" });
            }
            if (plan.badge) {
              textsToTranslate.push(plan.badge);
              textIndexMap.push({ text: plan.badge, tabIdx, planIdx, field: "badge" });
            }
            plan.features.forEach((feature) => {
              if (feature.label) {
                textsToTranslate.push(feature.label);
                textIndexMap.push({
                  text: feature.label,
                  tabIdx,
                  planIdx,
                  field: `feature_label_${feature.label}`,
                });
              }
              if (feature.body) {
                textsToTranslate.push(feature.body);
                textIndexMap.push({
                  text: feature.body,
                  tabIdx,
                  planIdx,
                  field: `feature_body_${feature.label}`,
                });
              }
            });
          });
        });

        if (!textsToTranslate.length) {
          setIsLoading(false);
          return;
        }

        // Translate all texts
        const translations = await batchTranslate(textsToTranslate, locale);

        // Build translation map
        const translationMap = new Map(
          textsToTranslate.map((text, i) => [text, translations[i]])
        );

        // Apply translations to tabs
        const newTabs = tabs.map((tab, tabIdx) => ({
          ...tab,
          plans: tab.plans.map((plan, planIdx) => {
            const newPlan: Plan = {
              ...plan,
              name: translationMap.get(plan.name) || plan.name,
              subtitle: plan.subtitle ? translationMap.get(plan.subtitle) : plan.subtitle,
              description: translationMap.get(plan.description) || plan.description,
              cta: translationMap.get(plan.cta) || plan.cta,
              badge: plan.badge ? translationMap.get(plan.badge) : plan.badge,
              features: plan.features.map((feature) => ({
                label: translationMap.get(feature.label) || feature.label,
                body: translationMap.get(feature.body) || feature.body,
              })),
            };
            return newPlan;
          }),
        }));

        setTranslatedTabs(newTabs);
      } catch (error) {
        console.error("Error translating plans:", error);
        setTranslatedTabs(tabs);
      } finally {
        setIsLoading(false);
      }
    };

    translateTabs();
  }, [locale, tabs]);

  // Show loading state if still translating
  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-cream py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center py-20">
          <p className="text-ink/60">Cargando planes...</p>
        </div>
      </section>
    );
  }

  return <Membership tabs={translatedTabs} />;
}
