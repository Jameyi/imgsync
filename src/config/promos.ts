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
];

export const getPromos = (slug: string): Promo[] =>
  PROMOS.filter((promo) => promo.enabled && promoEnabledFor(promo, slug));

const promoEnabledFor = (promo: Promo, slug: string): boolean =>
  promoEnabledSlugs[promo.brand] ? promoEnabledSlugs[promo.brand].includes(slug) : true;

const promoEnabledSlugs: { [brand: string]: string[] } = {
  Photoroom: ["remove-white-background"],
};
