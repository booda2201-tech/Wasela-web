import { Component, HostBinding, OnDestroy } from '@angular/core';

import { GIFS } from '../../../gif-assets';
import { AppStoreLinkService } from '../../../services/app-store-link.service';
import { LanguageService } from '../../../services/language.service';

/** Module state resets on refresh — intro plays once per page load, not on every return to Home. */
let introPlayed = false;

/** Matches the `gifIn` animation delay in hero.component.scss. */
const INTRO_GIF_REVEAL_MS = 3120;

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnDestroy {
  readonly heroGifSrc = GIFS.hero;

  @HostBinding('class.hero--settled') readonly settled = introPlayed;

  /** The hero GIF plays once — on desktop it starts when the intro reveals it, not while hidden. */
  desktopGifStarted = this.settled;

  /** ≤999px matches hero SCSS — only one GIF mounts so mobile doesn't download twice. */
  isMobileHero = false;

  private mql: MediaQueryList | null = null;
  private revealTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly onMqlChange = (e: MediaQueryListEvent): void => {
    this.isMobileHero = e.matches;
  };

  constructor(
    readonly stores: AppStoreLinkService,
    readonly language: LanguageService
  ) {
    introPlayed = true;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mql = window.matchMedia('(max-width: 999px)');
      this.isMobileHero = this.mql.matches;
      this.mql.addEventListener('change', this.onMqlChange);
    }
    if (!this.desktopGifStarted) {
      this.revealTimer = setTimeout(() => {
        this.desktopGifStarted = true;
        this.revealTimer = null;
      }, INTRO_GIF_REVEAL_MS);
    }
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.onMqlChange);
    this.mql = null;
    if (this.revealTimer != null) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }
}
