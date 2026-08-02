import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements AfterViewInit {
  readonly heroGifSrc = 'assets/gif/header-screen-v2%202.gif';

  @ViewChild('desktopHeroGif') private desktopHeroGif?: ElementRef<HTMLImageElement>;
  @ViewChild('mobileHeroGif') private mobileHeroGif?: ElementRef<HTMLImageElement>;

  ngAfterViewInit(): void {
    this.restartGif(this.desktopHeroGif);
    this.restartGif(this.mobileHeroGif);
  }

  /** يعيد تشغيل الـ GIF عند كل زيارة للهيرو (مش بس أول refresh). */
  private restartGif(ref?: ElementRef<HTMLImageElement>): void {
    const img = ref?.nativeElement;
    if (!img) {
      return;
    }

    const src = this.heroGifSrc;
    img.src = '';
    requestAnimationFrame(() => {
      img.src = src;
    });
  }
}
