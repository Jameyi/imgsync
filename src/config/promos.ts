export type Promo = {
  brand: string;
  body: string;
  href: string;
  enabled: boolean;
};

export const PROMOS: readonly Promo[] = [
  {
    brand: "Photoroom",
    body: "Need AI-grade cutouts beyond local processing — people, hair, complex edges — or instant product staging and AI backgrounds? Photoroom handles the hard scenes automatically.",
    href: "https://refer.photoroom.com/jameyi",
    enabled: true,
  },
  {
    brand: "Fotor",
    body: "Need to polish or batch-edit many images at once, or turn a photo into a designed graphic — social posts, collages, marketing visuals? Fotor's online editor handles templates, batch resizing and design in one place.",
    href: "https://www.fotor.com/?via=jameyi",
    enabled: true,
  },
];

export const getPromos = (slug: string): Promo[] =>
  PROMOS.filter((promo) => promo.enabled && promoEnabledFor(promo, slug));

const promoEnabledFor = (promo: Promo, slug: string): boolean =>
  promoEnabledSlugs[promo.brand] ? promoEnabledSlugs[promo.brand].includes(slug) : true;

const promoEnabledSlugs: { [brand: string]: string[] } = {
  Photoroom: ["remove-white-background"],
  Fotor: ["compress", "resize-to-preset"],
};
