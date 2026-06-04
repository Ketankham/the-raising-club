import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | The Raising Club",
  description: "How The Raising Club collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-ink">Privacy Policy</h1>
            <p className="mt-3 text-sm text-ink/60">Effective date: June 3, 2026 &nbsp;·&nbsp; Last updated: June 3, 2026</p>
            <p className="mt-6 text-ink/80">
              The Raising Club takes your privacy seriously — and the privacy of the children in your care even more so.
              This Privacy Policy explains what information we collect, how we use it, and the choices you have.
              Please read it alongside our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-relaxed text-ink/90">

            {/* 1 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">1. Who We Are</h2>
              <p>
                <strong>The Raising Club</strong> operates the Platform at theraisingclub.com. When we say "we," "us," or "our,"
                we mean The Raising Club Marketplace. We are the data controller for personal information collected through the Platform.
              </p>
              <p className="mt-3">
                Contact us with privacy questions at:{" "}
                <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">2. Information We Collect</h2>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.1 Account and Profile Information</h3>
              <p>When you register, we collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Name (first, last, and any preferred name)</li>
                <li>Email address and password (hashed — we never store your password in plain text)</li>
                <li>Phone number (optional)</li>
                <li>Location — neighborhood, city, ZIP code, or coordinates derived from your search input (via Google Places API)</li>
                <li>Role (parent, caregiver, or organization)</li>
                <li>Profile photo (optional, for caregivers)</li>
                <li>Organization name and job title (for organization accounts)</li>
              </ul>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.2 Caregiver-Specific Profile Data</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Experience, skills, certifications, and care settings (self-reported)</li>
                <li>Age groups served and availability</li>
                <li>Hourly rate range (optional)</li>
                <li>Bio and highlights</li>
                <li>Education and credentials</li>
                <li>Work authorization status (where relevant)</li>
                <li>Background check status (if a background check is run through a third-party provider)</li>
              </ul>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.3 Children's Information</h3>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink/80">
                <strong>We take children's privacy very seriously.</strong> We collect only the minimum information about children
                needed to personalize the experience for parents. We do not allow children to create accounts.
              </div>
              <p className="mt-3">
                Parents may enter the following information about each child in their care:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Birth month and birth year (we do not collect the full date of birth or the child's name)</li>
                <li>A pet name or nickname chosen by the parent (not the child's real name)</li>
              </ul>
              <p className="mt-3">
                This information is used only to calculate age ranges for matching purposes and to personalize the parent's
                onboarding experience. It is never used for advertising, never shared with caregivers in full, and never
                combined with identifying information to create a profile of any child.
              </p>
              <p className="mt-3">
                The Platform is not directed at children under 13. If we learn that we have inadvertently collected personal
                information from a child under 13 without verifiable parental consent, we will delete it promptly.
                If you believe this has occurred, contact us at{" "}
                <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>.
              </p>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.4 Onboarding Progress Data</h3>
              <p>
                Our onboarding flow creates a temporary anonymous session before you create a permanent account. During this session,
                we store your in-progress answers (role selection, preferences, goals) in an onboarding progress record linked to your
                anonymous session. This data is deleted automatically after 14 days if no permanent account is created.
              </p>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.5 Marketplace and Community Activity</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Job postings you create and applications you submit</li>
                <li>Family listings you publish (if you choose to use the Connect Families feature)</li>
                <li>Saved caregivers and families (hearts / saves)</li>
                <li>Co-hire invitations sent and received</li>
                <li>Reviews you write or receive</li>
                <li>Event registrations and course enrollments</li>
              </ul>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.6 Messages and Chat</h3>
              <p>
                Private messages sent through the Platform are stored on our servers to power the messaging feature.
                We do not actively read private messages; however, we may review reported messages in response to a safety
                or conduct complaint, or as required by law.
              </p>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.7 Payment Information</h3>
              <p>
                Payments are processed by <strong>Stripe</strong>. We do not store your full card number, CVV, or bank account
                details on our servers. We receive from Stripe a payment token and basic billing information (last four digits,
                card brand, expiry) needed to display your payment method. Stripe's privacy policy governs how Stripe handles
                your payment data.
              </p>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.8 Usage, Device, and Log Data</h3>
              <p>When you use the Platform, we automatically collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>IP address and approximate location</li>
                <li>Browser type, device type, and operating system</li>
                <li>Pages visited, features used, and time spent</li>
                <li>Referring URLs and search queries within the Platform</li>
                <li>Error logs and crash reports</li>
              </ul>

              <h3 className="mt-5 mb-2 font-semibold text-ink">2.9 Cookies and Similar Technologies</h3>
              <p>
                We use cookies and similar tracking technologies to authenticate your session, remember your preferences,
                and analyze how the Platform is used. You can control cookie preferences through your browser settings.
                Disabling cookies may affect your ability to log in and use certain features.
              </p>
              <p className="mt-2">We use the following types of cookies:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Essential:</strong> Required for authentication, session management, and security. Cannot be disabled.</li>
                <li><strong>Functional:</strong> Remember your preferences and settings.</li>
                <li><strong>Analytics:</strong> Help us understand how users navigate the Platform so we can improve it.</li>
              </ul>
              <p className="mt-2">
                We currently use Supabase for authentication and Stripe for payments; both set their own cookies as necessary
                to deliver their services.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Create and manage your account and provide the Platform's features</li>
                <li>Match caregivers with families based on location, age groups, skills, and availability</li>
                <li>Power the marketplace (job postings, applications, family listings, reviews)</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send transactional communications (account confirmations, booking confirmations, payment receipts)</li>
                <li>Send community updates and newsletters (where you have opted in)</li>
                <li>Respond to your support requests and investigate reported conduct</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Analyze usage to improve Platform features and fix bugs</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mt-3">
                <strong>We do not sell your personal information to third parties.</strong> We do not use your personal
                information or children's information for advertising targeting.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">4. How We Share Your Information</h2>
              <p>We share your information only as described below:</p>

              <h3 className="mt-4 mb-2 font-semibold text-ink">With other Platform users</h3>
              <p>
                Your public profile (for caregivers and published family listings) is visible to other authenticated users.
                For caregivers, we limit what is shown publicly: last name initial only, no email, no phone, no full date
                of birth, and no home address. Contact details are only accessible after a connection is established.
              </p>

              <h3 className="mt-4 mb-2 font-semibold text-ink">With service providers</h3>
              <p>
                We share data with trusted third-party providers who help us operate the Platform, including:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Supabase</strong> — database and authentication hosting</li>
                <li><strong>Stripe</strong> — payment processing</li>
                <li><strong>Vercel</strong> — hosting and infrastructure</li>
                <li><strong>Resend / email provider</strong> — transactional email delivery</li>
                <li><strong>Google</strong> — location/address autocomplete (Places API)</li>
                <li><strong>Background check providers</strong> — where background check services are used</li>
              </ul>
              <p className="mt-2">
                These providers are contractually required to protect your data and may not use it for purposes other than
                providing services to us.
              </p>

              <h3 className="mt-4 mb-2 font-semibold text-ink">For legal reasons</h3>
              <p>
                We may disclose your information when required by law, court order, or governmental authority, or when we
                believe disclosure is necessary to protect the safety of any person, prevent fraud, or enforce our Terms.
              </p>

              <h3 className="mt-4 mb-2 font-semibold text-ink">Business transfers</h3>
              <p>
                If TRC is involved in a merger, acquisition, or sale of assets, your information may be transferred as part
                of that transaction. We will notify you before your data is subject to a different privacy policy.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">5. Children's Privacy (COPPA)</h2>
              <p>
                The Platform is designed for adults (18+). We do not knowingly allow anyone under 13 to create an account
                or directly provide personal information to us.
              </p>
              <p className="mt-3">
                As described in Section 2.3, parents may enter limited information about their children (birth month/year
                and a nickname) during onboarding. This is provided by the parent, not the child, and is used only to
                personalize the parent's experience. We do not:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Collect a child's full name, email, or any direct contact information</li>
                <li>Create profiles for or about children</li>
                <li>Share children's information with third parties for marketing</li>
                <li>Condition a parent's participation on providing more information about their child than is necessary</li>
              </ul>
              <p className="mt-3">
                If you are a parent and believe your child has provided information to us directly, or that we hold more
                information about your child than described above, please contact us at{" "}
                <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>{" "}
                and we will delete it promptly.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">6. Your Privacy Rights</h2>

              <h3 className="mt-4 mb-2 font-semibold text-ink">All users</h3>
              <p>Regardless of where you live, you have the right to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Access</strong> the personal information we hold about you</li>
                <li><strong>Correct</strong> inaccurate information — edit your profile directly from your account settings</li>
                <li><strong>Delete</strong> your account and associated personal data — contact us at{" "}
                  <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>
                </li>
                <li><strong>Withdraw consent</strong> for optional communications at any time by unsubscribing from emails</li>
                <li><strong>Data portability</strong> — request a copy of your data in a portable format</li>
              </ul>

              <h3 className="mt-5 mb-2 font-semibold text-ink">California residents (CCPA / CPRA)</h3>
              <p>
                California residents have additional rights under the California Consumer Privacy Act (CCPA) and California
                Privacy Rights Act (CPRA):
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Right to know</strong> what personal information we collect, use, share, or sell (we do not sell your data)</li>
                <li><strong>Right to delete</strong> your personal information, subject to limited exceptions</li>
                <li><strong>Right to correct</strong> inaccurate personal information</li>
                <li><strong>Right to opt out</strong> of the sale or sharing of personal information (we do not sell or share your data for cross-context behavioral advertising)</li>
                <li><strong>Right to limit</strong> use of sensitive personal information</li>
                <li><strong>Right to non-discrimination</strong> — we will not discriminate against you for exercising these rights</li>
              </ul>
              <p className="mt-3">
                To submit a California privacy rights request, email{" "}
                <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>{" "}
                with the subject line "California Privacy Request." We will respond within 45 days.
              </p>

              <h3 className="mt-5 mb-2 font-semibold text-ink">EEA / UK users (GDPR)</h3>
              <p>
                If you are located in the European Economic Area or United Kingdom, your personal information is processed
                on the following legal bases:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Contract performance</strong> — to provide the Platform services you have requested</li>
                <li><strong>Legitimate interests</strong> — to improve the Platform, detect fraud, and ensure security</li>
                <li><strong>Consent</strong> — for optional communications (newsletters, marketing) where required</li>
                <li><strong>Legal obligation</strong> — to comply with applicable law</li>
              </ul>
              <p className="mt-3">
                You have the right to access, rectify, erase, restrict, or object to processing of your personal data,
                and the right to lodge a complaint with your local supervisory authority. Contact us at{" "}
                <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>{" "}
                to exercise these rights.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">7. Data Retention</h2>
              <p>We retain your personal information for as long as your account is active, and for a reasonable period afterward:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong>Active accounts:</strong> Data is retained while your account exists and for 30 days after closure to allow reactivation.</li>
                <li><strong>Deleted accounts:</strong> Most personal data is deleted within 90 days of account closure. Some data may be retained for longer if required by law (e.g., billing records, dispute resolution).</li>
                <li><strong>Anonymous onboarding sessions:</strong> Purged automatically after 14 days if no permanent account is created.</li>
                <li><strong>Financial records:</strong> Retained for 7 years as required by tax and accounting regulations.</li>
                <li><strong>Safety reports:</strong> May be retained indefinitely where necessary to protect the safety of our community.</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">8. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Encryption of data in transit (TLS/HTTPS) and at rest</li>
                <li>Password hashing — we never store your password in plain text</li>
                <li>Row-Level Security (RLS) on our database — each user can only access their own data</li>
                <li>Role-based access controls limiting which staff can access which data</li>
                <li>Regular security reviews of our codebase and infrastructure</li>
              </ul>
              <p className="mt-3">
                No system is completely secure. If you discover a potential security vulnerability, please report it responsibly
                to <a href="mailto:safety@theraisingclub.com" className="text-primary hover:underline">safety@theraisingclub.com</a>.
              </p>
              <p className="mt-3">
                In the event of a data breach that affects your rights and freedoms, we will notify affected users and relevant
                authorities as required by applicable law.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">9. Third-Party Services and Links</h2>
              <p>
                The Platform integrates with third-party services (Stripe, Google Maps, Supabase, etc.) and may contain
                links to external websites. These third parties have their own privacy policies, and we are not responsible
                for their practices. We encourage you to review the privacy policies of any third-party service you use.
              </p>
              <p className="mt-3">Key third-party privacy policies:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Stripe Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Supabase Privacy Policy
                  </a>
                </li>
              </ul>
            </section>

            {/* 10 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">10. International Data Transfers</h2>
              <p>
                The Raising Club is based in the United States. If you are using the Platform from outside the US,
                your information may be transferred to and stored in the US, where data protection laws may differ
                from those in your country. By using the Platform, you consent to this transfer.
              </p>
              <p className="mt-3">
                For users in the EEA and UK, we implement appropriate safeguards for international transfers, such as
                Standard Contractual Clauses, where required.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we will notify you
                by email or by a prominent notice on the Platform. The date at the top of this page reflects when the
                policy was last updated. Continued use of the Platform after the effective date constitutes acceptance
                of the updated policy.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">12. Contact Us</h2>
              <p>For privacy requests, questions, or concerns:</p>
              <div className="mt-3 rounded-xl bg-white/60 p-5 text-sm">
                <p className="font-semibold text-ink">The Raising Club — Privacy Team</p>
                <p className="mt-1">
                  Email:{" "}
                  <a href="mailto:privacy@theraisingclub.com" className="text-primary hover:underline">privacy@theraisingclub.com</a>
                </p>
                <p>
                  Safety:{" "}
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
