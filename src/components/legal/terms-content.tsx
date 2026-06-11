"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const SECTIONS = [
  {
    id: 1,
    title: "s1_title",
    content: [
      { key: "s1_p1", type: "p" },
      { key: "s1_p2", type: "p" },
    ],
  },
  {
    id: 2,
    title: "s2_title",
    content: [
      { key: "s2_p1", type: "p" },
      { key: "s2_p2", type: "p" },
    ],
  },
  {
    id: 3,
    title: "s3_title",
    content: [
      { key: "s3_li1", type: "li" },
      { key: "s3_li2", type: "li" },
      { key: "s3_li3", type: "li" },
      { key: "s3_li4", type: "li" },
      { key: "s3_li5", type: "li" },
    ],
  },
  {
    id: 4,
    title: "s4_title",
    content: [
      { key: "s4_intro", type: "p" },
      { key: "s4_role_parent", type: "li" },
      { key: "s4_role_caregiver", type: "li" },
      { key: "s4_role_org", type: "li" },
      { key: "s4_role_admin", type: "li" },
      { key: "s4_p1", type: "p" },
    ],
  },
  {
    id: 5,
    title: "s5_title",
    content: [
      { key: "s5_p1", type: "p" },
      { key: "s5_p2", type: "p" },
    ],
  },
  {
    id: 6,
    title: "s6_title",
    content: [
      { key: "s6_warning", type: "warning" },
      { key: "s6_p1", type: "p" },
      { key: "s6_p2", type: "p" },
    ],
  },
  {
    id: 7,
    title: "s7_title",
    content: [
      { key: "s7_p1", type: "p" },
      { key: "s7_p2", type: "p" },
      { key: "s7_p3", type: "p" },
    ],
  },
  {
    id: 8,
    title: "s8_title",
    content: [
      { key: "s8_p1", type: "p" },
      { key: "s8_p2", type: "p" },
    ],
  },
  {
    id: 9,
    title: "s9_title",
    content: [
      { key: "s9_p1", type: "p" },
      { key: "s9_p2", type: "p" },
      { key: "s9_p3", type: "p" },
      { key: "s9_p4", type: "p" },
    ],
  },
  {
    id: 10,
    title: "s10_title",
    content: [
      { key: "s10_p1", type: "p" },
      { key: "s10_p2", type: "p" },
      { key: "s10_p3", type: "p" },
    ],
  },
  {
    id: 11,
    title: "s11_title",
    content: [
      { key: "s11_p1", type: "p" },
      { key: "s11_li1", type: "li" },
      { key: "s11_li2", type: "li" },
      { key: "s11_li3", type: "li" },
      { key: "s11_li4", type: "li" },
    ],
  },
  {
    id: 12,
    title: "s12_title",
    content: [
      { key: "s12_p1", type: "p" },
      { key: "s12_li1", type: "li" },
      { key: "s12_li2", type: "li" },
      { key: "s12_li3", type: "li" },
    ],
  },
  {
    id: 13,
    title: "s13_title",
    content: [
      { key: "s13_p1", type: "p" },
      { key: "s13_li1", type: "li" },
      { key: "s13_li2", type: "li" },
      { key: "s13_li3", type: "li" },
      { key: "s13_li4", type: "li" },
      { key: "s13_li5", type: "li" },
      { key: "s13_li6", type: "li" },
    ],
  },
  {
    id: 14,
    title: "s14_title",
    content: [
      { key: "s14_p1", type: "p" },
      { key: "s14_p2", type: "p" },
    ],
  },
  {
    id: 15,
    title: "s15_title",
    content: [
      { key: "s15_p1", type: "p" },
      { key: "s15_li1", type: "li" },
      { key: "s15_li2", type: "li" },
      { key: "s15_li3", type: "li" },
      { key: "s15_li4", type: "li" },
    ],
  },
  {
    id: 16,
    title: "s16_title",
    content: [
      { key: "s16_p1", type: "p" },
      { key: "s16_li1", type: "li" },
      { key: "s16_li2", type: "li" },
      { key: "s16_li3", type: "li" },
      { key: "s16_li4", type: "li" },
      { key: "s16_p2", type: "p" },
    ],
  },
  {
    id: 17,
    title: "s17_title",
    content: [
      { key: "s17_p1", type: "p" },
      { key: "s17_p2", type: "p" },
      { key: "s17_p3", type: "p" },
    ],
  },
  {
    id: 18,
    title: "s18_title",
    content: [
      { key: "s18_intro", type: "p" },
      { key: "s18_li1", type: "li" },
      { key: "s18_li2", type: "li" },
      { key: "s18_li3", type: "li" },
      { key: "s18_li4", type: "li" },
      { key: "s18_li5", type: "li" },
      { key: "s18_li6", type: "li" },
      { key: "s18_li7", type: "li" },
      { key: "s18_li8", type: "li" },
      { key: "s18_li9", type: "li" },
      { key: "s18_li10", type: "li" },
      { key: "s18_li11", type: "li" },
      { key: "s18_p1", type: "p" },
    ],
  },
  {
    id: 19,
    title: "s19_title",
    content: [
      { key: "s19_p1", type: "p" },
      { key: "s19_p2", type: "p" },
      { key: "s19_p3", type: "p" },
    ],
  },
  {
    id: 20,
    title: "s20_title",
    content: [
      { key: "s20_p1", type: "p" },
      { key: "s20_p2", type: "p" },
      { key: "s20_p3", type: "p" },
    ],
  },
  {
    id: 21,
    title: "s21_title",
    content: [{ key: "s21_p1", type: "p" }],
  },
  {
    id: 22,
    title: "s22_title",
    content: [{ key: "s22_p1", type: "p" }],
  },
  {
    id: 23,
    title: "s23_title",
    content: [{ key: "s23_p1", type: "p" }],
  },
  {
    id: 24,
    title: "s24_title",
    content: [
      { key: "s24_p1", type: "p" },
      { key: "s24_p2", type: "p" },
      { key: "s24_p3", type: "p" },
    ],
  },
  {
    id: 25,
    title: "s25_title",
    content: [{ key: "s25_p1", type: "p" }],
  },
  {
    id: 26,
    title: "s26_title",
    content: [
      { key: "s26_p1", type: "p" },
      { key: "s26_p2", type: "p" },
      { key: "s26_p3", type: "p" },
      { key: "s26_p4", type: "p" },
    ],
  },
  {
    id: 27,
    title: "s27_title",
    content: [{ key: "s27_p1", type: "p" }],
  },
  {
    id: 28,
    title: "s28_title",
    content: [{ key: "s28_p1", type: "p" }],
  },
  {
    id: 29,
    title: "s29_title",
    content: [{ key: "s29_p1", type: "p" }],
  },
  {
    id: 30,
    title: "s30_title",
    content: [{ key: "s30_intro", type: "p" }],
  },
];

