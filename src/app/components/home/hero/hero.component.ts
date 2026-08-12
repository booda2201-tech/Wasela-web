import { Component, OnDestroy } from '@angular/core';

import { AppStoreLinkService } from '../../../services/app-store-link.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnDestroy {
  readonly heroGifSrc = 'assets/gif/header-screen-v2 2.gif';

  /** ≤999px matches hero SCSS — only one GIF mounts so mobile doesn't download twice. */
  isMobileHero = false;

  private mql: MediaQueryList | null = null;
  private readonly onMqlChange = (e: MediaQueryListEvent): void => {
    this.isMobileHero = e.matches;
  };

  constructor(readonly stores: AppStoreLinkService) {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mql = window.matchMedia('(max-width: 999px)');
      this.isMobileHero = this.mql.matches;
      this.mql.addEventListener('change', this.onMqlChange);
    }
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.onMqlChange);
    this.mql = null;
  }
}
