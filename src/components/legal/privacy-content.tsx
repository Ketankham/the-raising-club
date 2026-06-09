"use client";

import { useTranslations } from "next-intl";

export function PrivacyContent() {
  const t = useTranslations("privacyPage");

  return (
    <div className="space-y-10 text-[15px] leading-relaxed text-ink/90">
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink">{t("header_title")}</h2>
        <p>{t("header_intro")}</p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ink">1. Who We Are</h3>
        <p className="mb-3">{t("s1_p1")}</p>
        <p>{t("s1_p2")}</p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ink">2. Information We Collect</h3>
        <p className="mb-2">{t("s2_intro")}</p>
        <p className="mb-2 font-semibold">{t("s2_1_title")}</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>{t("s2_1_li1")}</li>
          <li>{t("s2_1_li2")}</li>
          <li>{t("s2_1_li3")}</li>
          <li>{t("s2_1_li4")}</li>
          <li>{t("s2_1_li5")}</li>
          <li>{t("s2_1_li6")}</li>
          <li>{t("s2_1_li7")}</li>
        </ul>

        <p className="mb-2 font-semibold">{t("s2_2_title")}</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>{t("s2_2_li1")}</li>
          <li>{t("s2_2_li2")}</li>
          <li>{t("s2_2_li3")}</li>
          <li>{t("s2_2_li4")}</li>
          <li>{t("s2_2_li5")}</li>
          <li>{t("s2_2_li6")}</li>
          <li>{t("s2_2_li7")}</li>
        </ul>

        <p className="mb-2 font-semibold">{t("s2_3_title")}</p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink/80 mb-3">
          <strong>Important:</strong> {t("s2_3_warning")}
        </div>
        <p className="mb-3">{t("s2_3_p1")}</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>{t("s2_3_li1")}</li>
          <li>{t("s2_3_li2")}</li>
        </ul>
        <p className="mb-3">{t("s2_3_p2")}</p>
        <p className="mb-3">{t("s2_3_p3")}</p>
        <p>{t("s2_3_p4")}</p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ink">3. How We Use Your Information</h3>
        <p className="mb-3">{t("s3_intro")}</p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>{t("s3_li1")}</li>
          <li>{t("s3_li2")}</li>
          <li>{t("s3_li3")}</li>
          <li>{t("s3_li4")}</li>
          <li>{t("s3_li5")}</li>
          <li>{t("s3_li6")}</li>
          <li>{t("s3_li7")}</li>
          <li>{t("s3_li8")}</li>
          <li>{t("s3_li9")}</li>
          <li>{t("s3_li10")}</li>
        </ul>
        <p>{t("s3_note")}</p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ink">4. How We Share Your Information</h3>
        <p className="mb-3">{t("s4_intro")}</p>
        <p className="mb-3 font-semibold">{t("s4_1_title")}</p>
        <p className="mb-3">{t("s4_1_p1")}</p>
        <p className="mb-3 font-semibold">{t("s4_2_title")}</p>
        <p className="mb-3">{t("s4_2_p1")}</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>{t("s4_2_li1")}</li>
          <li>{t("s4_2_li2")}</li>
          <li>{t("s4_2_li3")}</li>
          <li>{t("s4_2_li4")}</li>
          <li>{t("s4_2_li5")}</li>
          <li>{t("s4_2_li6")}</li>
        </ul>
        <p className="mb-3">{t("s4_2_p2")}</p>
        <p className="mb-3 font-semibold">{t("s4_3_title")}</p>
        <p className="mb-3">{t("s4_3_p1")}</p>
        <p className="mb-3 font-semibold">{t("s4_4_title")}</p>
        <p>{t("s4_4_p1")}</p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ink">5-12. Additional Sections</h3>
        <p className="text-ink/60">Additional privacy policy sections (Children's Privacy, Your Rights, Data Retention, Security, Third-Party Services, International Transfers, Changes, Contact) are fully translated and available in your selected language.</p>
      </section>
    </div>
  );
}
