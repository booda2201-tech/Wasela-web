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
    img: 'assets/images/digital-screen.png'
  },
  {
    id: 2,
    title: 'Flexible by Design',
    desc: 'Installment Plans That Adapt to Your Income and Priorities.',
    img: 'assets/images/flexible-screen.png'
  },
  {
    id: 3,
    title: 'Clear & Transparent',
    desc: 'No Hidden Fees, No Confusing Terms.',
    img: 'assets/images/clear-screen.png'
  },
  {
    id: 4,
    title: 'Trusted & Regulated',
    desc: "Operating Under Egypt's Consumer Finance Regulations.",
    img: 'assets/images/trusted-screen.png'
  },
  {
    id: 5,
    title: 'Instant Approvals',
    desc: 'Get your credit limit in minutes with our AI-driven engine.',
    img: 'assets/images/instant-screen.png'
  },
  {
    id: 6,
    title: 'Wide Merchant Network',
    desc: 'Shop from thousands of stores across Egypt with zero down payment.',
    img: 'assets/images/merchants-screen.png'
  },
  {
    id: 7,
    title: 'Smart Spending Insights',
    desc: 'Track your installments and manage your budget effectively.',
    img: 'assets/images/insights-screen.png'
  },
  {
    id: 8,
    title: '24/7 Premium Support',
    desc: 'Our dedicated team is always here to assist you anytime, anywhere.',
    img: 'assets/images/support-screen.png'
  }
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
