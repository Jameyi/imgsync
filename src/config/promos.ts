export type Promo = {
  brand: string;
  body: string;
  href: string;
  enabled: boolean;
};

export const PROMOS: readonly Promo[] = [
  {
    brand: "remove.bg",
    body: "Need photos with people, hair or complex objects removed? remove.bg handles the hard cutouts automatically.",
    href: "https://www.remove.bg/",
    enabled: false,
  },
];

export const getPromos = (slug: string): Promo[] =>
  PROMOS.filter((promo) => promo.enabled && promoEnabledFor(promo, slug));

const promoEnabledFor = (promo: Promo, slug: string): boolean =>
  promoEnabledSlugs[promo.brand] ? promoEnabledSlugs[promo.brand].includes(slug) : true;

const promoEnabledSlugs: { [brand: string]: string[] } = {
  "remove.bg": ["remove-white-background"],
};
