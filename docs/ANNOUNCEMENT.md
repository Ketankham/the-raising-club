# Introducing The Raising Club — one club for care, learning, and community

**More than childcare.** The Raising Club brings together everything modern families and caregivers need in a single, trusted place: a marketplace to find and offer care, a learning platform to grow real caregiving skills, and a calendar of community events to gather and grow together. Underpinning all of it is a serious approach to trust and safety.

Here's everything that's live.

---

## 🫒 Marketplace — find care, find work, find your people

The Marketplace is a three-sided network connecting **families**, **caregivers** (nannies, sitters, and childcare professionals), and **organizations** (schools, centers, and programs). It's more than a job board — it supports family-to-family connections and co-hiring too.

**Five ways to connect:** Parent ↔ Caregiver, Caregiver ↔ Job, Organization ↔ Caregiver, Parent ↔ Parent (community & co-hire), and Caregiver ↔ Caregiver.

**For families**
- **Post a job** with everything that matters: care type (Home & Family, Small Groups, Schools & Centers), children's ages, schedule, pay range, hours, number of openings, location, start date, and desired skills. Save as a draft or post it live.
- **Browse caregivers** with rich profiles — ratings and reviews, hourly rate, experience, distance, skills, and trust badges — and **invite** the ones you like.
- **Publish a family listing** to meet other families for playdates, nanny shares, and co-hiring — or keep it private as a draft.
- **Review applicants** and move them through your pipeline: shortlist, hire, or decline.

**For caregivers**
- **Browse and apply to jobs** with a personal cover note and your proposed rate.
- **Build a profile** that shows your experience, skills, rate, and verification badges.
- **Track your applications** and receive **co-hire invitations** from families you can accept or decline.

**For everyone**
- **Built-in messaging** — a full two-pane chat with unread badges, message previews, and read receipts, so conversations stay on-platform.
- **Smart filters** — keyword search, care-type chips, a child-age slider, location/ZIP search, and Trust & Safety toggles for *Identity Verified* and *Background Checked*.
- **Save favorites** — heart any caregiver, family, or job to revisit later.

**Co-hiring made simple.** From any caregiver's profile, a family can open **Invite to Co-Hire**, pick one or more of their open jobs, add a note, and send — the foundation for nanny shares between families.

> A safety-first touch: if you try to shortlist or hire a caregiver who hasn't been identity-verified yet, the app gently nudges you to ask them to verify first — while still letting you proceed if you choose.

---

## 🎓 Learning — grow your caregiving skills, earn a certificate

The Raising Club's learning platform is a warm, self-paced home for professional growth in early childhood and caregiving. No rush, no judgment — just real skills and a certificate to show for it.

**For learners**
- **A rich course catalog** of courses and **Learning Paths** (bundles), filterable by category, approach, care type, skills, and child age.
- **A beautiful course player** — intro videos, rich lesson content, downloadable resources, and a live progress path through chapters and modules.
- **"Pause & Notice"** — gentle, optional reflection prompts between modules. They're for you, not a test.
- **The "Integration Moment"** — a final, encouraging assessment with **unlimited attempts** and a supportive "not yet" for retries, rather than a hard fail. Courses without a quiz simply certify on completion.
- **A verifiable Certificate of Completion** — with your name, the course, a certificate ID, and a **QR code** that anyone can scan to confirm it's genuine at a public verification page. Share it or **download it as a PDF**.
- **My Courses** — your personal dashboard of what's in progress, completed, and available to revisit.

**For teams and organizations**
- **One purchase seats the whole team.** When someone in an organization buys a course, every active member is automatically enrolled for free.
- **A Team Learning view** shows each member's progress, completion, and certificates at a glance.

**For authors and admins**
- **A four-step course editor** — details and pricing, chapters and modules (with a full rich-text editor, videos, and resources), the quiz builder, and certificate signers.
- **Learning Paths** to bundle courses together, **enrollee management** with per-learner refunds, and a **learner-preview mode** to experience a course before publishing.

**Simple, fair pricing.** Free courses are one-click. Paid courses use secure **Stripe** checkout, with a **48-hour self-serve refund window** — no hassle.

---

## 🗓️ Events — spaces to gather and grow together

Events are community gatherings for families — playdates, classes, workshops, open-play, and ongoing series, offered **in-person, online, or hybrid**.

**Discover**
- **A searchable, filterable events grid** with a **"Near me"** button that sorts by distance, plus filters for age, price, join mode, who attends, dates, and event style.
- **Detailed event pages** — what to expect, your hosts, the schedule, location and directions (or how to join online), live enrollment counts, and clear cancellation terms.
- **Save events** to come back to them later.

**Register in minutes — no sign-in wall**
- **Register first, sign up later.** Guests can start registering immediately; we quietly create a session and let you upgrade to a full account mid-flow, finishing onboarding whenever suits you.
- **A thoughtful registration wizard** — choose who's attending (add your children or an adult count), share contact details, and flag any **support needs** (sensory, allergies, medical, and more) so hosts can prepare. **Drop-off events** collect emergency contacts and authorized pickup.
- **Consent handled with care** — participation waivers and an explicit photo/video **media-release** choice, built right in.
- **Free events confirm instantly; paid events** check out securely via **Stripe** with emailed receipts. Self-cancel any time before the cutoff.
- **My Events** keeps your upcoming and past registrations, with clear status badges.

**For organizers**
- **A complete event editor** — format and eligibility, timezone-correct scheduling, physical or digital location, resources, instructors, pricing, capacity, plus toggles for *requires approval*, *waitlist*, and *featured*. (Prices lock once published to protect existing registrants.)
- **Roster & attendance** — approve or deny requests, see support-needs flags and emergency details, cancel-and-refund, and mark check-in status (Registered / Attended / No-show).
- **CSV export** of your full roster, and a **two-way message inbox** to reach attendees (with unread tracking).

---

## 🛡️ Trust & Safety — the Authenticate API

Trust is the foundation of everything above, and we don't take it on faith. The Raising Club integrates the **Authenticate™ / Medallion™** identity platform to verify the people in our community.

**What it does**
- **Identity verification** — government-ID checks with liveness detection to confirm a caregiver is who they say they are.
- **Background checks** and a **risk score** for an added layer of confidence.
- **Two badges** surface the results across the app — **Identity Verified** and **Background Checked** — visible on profiles and usable as search filters, so families can choose to connect only with verified caregivers.

**How it works under the hood**
- Caregivers complete verification through a **secure hosted flow**; results flow back automatically via **webhooks**, so badges update the moment a check clears — no manual steps.
- Verification status is woven throughout the marketplace: it powers the filter toggles and the safety nudge shown before shortlisting or hiring an unverified caregiver.

> *A quick clarification on names:* in the product, **"Authenticate"** refers specifically to this third-party **verification** service. It's separate from how you **log in** — see the note below.

---

## A note on accounts & sign-in

Signing in is powered by **Supabase Auth** with secure, cookie-based sessions. We support **email + password** plus a friendly **guest/anonymous session** that makes the "register first, finish later" experience possible across events and onboarding — your progress is saved and resumable even before you've created a full account. Access is protected end-to-end by database row-level security and role-aware permissions for parents, caregivers, organizations, and admins.

---

**The Raising Club** — trusted care for families, real careers for caregivers, and reliable staffing and training for the programs that serve them. All inside one club.
