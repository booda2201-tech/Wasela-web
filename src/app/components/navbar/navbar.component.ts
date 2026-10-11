import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy } from '@angular/core';

import { AppStoreLinkService } from '../../services/app-store-link.service';
import { LanguageService, NavLabelKey } from '../../services/language.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  isMobileMenuOpen = false;

  readonly navLinks: ReadonlyArray<{ path: string; labelKey: NavLabelKey }> = [
    { path: '/', labelKey: 'home' },
    { path: '/merchants', labelKey: 'merchants' },
    { path: '/categories', labelKey: 'categories' },
    { path: '/about-us', labelKey: 'aboutUs' },
    { path: '/contact-us', labelKey: 'contactUs' },
  ];

  constructor(
    private readonly appStoreLink: AppStoreLinkService,
    readonly language: LanguageService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  toggleMobileMenu(): void {
    this.setMobileMenu(!this.isMobileMenuOpen);
  }

  closeMobileMenu(): void {
    this.setMobileMenu(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  onDownloadClick(): void {
    this.appStoreLink.openStore();
    this.closeMobileMenu();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('mobile-nav-open');
  }

  private setMobileMenu(open: boolean): void {
    this.isMobileMenuOpen = open;
    this.document.body.classList.toggle('mobile-nav-open', open);
  }
}
