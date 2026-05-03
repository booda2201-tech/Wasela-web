import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy
} from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-terms-conditions',
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss']
})
export class TermsConditionsComponent implements AfterViewInit, OnDestroy {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  readonly pageTitle = 'Waseela’s Terms and Conditions';

  readonly pageSubtitle =
    'These terms define the rules, responsibilities, and standards that ensure a safe, reliable, and transparent experience for all users.';

  readonly contactEmail = 'info@waseela-cf.com';

  readonly contactMailHref = 'mailto:info@waseela-cf.com';

  private ctx?: gsap.Context;

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    this.ctx = gsap.context(() => {
      const card = root.querySelector<HTMLElement>('[data-terms-card]');
      if (card) {
        gsap.from(card, {
          y: 36,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out'
        });
      }
      const head = root.querySelector<HTMLElement>('[data-terms-heading-block]');
      if (head) {
        gsap.from(head, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out'
        });
      }
    }, root);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
