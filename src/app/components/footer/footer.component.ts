import { Component, OnInit } from '@angular/core';

import { LanguageService } from '../../services/language.service';
import {
  DEFAULT_FOOTER_PUBLIC,
  FooterPublicConfig,
  SiteSettingsService,
} from '../../services/site-settings.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  footer: FooterPublicConfig = { ...DEFAULT_FOOTER_PUBLIC };

  constructor(
    readonly language: LanguageService,
    private readonly siteSettings: SiteSettingsService
  ) {}

  ngOnInit(): void {
    this.siteSettings.getFooterConfig().subscribe({
      next: (cfg) => {
        this.footer = cfg;
      },
      error: () => {
        this.footer = { ...DEFAULT_FOOTER_PUBLIC };
      },
    });
  }

  /** Valid external URL for href; otherwise null (hide / disable link). */
  externalUrl(url: string | null | undefined): string | null {
    const t = (url ?? '').trim();
    if (!t || t === '#' || t === '...') {
      return null;
    }
    return t;
  }
}
