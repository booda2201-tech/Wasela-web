import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

/**
 * Defers assigning img src until near the viewport.
 * Observes the parent when the img is absolutely positioned (0×0 before src).
 */
@Directive({
  selector: 'img[appDeferSrc]',
})
export class DeferSrcDirective implements OnInit, OnDestroy {
  @Input('appDeferSrc') set deferSrc(value: string | null | undefined) {
    this.srcValue = (value ?? '').trim();
    if (this.activated && this.srcValue) {
      this.applySrc();
    }
  }

  private srcValue = '';
  private activated = false;
  private observer: IntersectionObserver | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly host: ElementRef<HTMLImageElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const img = this.host.nativeElement;
    this.renderer.setAttribute(img, 'decoding', 'async');

    if (typeof IntersectionObserver === 'undefined') {
      this.activate();
      return;
    }

    const observeTarget = this.resolveObserveTarget(img);

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting || e.intersectionRatio > 0)) {
          this.activate();
        }
      },
      { rootMargin: '320px 0px', threshold: 0 }
    );
    this.observer.observe(observeTarget);

    // Absolute / deferred imgs can miss the first IO callback — force-check soon.
    this.fallbackTimer = setTimeout(() => {
      if (this.activated) {
        return;
      }
      const rect = observeTarget.getBoundingClientRect();
      const viewH = window.innerHeight || 0;
      if (rect.bottom >= -320 && rect.top <= viewH + 320 && rect.width + rect.height > 0) {
        this.activate();
      }
    }, 120);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.fallbackTimer != null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private resolveObserveTarget(img: HTMLImageElement): Element {
    const parent = img.parentElement;
    if (!parent) {
      return img;
    }
    // Prefer a sized ancestor — absolute GIFs often have 0×0 until src loads.
    let node: HTMLElement | null = parent;
    for (let i = 0; i < 4 && node; i++) {
      const style = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
      const hasBox = node.offsetWidth > 0 || node.offsetHeight > 0 || node.clientHeight > 0;
      if (hasBox || style?.position === 'relative' || style?.position === 'absolute') {
        return node;
      }
      node = node.parentElement;
    }
    return parent;
  }

  private activate(): void {
    if (this.activated) {
      return;
    }
    this.activated = true;
    this.observer?.disconnect();
    this.observer = null;
    if (this.fallbackTimer != null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.applySrc();
  }

  private applySrc(): void {
    if (!this.srcValue) {
      return;
    }
    const img = this.host.nativeElement;
    // Property assignment encodes spaces correctly (unlike raw %20 in some hosts).
    img.src = this.srcValue;
  }
}
