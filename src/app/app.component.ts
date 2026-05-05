import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../environments/environment';
import { SiteSettingsService } from './services/site-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    private readonly siteSettingsService: SiteSettingsService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.siteSettingsService.getMergedSettingsMapByGroups([1, 5]).subscribe({
      next: (settings) => this.applyGlobalSeo(settings),
      error: () => {
        // Keep static fallback values from index.html if settings are unavailable.
      }
    });
  }

  private applyGlobalSeo(settings: Record<string, string>): void {
    const siteTitle = settings['seo.default_meta_title'] || settings['general.site_name'];
    const siteDescription = settings['seo.default_meta_description'];
    const siteKeywords = settings['seo.meta_keywords'];
    const faviconUrl = settings['branding.favicon_url'];
    const siteName = settings['general.site_name'];
    const siteUrl = settings['general.site_url'];
    const logoUrl = settings['branding.logo_url'];
    const primaryColor = settings['branding.primary_color'];
    const robots = settings['seo.robots'];

    const resolvedSiteUrl = siteUrl || '';
    const resolvedLogoUrl = logoUrl ? this.resolveUrl(logoUrl) : '';

    if (siteTitle) {
      this.title.setTitle(siteTitle);
      this.upsertMeta('property', 'og:title', siteTitle);
      this.upsertMeta('name', 'twitter:title', siteTitle);
    }

    if (siteDescription) {
      this.meta.updateTag({ name: 'description', content: siteDescription });
      this.upsertMeta('property', 'og:description', siteDescription);
      this.upsertMeta('name', 'twitter:description', siteDescription);
    }

    if (siteKeywords) {
      this.meta.updateTag({ name: 'keywords', content: siteKeywords });
    }

    if (siteName) {
      this.upsertMeta('property', 'og:site_name', siteName);
      this.meta.updateTag({ name: 'application-name', content: siteName });
      this.meta.updateTag({ name: 'author', content: siteName });
    }

    if (faviconUrl) {
      this.setFavicon(faviconUrl);
    }

    this.upsertMeta('property', 'og:type', 'website');

    if (robots) {
      this.upsertMeta('name', 'robots', robots);
    }
    if (resolvedSiteUrl) {
      this.upsertMeta('property', 'og:url', resolvedSiteUrl);
    }

    if (resolvedLogoUrl) {
      this.upsertMeta('property', 'og:image', resolvedLogoUrl);
      this.upsertMeta('name', 'twitter:image', resolvedLogoUrl);
      this.upsertMeta('name', 'twitter:card', 'summary_large_image');
    } else {
      this.upsertMeta('name', 'twitter:card', 'summary');
    }

    if (primaryColor) {
      this.meta.updateTag({ name: 'theme-color', content: primaryColor });
    }

    if (resolvedSiteUrl) {
      this.setCanonical(resolvedSiteUrl);
    }
  }

  private upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content });
  }

  private setFavicon(url: string): void {
    const resolvedUrl = this.resolveUrl(url);
    const head = this.document.head;
    let link = this.document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      head.appendChild(link);
    }
    link.href = resolvedUrl;
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = url;
  }

  private resolveUrl(url: string): string {
    return /^https?:\/\//.test(url)
      ? url
      : `${environment.apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
