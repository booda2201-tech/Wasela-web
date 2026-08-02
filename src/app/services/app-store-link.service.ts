import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { environment } from '../../environments/environment';
import { SiteSettingsService } from './site-settings.service';

export type MobileStorePlatform = 'ios' | 'android' | 'other';

@Injectable({ providedIn: 'root' })
export class AppStoreLinkService implements OnDestroy {
  private appStoreUrl = environment.appStoreUrl || '';
  private playStoreUrl = environment.googlePlayUrl || '';
  private readonly sub: Subscription;

  constructor(private readonly siteSettings: SiteSettingsService) {
    // Keep navbar Download in sync with Site Settings → Footer store URLs
    this.sub = this.siteSettings.watchFooterConfig().subscribe({
      next: (cfg) => {
        if (cfg.appStoreUrl?.trim()) {
          this.appStoreUrl = cfg.appStoreUrl.trim();
        }
        if (cfg.playStoreUrl?.trim()) {
          this.playStoreUrl = cfg.playStoreUrl.trim();
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** يكتشف iOS / Android من المتصفح (على الهاتف والتابلت). */
  detectPlatform(): MobileStorePlatform {
    if (typeof navigator === 'undefined') {
      return 'other';
    }

    const ua = navigator.userAgent || '';

    if (/android/i.test(ua)) {
      return 'android';
    }

    if (/iPad|iPhone|iPod/i.test(ua)) {
      return 'ios';
    }

    // iPadOS 13+ قد يُرسل User-Agent مثل Mac
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
      return 'ios';
    }

    return 'other';
  }

  /** رابط المتجر المناسب للمنصة؛ null إذا الرابط غير مضبوط. */
  getStoreUrl(platform: MobileStorePlatform = this.detectPlatform()): string | null {
    const appStore = this.normalizeUrl(this.appStoreUrl);
    const googlePlay = this.normalizeUrl(this.playStoreUrl);

    if (platform === 'ios') {
      return appStore;
    }

    if (platform === 'android') {
      return googlePlay;
    }

    return googlePlay ?? appStore;
  }

  /** يفتح المتجر في تاب جديد عند الضغط على Download. */
  openStore(platform?: MobileStorePlatform): boolean {
    const url = this.getStoreUrl(platform ?? this.detectPlatform());
    if (!url) {
      return false;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  private normalizeUrl(url: string | undefined | null): string | null {
    const trimmed = url?.trim();
    if (!trimmed || trimmed === '#' || trimmed === '...') {
      return null;
    }
    return trimmed;
  }
}
