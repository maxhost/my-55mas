// Static site facts (phone numbers, addresses, copyright). Not i18n
// because they are concrete data, not translatable copy. Future:
// expose as a Supabase site_settings table consumed by admin.

export const SITE_CONFIG = {
  phone: '+34930491450',
  phoneDisplay: 'T.930 49 14 50',
  email: 'info@55mas.es',
  whatsappUrl: 'https://wa.me/34930491450',
  offices: [
    {
      key: 'barcelona',
      cityLabel: 'Barcelona',
      address: 'Travessera de Gràcia, 88, Sarrià-Sant Gervasi, 08006 Barcelona, Spain',
    },
    {
      key: 'madrid',
      cityLabel: 'Madrid',
      address: 'Gran Vía, 33, Centro, 28013 Madrid, Spain',
    },
  ],
  copyrightYear: 2026,
  brandName: '55+',
} as const;

export type OfficeKey = (typeof SITE_CONFIG)['offices'][number]['key'];
