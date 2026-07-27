import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { BlogDetailPost, BlogsService } from '../../services/blogs.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss']
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  loading = true;
  loadError = false;
  notFound = false;
  post: BlogDetailPost | null = null;

  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly blogsService: BlogsService,
    private readonly title: Title,
    readonly language: LanguageService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const raw = params.get('postId');
      const id = raw ? Number(raw) : NaN;
      this.loadPost(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  goBack(): void {
    void this.router.navigate(['/blogs']);
  }

  private loadPost(id: number): void {
    this.loading = true;
    this.loadError = false;
    this.notFound = false;
    this.post = null;

    if (!Number.isFinite(id) || id <= 0) {
      this.loading = false;
      this.notFound = true;
      return;
    }

    this.blogsService.getPostById(id).subscribe({
      next: (post) => {
        this.loading = false;
        if (!post) {
          this.notFound = true;
          return;
        }
        this.post = post;
        if (post.title) {
          this.title.setTitle(`${post.title} | Waseela`);
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }
}
