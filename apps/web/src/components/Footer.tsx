import { Link } from "wouter";
import { COMPANY, currentYear } from "../lib/company";

export const Footer = () => (
  <footer className="mt-12 border-t border-line px-4 py-8 md:px-10">
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="max-w-sm">
        <p className="font-display text-xl text-ink">
          Superhost<span className="text-gold">OS</span>
        </p>
        <p className="mt-1 text-sm text-muted">{COMPANY.tagline}</p>
        <p className="mt-3 text-xs text-muted">
          A product of {COMPANY.legalName}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
        <nav className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Legal
          </span>
          <Link href="/legal/terms" className="text-ink/70 hover:text-gold">
            Terms &amp; Conditions
          </Link>
          <Link href="/legal/privacy" className="text-ink/70 hover:text-gold">
            Privacy Policy
          </Link>
          <Link href="/legal/cookies" className="text-ink/70 hover:text-gold">
            Cookie Policy
          </Link>
        </nav>
        <nav className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Company
          </span>
          <a
            href={COMPANY.website}
            target="_blank"
            rel="noreferrer"
            className="text-ink/70 hover:text-gold"
          >
            comfortcurators.in
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-ink/70 hover:text-gold"
          >
            Contact
          </a>
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-ink/70 hover:text-gold"
          >
            Support
          </a>
        </nav>
        <nav className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Social
          </span>
          {COMPANY.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="text-ink/70 hover:text-gold"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </div>

    <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
      <span>
        © {COMPANY.foundedYear}–{currentYear} {COMPANY.legalName}. All rights
        reserved.
      </span>
      <span>Made with care in {COMPANY.jurisdiction}.</span>
    </div>
  </footer>
);
