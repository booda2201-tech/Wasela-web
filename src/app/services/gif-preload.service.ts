import { Injectable } from '@angular/core';

import { ALL_GIFS, FIRST_SCREEN_GIFS } from '../gif-assets';

/**
 * Downloads every site animation once per page load. First-screen files start immediately;
 * the rest are fetched one at a time after the page `load` event so they never compete with
 * the hero for bandwidth. The Image objects are kept alive so elements that start an
 * animation later get it from memory instead of re-fetching.
 */
@Injectable({ providedIn: 'root' })
export class GifPreloadService {
  private readonly images: HTMLImageElement[] = [];
  private started = false;

  preloadAll(): void {
    if (this.started || typeof Image === 'undefined' || typeof window === 'undefined') {
      return;
    }
    this.started = true;

    FIRST_SCREEN_GIFS.forEach((src) => this.load(src));

    const rest = ALL_GIFS.filter((src) => !FIRST_SCREEN_GIFS.includes(src));
    const startRest = () => this.loadSequentially(rest);
    if (document.readyState === 'complete') {
      startRest();
    } else {
      window.addEventListener('load', startRest, { once: true });
    }
  }

  private loadSequentially(queue: readonly string[], index = 0): void {
    if (index >= queue.length) {
      return;
    }
    const next = () => this.loadSequentially(queue, index + 1);
    const img = this.load(queue[index]);
    img.addEventListener('load', next, { once: true });
    img.addEventListener('error', next, { once: true });
  }

  private load(src: string): HTMLImageElement {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    this.images.push(img);
    return img;
  }
}
