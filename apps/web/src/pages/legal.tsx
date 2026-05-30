import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { Link } from "wouter";
import { COMPANY, currentYear } from "../lib/company";

const LegalShell = ({
  title,
  updated,
  children,
}: PropsWithChildren<{ title: string; updated: string }>) => (
  <section className="mx-auto max-w-3xl space-y-6 pb-20">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-line bg-card p-7 shadow-[0_1px_2px_rgba(27,25,22,0.04)]"
    >
      <h1 className="text-3xl text-ink">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">
        Last updated {updated} · {COMPANY.legalName}
      </p>
    </motion.div>
    <article className="space-y-6 rounded-3xl border border-line bg-card p-7 text-sm leading-relaxed text-ink/80">
      {children}
    </article>
    <p className="text-xs text-muted">
      Questions? Write to{" "}
      <a
        href={`mailto:${COMPANY.email}`}
        className="text-gold underline underline-offset-2"
      >
        {COMPANY.email}
      </a>
      . See also{" "}
      <Link
        href="/legal/terms"
        className="text-gold underline underline-offset-2"
      >
        Terms
      </Link>
      ,{" "}
      <Link
        href="/legal/privacy"
        className="text-gold underline underline-offset-2"
      >
        Privacy
      </Link>
      ,{" "}
      <Link
        href="/legal/cookies"
        className="text-gold underline underline-offset-2"
      >
        Cookies
      </Link>
      .
    </p>
  </section>
);

const Clause = ({
  heading,
  children,
}: PropsWithChildren<{ heading: string }>) => (
  <div className="space-y-2">
    <h2 className="text-lg text-ink">{heading}</h2>
    {children}
  </div>
);

export const TermsPage = () => (
  <LegalShell title="Terms & Conditions" updated={`January ${currentYear}`}>
    <p>
      These Terms govern your access to and use of {COMPANY.brand}, the
      hospitality operations platform operated by {COMPANY.legalName} (“
      {COMPANY.brand}”, “we”, “us”). By creating an account or using the service
      you agree to these Terms.
    </p>
    <Clause heading="1. The service">
      <p>
        {COMPANY.brand} provides multi-property operational tooling including
        bookings, predictive inventory, housekeeping, maintenance, vendor
        coordination, guest messaging, and analytics. Features may evolve over
        time.
      </p>
    </Clause>
    <Clause heading="2. Accounts & eligibility">
      <p>
        You are responsible for the activity under your account and for keeping
        your credentials secure. You must be authorised to act on behalf of the
        property or organisation you manage.
      </p>
    </Clause>
    <Clause heading="3. Acceptable use">
      <p>
        You agree not to misuse the service, attempt to disrupt it,
        reverse-engineer it, or use it to violate any law or third-party right.
        Automated access must respect documented rate limits.
      </p>
    </Clause>
    <Clause heading="4. Customer data">
      <p>
        You retain ownership of the data you submit. You grant us a limited
        licence to process it solely to provide and improve the service,
        consistent with our Privacy Policy.
      </p>
    </Clause>
    <Clause heading="5. Fees">
      <p>
        Paid plans are billed in advance and are non-refundable except where
        required by law. We will give reasonable notice of price changes.
      </p>
    </Clause>
    <Clause heading="6. Availability & warranties">
      <p>
        We work hard to keep the service available but provide it “as is”
        without warranties of uninterrupted or error-free operation, to the
        extent permitted by law.
      </p>
    </Clause>
    <Clause heading="7. Limitation of liability">
      <p>
        To the maximum extent permitted by law, our aggregate liability is
        limited to the fees you paid in the twelve months preceding the claim.
      </p>
    </Clause>
    <Clause heading="8. Termination">
      <p>
        You may stop using the service at any time. We may suspend or terminate
        access for material breach of these Terms.
      </p>
    </Clause>
    <Clause heading="9. Governing law">
      <p>
        These Terms are governed by the laws of {COMPANY.jurisdiction}, and the
        courts there have exclusive jurisdiction over any dispute.
      </p>
    </Clause>
  </LegalShell>
);

export const PrivacyPage = () => (
  <LegalShell title="Privacy Policy" updated={`January ${currentYear}`}>
    <p>
      {COMPANY.legalName} respects your privacy. This policy explains what we
      collect, why, and your rights.
    </p>
    <Clause heading="Information we collect">
      <p>
        Account details (name, email, role), operational data you enter
        (properties, bookings, vendors, inventory), and technical data such as
        device, log, and usage information.
      </p>
    </Clause>
    <Clause heading="How we use it">
      <p>
        To provide and secure the service, deliver features such as forecasting
        and messaging, communicate with you, and meet legal obligations. We do
        not sell your personal data.
      </p>
    </Clause>
    <Clause heading="Sharing">
      <p>
        We share data only with processors that help us run the service (e.g.
        hosting, analytics, payment, authentication) under appropriate
        safeguards, or where required by law.
      </p>
    </Clause>
    <Clause heading="Retention">
      <p>
        We keep personal data for as long as your account is active or as needed
        to provide the service and comply with our legal obligations.
      </p>
    </Clause>
    <Clause heading="Your rights">
      <p>
        Subject to applicable law you may access, correct, export, or delete
        your personal data. Contact{" "}
        <a
          href={`mailto:${COMPANY.email}`}
          className="text-gold underline underline-offset-2"
        >
          {COMPANY.email}
        </a>{" "}
        to exercise these rights.
      </p>
    </Clause>
    <Clause heading="Security">
      <p>
        We use encryption in transit, access controls, and audit logging. No
        system is perfectly secure, but we work to protect your information.
      </p>
    </Clause>
  </LegalShell>
);

export const CookiePolicyPage = () => (
  <LegalShell title="Cookie Policy" updated={`January ${currentYear}`}>
    <p>
      This policy explains how {COMPANY.brand} uses cookies and similar
      technologies.
    </p>
    <Clause heading="What cookies are">
      <p>
        Cookies are small files stored on your device. We also use local storage
        to remember preferences such as your consent choice.
      </p>
    </Clause>
    <Clause heading="Categories we use">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Essential</strong> — sign-in, security, and core
          functionality. Always on.
        </li>
        <li>
          <strong>Preferences</strong> — remember settings and layout.
        </li>
        <li>
          <strong>Analytics</strong> — understand usage to improve the product
          (only with your consent).
        </li>
      </ul>
    </Clause>
    <Clause heading="Managing your choice">
      <p>
        You can choose “Essential only” or “Accept all” in the consent banner,
        and clear cookies via your browser at any time. Withdrawing consent may
        limit some features.
      </p>
    </Clause>
  </LegalShell>
);
