import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, forkJoin, of } from 'rxjs';

import { CmsPage, PagesService } from '../../services/pages.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loading = true;
  loadError = false;
  homePage: CmsPage | null = null;
  merchantsPage: CmsPage | null = null;

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    forkJoin({
      home: this.pagesService.getPageBySlug('home'),
      merchants: this.pagesService.getPageBySlug('merchants').pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ home, merchants }) => {
        this.homePage = home;
        this.merchantsPage = merchants;
        this.applySeo(home);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }
}
