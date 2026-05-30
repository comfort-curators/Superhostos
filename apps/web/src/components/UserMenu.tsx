import { useUser } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useToast } from "./Toast";

const ITEMS = [
  { label: "Profile", hint: "Manage your account" },
  { label: "Settings", hint: "Workspace preferences", href: "/settings" },
  { label: "Help & docs", hint: "Guides and support" },
] as const;

/** Auth-bound account menu: reflects the signed-in Clerk user. */
export const ClerkAccountMenu = () => {
  const { user } = useUser();
  const name =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Host";
  return <UserMenu name={name} roleLabel="Host" />;
};

export const UserMenu = ({
  name = "Host",
  roleLabel = "Operations",
}: { name?: string; roleLabel?: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 transition-colors hover:bg-sand/50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-ivory">
          {initials}
        </span>
        <span className="hidden text-sm text-ink sm:block">{name}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-medium text-ink">{name}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
            <div className="p-1">
              {ITEMS.map((item) =>
                "href" in item && item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm text-ink hover:bg-sand/50"
                  >
                    {item.label}
                    <span className="block text-xs text-muted">
                      {item.hint}
                    </span>
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      toast.notify(`${item.label} is coming soon`);
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-sand/50"
                  >
                    {item.label}
                    <span className="block text-xs text-muted">
                      {item.hint}
                    </span>
                  </button>
                ),
              )}
            </div>
            <div className="border-t border-line p-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toast.success("Signed out");
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
