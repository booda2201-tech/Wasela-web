import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, map, shareReplay } from 'rxjs';

import { environment } from '../../environments/environment';
import { SiteSettingsService } from './site-settings.service';

export type MobileStorePlatform = 'ios' | 'android' | 'other';

@Injectable({ providedIn: 'root' })
export class AppStoreLinkService implements OnDestroy {
  private readonly appStoreUrlSubject = new BehaviorSubject<string>(
    environment.appStoreUrl || ''
  );
  private readonly playStoreUrlSubject = new BehaviorSubject<string>(
    environment.googlePlayUrl || ''
  );

  /** Live App Store href from dashboard footer (null when unset). */
  readonly appStoreHref$ = this.appStoreUrlSubject.pipe(
    map((u) => this.normalizeUrl(u)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /** Live Google Play href from dashboard footer (null when unset). */
  readonly playStoreHref$ = this.playStoreUrlSubject.pipe(
    map((u) => this.normalizeUrl(u)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly sub: Subscription;

  constructor(private readonly siteSettings: SiteSettingsService) {
    // Same source as footer SVGs: Site Settings → Footer store URLs
    this.sub = this.siteSettings.watchFooterConfig().subscribe({
      next: (cfg) => {
        this.appStoreUrlSubject.next((cfg.appStoreUrl || '').trim());
        this.playStoreUrlSubject.next((cfg.playStoreUrl || '').trim());
      },
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** Synchronous App Store href (same source as footer). */
  get appStoreHref(): string | null {
    return this.normalizeUrl(this.appStoreUrlSubject.value);
  }

  /** Synchronous Google Play href (same source as footer). */
  get playStoreHref(): string | null {
    return this.normalizeUrl(this.playStoreUrlSubject.value);
  }

  /**
   * Detects iOS / Android (phone & tablet) and desktop OS:
   * Mac → App Store, Windows/Linux/ChromeOS → Google Play.
   */
  detectPlatform(): MobileStorePlatform {
    if (typeof navigator === 'undefined') {
      return 'other';
    }

    const ua = navigator.userAgent || '';
    const platform = (navigator.platform || '').toLowerCase();

    if (/android/i.test(ua)) {
      return 'android';
    }

    if (/iPad|iPhone|iPod/i.test(ua)) {
      return 'ios';
    }

    // iPadOS 13+ may report a Mac-like user agent
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
      return 'ios';
    }

    // Desktop: same store routing by OS family
    if (/mac/i.test(platform) || /macintosh|mac os x/i.test(ua)) {
      return 'ios';
    }

    if (
      /win/i.test(platform) ||
      /windows/i.test(ua) ||
      /linux|cros/i.test(platform) ||
      /CrOS/i.test(ua)
    ) {
      return 'android';
    }

    return 'other';
  }

  /** Store URL for the current (or given) platform; null if that link is not configured. */
  getStoreUrl(platform: MobileStorePlatform = this.detectPlatform()): string | null {
    const appStore = this.appStoreHref;
    const googlePlay = this.playStoreHref;

    if (platform === 'ios') {
      return appStore;
    }

    if (platform === 'android') {
      return googlePlay;
    }

    return googlePlay ?? appStore;
  }

  /** Opens the matching store in a new tab (navbar Download now). */
  openStore(platform?: MobileStorePlatform): boolean {
    return this.openUrl(this.getStoreUrl(platform ?? this.detectPlatform()));
  }

  /** Open App Store link from dashboard (badge click). */
  openAppStore(event?: Event): boolean {
    event?.preventDefault();
    return this.openUrl(this.appStoreHref);
  }

  /** Open Google Play link from dashboard (badge click). */
  openPlayStore(event?: Event): boolean {
    event?.preventDefault();
    return this.openUrl(this.playStoreHref);
  }

  private openUrl(url: string | null): boolean {
    if (!url) {
      return false;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  /** Same rules as footer.externalUrl — keep App Store / Play badges in sync. */
  private normalizeUrl(url: string | undefined | null): string | null {
    let t = (url ?? '').trim();
    if (!t || t === '#' || t === '...' || t === '—') {
      return null;
    }
    if (/yourhandle|yourchannel|example\.com/i.test(t)) {
      return null;
    }
    if (!/^https?:\/\//i.test(t) && /^(www\.|apps\.|play\.google)/i.test(t)) {
      t = `https://${t}`;
    }
    return t;
  }
}
