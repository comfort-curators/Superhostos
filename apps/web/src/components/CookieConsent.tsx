import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'cc-cookie-consent';
export type ConsentChoice = 'accepted' | 'essential';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  const decide = (choice: ConsentChoice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* storage unavailable — honour the choice for this session only */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-3xl rounded-2xl border border-line bg-card p-5 shadow-xl md:inset-x-auto md:right-6 md:bottom-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <p className="font-display text-lg text-ink">We value your stay with us</p>
          <p className="mt-1 text-sm text-muted">
            We use cookies to keep you signed in, remember preferences, and understand how SuperhostOS is used. Read our{' '}
            <Link href="/legal/cookies" className="text-gold underline underline-offset-2">Cookie Policy</Link> and{' '}
            <Link href="/legal/privacy" className="text-gold underline underline-offset-2">Privacy Policy</Link>.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => decide('essential')}
              className="rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-sand/50"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="rounded-xl bg-ink px-4 py-2 text-sm text-ivory transition-colors hover:bg-ink/90"
            >
              Accept all cookies
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
