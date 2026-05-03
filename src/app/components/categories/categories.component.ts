import { Component } from '@angular/core';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
  categories = [
    {
      title: 'Mobility',
      description: 'Financing solutions that support everyday mobility needs.',
      img: '../../../assets/images/Vector 5 (4).png',
      mask: '../../../assets/images/Vector 6.png',
      subItems: [
        { name: 'Spare Parts', icon: '../../../assets/images/Frame 1984077816.png', color: 'bg-[#F3F4FF]' },
        { name: 'Maintenance', icon: '../../../assets/images/Frame 1984077817.png/', color: 'bg-[#FFF8F3]' },
        { name: 'Purchase of cars', icon: '../../../assets/images/Frame 1984077818.png', color: 'bg-[#F3F4FF]' }
      ]
    },
    {
      title: 'Everyday Essentials',
      description: 'Finance your dreams and your everyday lifestyle needs.',
      img: '../../../assets/images/Vector 10.png',
      mask: '../../../assets/images/Vector 6.png',
      subItems: [
        { name: 'Fashion', icon: '../../../assets/images/Frame 1984077819.png', color: 'bg-[#F3F4FF]' },
        { name: 'Appliances', icon: '../../../assets/images/Frame 1984077820.png', color: 'bg-[#FFF8F3]' },
        { name: 'Pet Care', icon: '../../../assets/images/Frame 1984077821.png', color: 'bg-[#F3F4FF]' },
        { name: 'Electronics', icon: '../../../assets/images/Group (1).png', color: 'bg-[#FFF8F3]' },
        { name: 'Books & Stationery', icon: '../../../assets/images/Group (2).png', color: 'bg-[#F3F4FF]' },
        { name: 'Toys', icon: '../../../assets/images/Group (3).png', color: 'bg-[#FFF8F3]' }
      ]
    },
    {
      title: 'Health Care',
      description: 'Comprehensive medical financing for you and your family.',
      img: '../../../assets/images/Vector 9.png',
      mask: '../../../assets/images/Vector 6.png',
      subItems: [
        { name: 'Modern Parts', icon: '../../../assets/images/Group (4).png', color: 'bg-[#FFF8F3]' },
        { name: 'Surgeries', icon: '../../../assets/images/Group (5).png', color: 'bg-[#F3F4FF]' }
      ]
    },
    {
      title: 'Education',
      description: 'Invest in your future with our flexible education plans.',
      img: '../../../assets/images/Vector 11.png',
      mask: '../../../assets/images/Vector 6.png',
      subItems: [
        { name: 'Fees Paid', icon: '../../../assets/images/Group 1597883124.png', color: 'bg-[#FFF8F3]' },
        { name: 'Schools & Universities', icon: '../../../assets/images/Group 1597883125.png', color: 'bg-[#F3F4FF]' }
      ]
    }
  ];
}
