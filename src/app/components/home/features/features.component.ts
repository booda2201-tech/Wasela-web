import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent implements AfterViewInit{

activeCard: number = 0;

@ViewChildren('featureCard') cards!: QueryList<ElementRef>;

features = [
  {
    id: 1,
    title: 'Fast & Fully Digital',
    desc: 'From Onboarding to Repayment, Everything Happens Through the App.',
    img: '../../../../assets/gif/why waseela-clear and transparent.gif'
  },
  {
    id: 2,
    title: 'Flexible by Design',
    desc: 'Installment Plans That Adapt to Your Income and Priorities.',
    img: 'assets/gif/why waseela-flexible by design.gif'
  },
  {
    id: 3,
    title: 'Clear & Transparent',
    desc: 'No Hidden Fees, No Confusing Terms.',
    img: '../../../../assets/gif/why waseela-fully digital.gif'
  },
  {
    id: 4,
    title: 'Trusted & Regulated',
    desc: "Operating Under Egypt's Consumer Finance Regulations.",
    img: '../../../../assets/gif/why waseela-trusted.gif'
  },
  {
    id: 5,
    title: 'Instant Approvals',
    desc: 'Get your credit limit in minutes with our AI-driven engine.',
    img: '../../../../assets/gif/why waseela-instant approvals.gif'
  },

];

ngAfterViewInit() {
    const options = {
      root: null, // بيراقب بالنسبة للـ viewport
      threshold: 0.6 // الكارت يعتبر "نشط" لما يظهر منه 60%
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // بنجيب الـ ID من الـ attribute اللي هنضيفه في الـ HTML
          const id = entry.target.getAttribute('data-id');
          if (id) this.activeCard = +id;
        }
      });
    }, options);

    this.cards.forEach(card => observer.observe(card.nativeElement));
  }


scrollToCard(id: number) {
  this.activeCard = id; // تحديث الـ Indicator فوراً
  const element = document.querySelector(`[data-id="${id}"]`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

  setActive(id: number) {
    this.activeCard = id;
  }



  resetActive() {
      this.activeCard = 0; // يرجع للموبايل الثابت بس
    }

}
