/**
 * Every site GIF in one place. Bump GIF_VERSION whenever a GIF file changes: /assets/gif is
 * served with a 1-year immutable cache, so returning visitors would otherwise keep the old file.
 * All GIFs except the loader are encoded to play once and stop on their last frame.
 */
const GIF_VERSION = 'play-once-1';

const gif = (file: string): string => `assets/gif/${file}?v=${GIF_VERSION}`;

export const GIFS = {
  loader: gif('waseela loading gif v5 transparent.gif'),
  hero: gif('header-screen-v2 2.gif'),
  howItWorks: gif('how waseela works.gif'),
  steps: [
    gif('iphone in light blue container.gif'),
    gif('iphone in orange container.gif'),
    gif('Iphone in Blue container.gif'),
  ],
  why: [
    gif('why waseela-fully digital.gif'),
    gif('why waseela-flexible by design.gif'),
    gif('why waseela-clear and transparent.gif'),
    gif('why waseela-trusted.gif'),
    gif('human centered screen.gif'),
  ],
  footerMockup: gif('footer-mockup 1.gif'),
} as const;

/** Loader + hero first so the first screen is ready soonest. */
export const ALL_GIFS: readonly string[] = [
  GIFS.loader,
  GIFS.hero,
  GIFS.howItWorks,
  ...GIFS.steps,
  ...GIFS.why,
  GIFS.footerMockup,
];
