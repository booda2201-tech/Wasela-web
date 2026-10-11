import { Injectable } from '@angular/core';

import { ALL_GIFS } from '../gif-assets';

/**
 * Downloads every site GIF once per page load. The Image objects are kept alive so
 * elements that start a GIF later get it from memory instantly instead of re-fetching.
 */
@Injectable({ providedIn: 'root' })
export class GifPreloadService {
  private readonly images: HTMLImageElement[] = [];

  preloadAll(): void {
    if (this.images.length || typeof Image === 'undefined') {
      return;
    }
    for (const src of ALL_GIFS) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      this.images.push(img);
    }
  }
}