export function TermsContent() {
  const t = useTranslations("termsPage");

  return (
    <div className="space-y-10 text-[15px] leading-relaxed text-ink/90">
      {SECTIONS.map((section) => (
        <section key={section.id}>
          <h2 className="mb-3 font-display text-xl font-bold text-ink">{t(section.title)}</h2>
          {section.content.map((item, idx) => {
            if (item.type === "warning") {
              return (
                <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink/80">
                  <strong>Important:</strong> {t(item.key)}
                </div>
              );
            } else if (item.type === "li") {
              return <li key={idx} className="list-disc pl-5">{t(item.key)}</li>;
            }
            return (
              <p key={idx} className={idx > 0 ? "mt-3" : ""}>
                {t(item.key)}
              </p>
            );
          })}
        </section>
      ))}

      {/* Identity Verification & Background Checks */}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink">Identity Verification &amp; Background Checks</h2>
        <p className="mb-3">
          The Raising Club offers optional identity verification and background check services to caregivers through our third-party provider,{" "}
          <strong>Authenticate</strong> (authenticate.com). Participation is voluntary. Caregivers who complete verification receive a badge
          visible to families on the platform.
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Consent:</strong> By initiating verification you agree to Authenticate&apos;s terms of service and authorise them to process
            your government-issued photo ID, biometric liveness data, and — if you request a background check — criminal record information.
          </li>
          <li>
            <strong>Data processing:</strong> Authenticate is an independent data processor. The Raising Club receives only a pass/fail status
            and an expiry date. We do not receive or store raw identity documents, biometric templates, or detailed criminal report data.
          </li>
          <li>
            <strong>Red flags:</strong> If a sex-offender registry match is detected, your profile will be immediately depublished and your
            account suspended pending admin review. Criminal records flagged for review are assessed by our Trust &amp; Safety team before any
            action is taken.
          </li>
          <li>
            <strong>Families &amp; organisations:</strong> In the event a caregiver is removed for safety reasons, users who had active
            conversations with that caregiver may receive a notification that the caregiver is no longer available. No reason is disclosed.
          </li>
          <li>
            <strong>Expiry:</strong> Verified badges expire according to the dates set by Authenticate. Caregivers must re-verify when their
            badge expires; families will not see an expired badge.
          </li>
          <li>
            <strong>Limitations:</strong> Verification does not guarantee that a caregiver is suitable for your family. Always conduct your own
            due diligence, including interviews and reference checks, before hiring.
          </li>
        </ul>
      </section>

      {/* Contact section */}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink">{t("s30_title")}</h2>
        <p>{t("s30_intro")}</p>
        <div className="mt-3 rounded-xl bg-white/60 p-5 text-sm">
          <p className="font-semibold text-ink">{t("s30_company")}</p>
          <p className="mt-1">
            {t("s30_email")}{" "}
            <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">
              hello@theraisingclub.com
            </a>
          </p>
          <p>
            {t("s30_safety")}{" "}
            <a href="mailto:safety@theraisingclub.com" className="text-primary hover:underline">
              safety@theraisingclub.com
            </a>
          </p>
          <p>
            {t("s30_website")}{" "}
            <a href="https://theraisingclub.com" className="text-primary hover:underline">
              theraisingclub.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
