import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | The Raising Club",
  description: "Terms of Service for The Raising Club childcare marketplace, courses, and events platform.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-ink">Terms &amp; Conditions</h1>
            <p className="mt-3 text-sm text-ink/60">Effective date: June 3, 2026 &nbsp;·&nbsp; Last updated: June 3, 2026</p>
            <p className="mt-6 text-ink/80">
              Welcome to The Raising Club. Please read these Terms carefully before using our platform.
              By creating an account or using any part of our services, you agree to be bound by these Terms.
              If you do not agree, do not use The Raising Club.
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-relaxed text-ink/90">

            {/* 1 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">1. About The Raising Club</h2>
              <p>
                The Raising Club (<strong>"TRC," "we," "us,"</strong> or <strong>"our"</strong>) operates a digital platform
                at <strong>theraisingclub.com</strong> that connects families, parents, caregivers, and childcare
                organizations. Our services include a caregiver marketplace, family-to-family community, job
                postings, e-courses, events, messaging, and membership plans (collectively, the <strong>"Platform"</strong>
                or <strong>"Services"</strong>).
              </p>
              <p className="mt-3">
                The Raising Club is organized into two entities: <strong>The Raising Club Marketplace</strong>{" "}
                (theraisingclub.com) and <strong>The Raising Club Foundation</strong> (theraisingclub.org).
                These Terms govern your use of the Marketplace platform.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">2. Acceptance of Terms</h2>
              <p>
                By registering for an account, clicking "Create Account," or otherwise accessing the Platform,
                you confirm that you have read, understood, and agree to these Terms and our{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                These Terms form a legally binding agreement between you and The Raising Club.
              </p>
              <p className="mt-3">
                If you are accepting these Terms on behalf of an organization, school, or other legal entity,
                you represent that you have authority to bind that entity to these Terms.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">3. Eligibility</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>You must be at least <strong>18 years old</strong> to register as a parent, caregiver, or organization.</li>
                <li>The Platform is not directed at, and may not be used by, anyone under 13 years of age. Children's information may only be entered by a parent or legal guardian on their behalf.</li>
                <li>You must provide accurate, current, and complete information during registration and keep it updated.</li>
                <li>You may not create an account if you have been previously banned from the Platform or if applicable law prohibits it.</li>
                <li>By using the Platform, you represent that you meet all eligibility requirements.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">4. Account Types and Roles</h2>
              <p>The Platform has four primary account roles:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong>Parent</strong> — Families seeking childcare, connection with other families, and access to events and courses.</li>
                <li><strong>Caregiver</strong> — Individuals offering childcare, babysitting, nanny, or related services, whether seeking paid work or community connection.</li>
                <li><strong>Organization</strong> — Schools, childcare centers, programs, or other entities offering services or hiring caregivers.</li>
                <li><strong>Admin</strong> — Platform administrators only; provisioned internally by TRC.</li>
              </ul>
              <p className="mt-3">
                Each role has access to different features and is subject to role-specific obligations described throughout these Terms.
                You may hold only one role per account. Role selection is made during onboarding and may not be changed after completion without contacting us.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">5. Account Security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activity
                that occurs under your account. You agree to notify us immediately at{" "}
                <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">hello@theraisingclub.com</a>{" "}
                if you suspect unauthorized access to your account. We are not liable for any loss resulting from unauthorized use of your account.
              </p>
              <p className="mt-3">
                <strong>Anonymous onboarding:</strong> We use a temporary anonymous session for the first steps of onboarding to save your progress
                before you create a permanent account. Once you provide an email and password, your session is upgraded and your progress is preserved.
                Anonymous sessions that are never converted are automatically purged after 14 days.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">6. The Platform — What We Are and Are Not</h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink/80">
                <strong>Important:</strong> The Raising Club is a technology platform and online community — not a childcare agency,
                staffing firm, employer, or background-check service. We do not employ caregivers, place caregivers with families,
                or supervise any childcare arrangements made through the Platform.
              </div>
              <p className="mt-4">
                Families are solely responsible for evaluating, interviewing, selecting, and supervising any caregiver they connect with
                through TRC. Caregivers are independent individuals, not employees or agents of The Raising Club.
                All hiring decisions, compensation arrangements, and employment compliance obligations rest with the hiring party.
              </p>
              <p className="mt-3">
                TRC makes no representation or warranty about the suitability, reliability, safety, or qualifications of any
                caregiver, family, or organization listed on the Platform. Use of the Platform and any resulting engagements are at your own risk.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">7. Caregiver Profiles and Verification</h2>
              <p>
                Caregivers may create a public-facing profile that includes their experience, skills, age groups served, certifications,
                availability, and care settings. Profile information is self-reported by the caregiver and is not independently verified
                by TRC unless explicitly stated.
              </p>
              <p className="mt-3">
                The <strong>"TRC Verified"</strong> and <strong>"TRC Certified Pro"</strong> badges, where displayed, indicate only that
                TRC has processed a third-party verification or credentialing step as described at the time the badge was awarded.
                These badges do not constitute an endorsement of, or guarantee of the fitness, character, or suitability of,
                any individual caregiver. Families should independently verify all credentials, references, and qualifications before engaging any caregiver.
              </p>
              <p className="mt-3">
                Caregivers agree not to misrepresent their experience, qualifications, certifications, or availability.
                TRC reserves the right to remove badges, suspend, or permanently remove profiles that contain inaccurate information.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">8. Background Checks and Safety</h2>
              <p>
                TRC may offer or facilitate access to third-party background check services. Where a background check badge is displayed,
                it reflects a check conducted at a specific point in time by that third party and is subject to the limitations of that service.
                <strong> Background checks are not a guarantee of safety</strong> and may not capture all criminal history, civil records,
                or other relevant information. Check coverage and depth vary by jurisdiction.
              </p>
              <p className="mt-3">
                Families and organizations are strongly encouraged to conduct their own reference checks, interviews, and trial periods
                before engaging any caregiver for ongoing care. TRC accepts no responsibility or liability arising from interactions,
                incidents, or arrangements between users, whether or not a background check was run.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">9. Marketplace — Jobs, Applications, and Hiring</h2>
              <p>
                <strong>Parents and organizations</strong> may post care job listings (the <strong>"Jobs"</strong> feature) describing
                their childcare needs, schedule, compensation range, and other requirements. Job posts are visible to authenticated
                caregivers on the Platform.
              </p>
              <p className="mt-3">
                <strong>Caregivers</strong> may browse open listings and submit applications. Applications may include a cover note
                and proposed rate. Submitting an application does not create any guarantee of employment or engagement.
              </p>
              <p className="mt-3">
                <strong>Co-hire invitations</strong> allow a job owner to invite a caregiver to consider a specific listing collaboratively.
                The caregiver retains full discretion to accept or decline. Accepting a co-hire invitation does not create a binding
                employment contract — that is between the parties directly.
              </p>
              <p className="mt-3">
                TRC is not a party to any hiring arrangement, employment agreement, or compensation negotiation between users.
                All payment, scheduling, and employment terms are set and fulfilled by the parties themselves, outside the Platform.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">10. Connect Families — Community Feature</h2>
              <p>
                The <strong>Connect Families</strong> feature allows parents to create an optional, opt-in family listing to connect
                with other families for playdates, co-hire arrangements, or community support. Family listings are published voluntarily
                and are visible to other authenticated platform users.
              </p>
              <p className="mt-3">
                Family listings include household information you choose to share (care needs, neighborhood, children's age ranges, etc.).
                You control your listing's visibility via the publish toggle. You are responsible for the accuracy of your listing
                and for the safety of any in-person meetups you arrange through the Platform.
              </p>
              <p className="mt-3">
                TRC strongly recommends meeting in public places for first-time connections and using your judgment when arranging
                in-person gatherings with other Platform users.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">11. Events</h2>
              <p>
                TRC and participating organizations may offer events through the Platform. Events may be free or paid.
                For paid events, fees are charged at the time of registration via our payment processor (Stripe).
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong>Capacity:</strong> Events may have limited capacity, tracked per child registered. Registration is confirmed upon payment (for paid events).</li>
                <li><strong>Cancellations by attendee:</strong> Refund eligibility for event cancellations is determined by the event's stated cancellation policy. Unless otherwise stated, event registrations are non-refundable within 48 hours of the event start time.</li>
                <li><strong>Cancellations by organizer:</strong> If an event is cancelled by TRC or the hosting organization, registered attendees will receive a full refund or credit.</li>
                <li><strong>Changes:</strong> Event details (date, time, location, format) may be subject to change. We will notify registered attendees of material changes.</li>
              </ul>
            </section>

            {/* 12 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">12. Courses and Enrollments</h2>
              <p>
                TRC offers e-courses that may be free or paid. Upon purchasing a course, you receive a non-transferable,
                non-exclusive license to access the course content for your personal use.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong>Refunds:</strong> Paid course purchases may be refunded within <strong>48 hours of purchase</strong>, provided you have not completed more than 20% of the course content. After 48 hours, no refunds are issued. To request a refund, contact{" "}
                  <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">hello@theraisingclub.com</a>.
                </li>
                <li><strong>Access:</strong> Course access is granted for the period described at the time of purchase. TRC reserves the right to retire course content with reasonable notice.</li>
                <li><strong>Certificates:</strong> Completion certificates, where offered, are valid for the period stated. TRC does not guarantee that certificates satisfy any regulatory, licensing, or employment requirement.</li>
              </ul>
            </section>

            {/* 13 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">13. Subscriptions, Plans, and Billing</h2>
              <p>
                TRC offers tiered membership plans (including free and paid tiers) that unlock Platform features.
                Plan pricing, features, and availability are managed by TRC and may be updated over time.
                Current plan details are available at <Link href="/membership" className="text-primary hover:underline">/membership</Link>.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong>Billing:</strong> Paid plans are billed through Stripe. By subscribing, you authorize TRC to charge your payment method on a recurring basis at the stated interval (monthly or annual).</li>
                <li><strong>Renewal:</strong> Subscriptions renew automatically unless cancelled before the renewal date. Cancellation takes effect at the end of the current billing period; you retain access until then.</li>
                <li><strong>Price changes:</strong> We will provide at least 30 days' notice before increasing the price of a plan you are currently subscribed to.</li>
                <li><strong>Refunds:</strong> Subscription fees are generally non-refundable except as required by applicable law. If you believe a charge was made in error, contact us within 30 days.</li>
                <li><strong>Comp grants:</strong> TRC may grant complimentary plan access to certain users at its discretion. Comp grants do not carry any cash value and may be revoked.</li>
                <li><strong>Failed payments:</strong> If a payment fails, we may downgrade your account to the free tier and notify you to update your payment method.</li>
              </ul>
            </section>

            {/* 14 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">14. Family / Household Plans</h2>
              <p>
                Some subscription plans support <strong>household membership</strong>, which allows a primary account holder to
                invite additional adults (co-parents, guardians, etc.) to share a family subscription. Invited adults
                join via a separate sign-up link and occupy a seat counted against the plan's household limit.
              </p>
              <p className="mt-3">
                The primary account holder is responsible for the subscription and billing, and accepts these Terms on behalf of
                the household. Each invited adult must independently agree to these Terms upon sign-up.
                Removing a household member terminates their access but does not trigger a pro-rated refund.
              </p>
            </section>

            {/* 15 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">15. Reviews and Ratings</h2>
              <p>
                The Platform allows families and caregivers to leave reviews of each other following a connection or engagement.
                Reviews must be honest, based on first-hand experience, and comply with our community standards.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>You may not post fake, incentivized, or retaliatory reviews.</li>
                <li>Reviews must not include personal contact information, defamatory statements, or content that violates any law.</li>
                <li>TRC may remove reviews that violate these rules but is not obligated to do so and does not verify the accuracy of reviews.</li>
                <li>TRC makes no representation that reviews reflect the complete experience of using any caregiver or family.</li>
              </ul>
            </section>

            {/* 16 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">16. Messaging and Chat</h2>
              <p>
                The Platform includes a private messaging feature for direct communication between matched users.
                Messages are stored on our servers to power the service. By using the chat feature, you agree:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Not to use messaging to solicit or receive payments outside the Platform in violation of any obligation you have to TRC.</li>
                <li>Not to send unsolicited messages, spam, or any content that harasses, threatens, or demeans another user.</li>
                <li>Not to share or solicit personal financial information, passwords, or government ID numbers via chat.</li>
                <li>To treat all communications with other users with respect, consistent with our community standards.</li>
              </ul>
              <p className="mt-3">
                TRC does not actively monitor private messages but reserves the right to review messages in response to a reported
                violation or as required by law.
              </p>
            </section>

            {/* 17 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">17. User Content</h2>
              <p>
                "User Content" means any profile information, photos, listings, job posts, review text, course content (for organization
                accounts), chat messages, or other material you submit to the Platform.
              </p>
              <p className="mt-3">
                You retain ownership of your User Content. By submitting it, you grant TRC a worldwide, non-exclusive, royalty-free
                license to use, host, store, display, and distribute that content solely to operate and improve the Platform.
                This license ends when you delete the content or your account, subject to any legal hold or regulatory obligation.
              </p>
              <p className="mt-3">
                You represent and warrant that you own or have the necessary rights to the content you submit, that it does not
                infringe any third party's intellectual property, and that it complies with these Terms and applicable law.
              </p>
            </section>

            {/* 18 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">18. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Post false, misleading, or fraudulent information on your profile, listings, or reviews.</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
                <li>Harass, threaten, discriminate against, or harm any other user on or off the Platform.</li>
                <li>Solicit or engage in transactions intended to circumvent TRC's payment or subscription systems.</li>
                <li>Scrape, crawl, or systematically collect data from the Platform without written permission.</li>
                <li>Upload or distribute viruses, malware, or other harmful code.</li>
                <li>Use the Platform for any unlawful purpose or in violation of any applicable regulation.</li>
                <li>Attempt to gain unauthorized access to any part of the Platform or another user's account.</li>
                <li>Use the Platform to market competing services or recruit users to a competing platform.</li>
                <li>Post, share, or solicit any content involving the exploitation of minors in any form.</li>
                <li>Use automated tools, bots, or scripts to interact with the Platform.</li>
              </ul>
              <p className="mt-3">
                Violations may result in immediate suspension or permanent termination of your account.
              </p>
            </section>

            {/* 19 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">19. Trust, Safety, and Reporting</h2>
              <p>
                The safety of children and families is our highest priority. If you encounter behavior that you believe
                endangers a child, constitutes abuse, or violates applicable law, you should contact local authorities
                immediately. You may also report the behavior to us at{" "}
                <a href="mailto:safety@theraisingclub.com" className="text-primary hover:underline">safety@theraisingclub.com</a>.
              </p>
              <p className="mt-3">
                TRC reserves the right to cooperate with law enforcement in any investigation involving suspected harm to a child.
                We may suspend or permanently remove any account pending investigation of a safety report.
              </p>
              <p className="mt-3">
                TRC may also suspend or deactivate accounts for any conduct that, in our reasonable judgment, harms the safety,
                integrity, or reputation of our community, even if not explicitly listed as prohibited above.
              </p>
            </section>

            {/* 20 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">20. Termination and Deactivation</h2>
              <p>
                <strong>By you:</strong> You may close your account at any time by contacting us at{" "}
                <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">hello@theraisingclub.com</a>.
                Account closure terminates your access to the Platform and, subject to our data retention policy, leads to deletion
                of your personal data.
              </p>
              <p className="mt-3">
                <strong>By TRC:</strong> We may suspend or permanently deactivate your account, with or without notice, for
                violation of these Terms, non-payment, fraudulent activity, conduct harmful to the community, or any other reason
                at our sole discretion. Deactivated accounts may not re-register without our written permission.
              </p>
              <p className="mt-3">
                Sections that by their nature should survive termination (including Limitation of Liability, Indemnification,
                Dispute Resolution, and Intellectual Property) will survive.
              </p>
            </section>

            {/* 21 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">21. Intellectual Property</h2>
              <p>
                All content, design, software, trademarks, logos, and materials on the Platform (excluding User Content)
                are owned by or licensed to The Raising Club and are protected by intellectual property laws.
                You may not reproduce, distribute, modify, or create derivative works from any part of the Platform
                without our express written consent.
              </p>
            </section>

            {/* 22 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">22. Privacy</h2>
              <p>
                Your use of the Platform is also governed by our{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated
                into these Terms by reference. By using the Platform, you consent to the collection and use of your information
                as described in the Privacy Policy.
              </p>
            </section>

            {/* 23 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">23. Disclaimer of Warranties</h2>
              <p className="uppercase text-xs font-semibold text-ink/60 mb-2">Read carefully</p>
              <p>
                THE PLATFORM IS PROVIDED <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong> WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
                TRC DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS,
                OR THAT ANY CAREGIVER OR FAMILY IS SUITABLE, SAFE, OR FIT FOR YOUR NEEDS.
              </p>
            </section>

            {/* 24 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">24. Limitation of Liability</h2>
              <p className="uppercase text-xs font-semibold text-ink/60 mb-2">Read carefully</p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE RAISING CLUB AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES
                SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR
                RELATED TO YOUR USE OF THE PLATFORM, INCLUDING PERSONAL INJURY, PROPERTY DAMAGE, OR HARM TO A CHILD ARISING FROM
                ANY CAREGIVER ENGAGEMENT ARRANGED THROUGH THE PLATFORM.
              </p>
              <p className="mt-3">
                OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATED TO THESE TERMS OR THE PLATFORM
                SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES YOU PAID TO TRC IN THE 12 MONTHS PRECEDING THE CLAIM,
                OR (B) ONE HUNDRED US DOLLARS ($100).
              </p>
              <p className="mt-3">
                Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In those jurisdictions,
                our liability is limited to the fullest extent permitted by law.
              </p>
            </section>

            {/* 25 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">25. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless The Raising Club and its affiliates, officers, directors,
                employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
                legal fees) arising out of or related to: (a) your use of the Platform; (b) your User Content; (c) your violation
                of these Terms; (d) any childcare arrangement, employment, or interaction with another user that arises from your
                use of the Platform; or (e) your violation of any applicable law.
              </p>
            </section>

            {/* 26 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">26. Dispute Resolution and Arbitration</h2>
              <p>
                <strong>Informal resolution first:</strong> Before filing any formal claim, you agree to contact us at{" "}
                <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">hello@theraisingclub.com</a>{" "}
                and give us 30 days to resolve the issue informally.
              </p>
              <p className="mt-3">
                <strong>Binding arbitration:</strong> If informal resolution fails, any dispute, claim, or controversy arising
                out of or relating to these Terms or the Platform (except as set out below) shall be finally resolved by
                binding individual arbitration under the rules of the American Arbitration Association (AAA) Commercial Arbitration
                Rules, with arbitration conducted in English. The arbitrator's decision will be final and binding and may be
                entered as a judgment in any court of competent jurisdiction.
              </p>
              <p className="mt-3">
                <strong>Exceptions:</strong> Either party may seek emergency injunctive relief in a court of law to prevent
                irreparable harm, and claims related to intellectual property infringement are excluded from arbitration.
              </p>
              <p className="mt-3">
                <strong>Small claims:</strong> Either party may bring a claim in small claims court if the claim qualifies and
                remains in that court.
              </p>
            </section>

            {/* 27 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">27. Class Action Waiver</h2>
              <p>
                <strong>YOU AND TRC AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY,
                AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION, CONSOLIDATED ACTION, OR REPRESENTATIVE
                PROCEEDING.</strong> If this waiver is found unenforceable, the arbitration agreement in Section 26 shall be
                void as to that claim.
              </p>
            </section>

            {/* 28 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">28. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the United States and the State of Delaware, without regard to conflict
                of law principles. Any court proceedings (where permitted under Section 26) shall be brought in the federal or
                state courts located in Delaware.
              </p>
            </section>

            {/* 29 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">29. Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. When we make material changes, we will notify you by email or
                by a prominent notice on the Platform at least 15 days before the changes take effect.
                Your continued use of the Platform after the effective date constitutes your acceptance of the updated Terms.
                If you do not agree to the updated Terms, you must stop using the Platform and may close your account.
              </p>
            </section>

            {/* 30 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">30. Contact Us</h2>
              <p>Questions about these Terms? Reach us at:</p>
              <div className="mt-3 rounded-xl bg-white/60 p-5 text-sm">
                <p className="font-semibold text-ink">The Raising Club</p>
                <p className="mt-1">
                  Email:{" "}
                  <a href="mailto:hello@theraisingclub.com" className="text-primary hover:underline">hello@theraisingclub.com</a>
                </p>
                <p>
                  Safety reports:{" "}
                  <a href="mailto:safety@theraisingclub.com" className="text-primary hover:underline">safety@theraisingclub.com</a>
                </p>
                <p>
                  Website:{" "}
                  <a href="https://theraisingclub.com" className="text-primary hover:underline">theraisingclub.com</a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
