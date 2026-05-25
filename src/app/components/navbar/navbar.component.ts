import { Component } from '@angular/core';

import { AppStoreLinkService } from '../../services/app-store-link.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isMobileMenuOpen = false;

  constructor(private readonly appStoreLink: AppStoreLinkService) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onDownloadClick(): void {
    this.appStoreLink.openStore();
    this.closeMobileMenu();
  }
}
