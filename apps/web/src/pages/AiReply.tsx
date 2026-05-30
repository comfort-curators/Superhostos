import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { generateGuestReply, type GuestReplyInput } from '../api/client';
import { useToast } from '../components/Toast';

interface Thread {
  guestName: string;
  propertyName: string;
  message: string;
  amenities: string[];
  ago: string;
}

const THREADS: Thread[] = [
  { guestName: 'Sarah K.', propertyName: 'Nobu Penthouse', message: 'Hi! Is there a coffee machine at the property? We arrive tomorrow at 3pm.', amenities: ['Nespresso machine', 'Wifi', 'Pool'], ago: '10 min ago' },
  { guestName: 'Marcus Lee', propertyName: 'Palm Loft', message: "The hot tub isn't heating up. Is there someone we can call?", amenities: ['Hot tub', 'Beach access'], ago: '42 min ago' },
  { guestName: 'Priya Nair', propertyName: 'Cedar Cabin', message: "What's the wifi password? We can't find it anywhere.", amenities: ['Wifi', 'Fireplace', 'Ski storage'], ago: '1 hr ago' }
];

export const AiReplyPage = () => {
  const toast = useToast();
  const [active, setActive] = useState<Thread | null>(null);
  const [draft, setDraft] = useState('');

  const mutation = useMutation({
    mutationFn: (input: GuestReplyInput) => generateGuestReply(input),
    onSuccess: (res) => {
      setDraft(res.reply);
      toast.success(res.provider === 'fallback' ? 'Draft ready (template — connect DO Inference for AI)' : `AI draft ready · ${res.completionTokens} tokens`);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const generate = (thread: Thread) => {
    setActive(thread);
    setDraft('');
    mutation.mutate({ guestName: thread.guestName, propertyName: thread.propertyName, message: thread.message, amenities: thread.amenities });
  };

  return (
    <section className="space-y-4 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-3xl border border-line bg-card p-7 shadow-[0_1px_2px_rgba(27,25,22,0.04)]">
        <h1 className="text-3xl text-ink">AI Guest Messaging</h1>
        <p className="mt-1.5 text-sm text-muted">Generate property-aware replies. Falls back to a template until DigitalOcean Inference is connected.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Recent guest messages</p>
          {THREADS.map((t) => (
            <article key={t.guestName} className={`rounded-2xl border bg-card p-4 ${active?.guestName === t.guestName ? 'border-gold' : 'border-line'}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{t.guestName}</p>
                <span className="text-xs text-muted">{t.ago}</span>
              </div>
              <p className="text-xs text-gold">{t.propertyName}</p>
              <p className="mt-2 text-sm text-ink/80">{t.message}</p>
              <button
                type="button"
                onClick={() => generate(t)}
                disabled={mutation.isPending && active?.guestName === t.guestName}
                className="mt-3 rounded-xl bg-ink px-3 py-1.5 text-xs text-ivory transition-colors hover:bg-ink/90 disabled:opacity-40"
              >
                {mutation.isPending && active?.guestName === t.guestName ? 'Generating…' : 'Generate Reply'}
              </button>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Draft reply</p>
          {active ? (
            <>
              <p className="mt-1 text-xs text-muted">To {active.guestName} · {active.propertyName}</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={mutation.isPending ? 'Generating…' : 'Your reply will appear here — edit before sending.'}
                className="mt-2 h-48 w-full resize-none rounded-xl border border-line bg-ivory p-3 text-sm text-ink focus:border-gold focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <button type="button" disabled={!draft} onClick={() => toast.success('Reply sent (WhatsApp delivery stubbed)')} className="rounded-xl bg-ink px-4 py-2 text-sm text-ivory disabled:opacity-40">Send</button>
                <button type="button" disabled={mutation.isPending} onClick={() => generate(active)} className="rounded-xl border border-line px-4 py-2 text-sm text-ink hover:bg-sand/50">Regenerate</button>
              </div>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-muted">Select a message to generate an AI reply.</p>
          )}
        </div>
      </div>
    </section>
  );
};
