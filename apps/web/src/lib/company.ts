// Single source of truth for company / brand identity used across the app.
export const COMPANY = {
  legalName: 'Comfort Curators Private Limited',
  brand: 'SuperhostOS',
  tagline: 'Curated Stays, Crafted Elegance',
  website: 'https://comfortcurators.in',
  product: 'https://www.superhostos.com',
  email: 'hello@comfortcurators.in',
  supportEmail: 'support@comfortcurators.in',
  jurisdiction: 'India',
  foundedYear: 2024,
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/comfortcurators' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/comfort-curators' },
    { label: 'X', href: 'https://x.com/comfortcurators' }
  ]
} as const;

export const currentYear = new Date().getFullYear();
