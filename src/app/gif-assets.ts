/**
 * Every site animation in one place. Bump ANIM_VERSION whenever a file changes: /assets/gif is
 * served with a 1-year immutable cache, so returning visitors would otherwise keep the old file.
 * All animations except the loader are animated WebP encoded to play once and stop on their
 * last frame (same frames and timing as the original GIFs, at a fraction of the size).
 */
const ANIM_VERSION = 'webp-1';

const gif = (file: string): string => `assets/gif/${file}?v=${ANIM_VERSION}`;

export const GIFS = {
  loader: gif('waseela loading gif v5 transparent.gif'),
  hero: gif('header-screen-v2 2.webp'),
  howItWorks: gif('how waseela works.webp'),
  steps: [
    gif('iphone in light blue container.webp'),
    gif('iphone in orange container.webp'),
    gif('Iphone in Blue container.webp'),
  ],
  why: [
    gif('why waseela-fully digital.webp'),
    gif('why waseela-flexible by design.webp'),
    gif('why waseela-clear and transparent.webp'),
    gif('why waseela-trusted.webp'),
    gif('human centered screen.webp'),
  ],
  footerMockup: gif('footer-mockup 1.webp'),
} as const;

/** Fetched immediately; everything else waits for the page `load` event. */
export const FIRST_SCREEN_GIFS: readonly string[] = [GIFS.loader, GIFS.hero];

/** Page order, so sections near the top are ready first. */
export const ALL_GIFS: readonly string[] = [
  GIFS.loader,
  GIFS.hero,
  GIFS.howItWorks,
  ...GIFS.steps,
  ...GIFS.why,
  GIFS.footerMockup,
];
