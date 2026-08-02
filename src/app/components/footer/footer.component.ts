import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, skip } from 'rxjs';

import { LanguageService } from '../../services/language.service';
import {
  EMPTY_FOOTER_PUBLIC,
  FooterPublicConfig,
  SiteSettingsService,
} from '../../services/site-settings.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
  footer: FooterPublicConfig = { ...EMPTY_FOOTER_PUBLIC };

  private readonly subs = new Subscription();

  constructor(
    readonly language: LanguageService,
    private readonly siteSettings: SiteSettingsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.siteSettings.watchFooterConfig().subscribe({
        next: (cfg) => {
          this.footer = cfg;
          this.cdr.detectChanges();
        },
        error: () => {
          this.footer = { ...EMPTY_FOOTER_PUBLIC };
          this.cdr.detectChanges();
        },
      })
    );

    this.subs.add(
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          skip(1)
        )
        .subscribe(() => this.siteSettings.invalidate())
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** After editing Site Settings in the dashboard, returning to this tab refreshes footer. */
  @HostListener('window:focus')
  onWindowFocus(): void {
    this.siteSettings.invalidate();
  }

  /** Valid external URL for href; otherwise null (hide / disable link). */
  externalUrl(url: string | null | undefined): string | null {
    let t = (url ?? '').trim();
    if (!t || t === '#' || t === '...' || t === '—') {
      return null;
    }
    if (/yourhandle|yourchannel|example\.com/i.test(t)) {
      return null;
    }
    if (!/^https?:\/\//i.test(t) && /^(www\.|facebook\.|instagram\.|linkedin\.|fb\.|apps\.|play\.google)/i.test(t)) {
      t = `https://${t}`;
    }
    return t;
  }
}
