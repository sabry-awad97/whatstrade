/**
 * Simulate Constants
 *
 * Centralized configuration for simulation page.
 */

export const SAMPLE_MESSAGES = [
  "عندي باندول اكسترا 500 مجم 300 حبة بسعر 13 جنيه للحبة، دلوقتي متاح",
  "محتاج اوجمنتين 625 مجم مش اقل من 200 حبة، السعر اقصاه 90 جنيه",
  "متوفر نيكسيوم 40 مجم 150 حبة بسعر 90 جنيه للحبة واحدة",
  "عايز برفين 400 مجم حوالي 200 قرص، الاسعار المتاحة؟",
  "عندي امبيسلين 500 250 حبة بسعر 18 للحبة مهتمين يتواصلوا",
];

export const BAND_COLORS: Record<string, string> = {
  auto: "hsl(142 72% 35%)",
  suggest: "hsl(38 92% 50%)",
  review: "hsl(21 85% 50%)",
  none: "hsl(0 72% 48%)",
};

export const BAND_COLORS_ALPHA: Record<
  string,
  { base: string; light: string; subtle: string; glow: string }
> = {
  auto: {
    base: "hsl(142 72% 35%)",
    light: "hsl(142 72% 35% / 0.25)",
    subtle: "hsl(142 72% 35% / 0.125)",
    glow: "hsl(142 72% 35% / 0.5)",
  },
  suggest: {
    base: "hsl(38 92% 50%)",
    light: "hsl(38 92% 50% / 0.25)",
    subtle: "hsl(38 92% 50% / 0.125)",
    glow: "hsl(38 92% 50% / 0.5)",
  },
  review: {
    base: "hsl(21 85% 50%)",
    light: "hsl(21 85% 50% / 0.25)",
    subtle: "hsl(21 85% 50% / 0.125)",
    glow: "hsl(21 85% 50% / 0.5)",
  },
  none: {
    base: "hsl(0 72% 48%)",
    light: "hsl(0 72% 48% / 0.25)",
    subtle: "hsl(0 72% 48% / 0.125)",
    glow: "hsl(0 72% 48% / 0.5)",
  },
};

export const BAND_BG: Record<string, string> = {
  auto: "bg-band-auto",
  suggest: "bg-band-suggest",
  review: "bg-band-review",
  none: "bg-band-none",
};
