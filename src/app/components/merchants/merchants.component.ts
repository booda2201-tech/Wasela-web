import { Component } from '@angular/core';

@Component({
  selector: 'app-merchants',
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent {

col1 = [
  { bg: '../../../../assets/images/Rectangle 41508.png', logo: '../../../../assets/images/Ellipse 6795 (1).png', classes: 'h-[450px] hover:h-[580px]' },
  { bg: '../../../../assets/images/Rectangle 41509.png', logo: '../../../../assets/images/Ellipse 6795 (2).png', classes: 'h-[360px] hover:h-[480px]' },
  { bg: '../../../../assets/images/Rectangle 41511.png', logo: '../../../../assets/images/Ellipse 6795 (3).png', classes: 'h-[290px] hover:h-[400px]' }
];

col2 = [
  { bg: '../../../../assets/images/Rectangle 41512.png', logo: '../../../../assets/images/Ellipse 6795 (4).png', classes: 'h-[480px] hover:h-[620px]' },
  { bg: '../../../../assets/images/Rectangle 41510.png', logo: '../../../../assets/images/Ellipse 6795 (7).png', classes: 'h-[340px] hover:h-[460px]' },
  { bg: '../../../../assets/images/Rectangle 41513.png', logo: '../../../../assets/images/Ellipse 6795 (5).png', classes: 'h-[280px] hover:h-[400px]' }
];

col3 = [
  { bg: '../../../../assets/images/Rectangle 41514.png', logo: '../../../../assets/images/Ellipse 6795 (8).png', classes: 'h-[320px] hover:h-[420px]' },
  { bg: '../../../../assets/images/Rectangle 41515.png', logo: '../../../../assets/images/Ellipse 6795 (6).png', classes: 'h-[380px] hover:h-[520px]' },
  { bg: '../../../../assets/images/Rectangle 41516.png', logo: '../../../../assets/images/Ellipse 6795 (10).png', classes: 'h-[400px] hover:h-[540px]' }
];

col4 = [
  { bg: '../../../../assets/images/Rectangle 41517.png', logo: '../../../../assets/images/Ellipse 6795 (12).png', classes: 'h-[360px] hover:h-[500px]' },
  { bg: '../../../../assets/images/Rectangle 41518.png', logo: '../../../../assets/images/Ellipse 6795 (11).png', classes: 'h-[420px] hover:h-[560px]' },
  { bg: '../../../../assets/images/Rectangle 41519.png', logo: '../../../../assets/images/Ellipse 6795 (9).png', classes: 'h-[320px] hover:h-[430px]' }
];
columns = [this.col1, this.col2, this.col3, this.col4];

}
