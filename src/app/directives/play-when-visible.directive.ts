import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Assigns the img src the first time it is actually on screen. Site GIFs play once, so
 * starting them earlier would mean they finish before the visitor ever sees them.
 * The bytes are already preloaded (GifPreloadService), so the GIF appears instantly.
 */
@Directive({
  selector: 'img[appPlayWhenVisible]',
})
export class PlayWhenVisibleDirective implements OnInit, OnDestroy {
  @Input('appPlayWhenVisible') set src(value: string | null | undefined) {
    this.srcValue = (value ?? '').trim();
    if (this.started && this.srcValue) {
      this.host.nativeElement.src = this.srcValue;
    }
  }

  private srcValue = '';
  private started = false;
  private observer: IntersectionObserver | null = null;

  constructor(private readonly host: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.start();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.start();
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.observeTarget());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  /** Absolutely positioned imgs are 0×0 until they have a src — watch their sized container instead. */
  private observeTarget(): Element {
    const img = this.host.nativeElement;
    let node = img.parentElement;
    for (let i = 0; i < 4 && node; i++) {
      if (node.offsetWidth > 0 && node.offsetHeight > 0) {
        return node;
      }
      node = node.parentElement;
    }
    return img.parentElement ?? img;
  }

  private start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.observer?.disconnect();
    this.observer = null;
    if (this.srcValue) {
      this.host.nativeElement.src = this.srcValue;
    }
  }
}
