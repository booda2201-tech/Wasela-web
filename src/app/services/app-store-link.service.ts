import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

export type MobileStorePlatform = 'ios' | 'android' | 'other';

@Injectable({ providedIn: 'root' })
export class AppStoreLinkService {
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

  /** رابط المتجر المناسب للمنصة؛ null إذا الرابط غير مضبوط بعد في environment. */
  getStoreUrl(platform: MobileStorePlatform = this.detectPlatform()): string | null {
    const appStore = this.normalizeUrl(environment.appStoreUrl);
    const googlePlay = this.normalizeUrl(environment.googlePlayUrl);

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
