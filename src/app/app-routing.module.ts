import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { HeroComponent } from './components/home/hero/hero.component';
import { FeaturesComponent } from './components/home/features/features.component';
import { HomeContentsComponent } from './components/home/home-contents/home-contents.component';
import { MerchantsComponent } from './components/merchants/merchants.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { CareersComponent } from './components/careers/careers.component';
import { FaqComponent } from './components/faq/faq.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { TermsConditionsComponent } from './components/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { BlogsComponent } from './components/blogs/blogs.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';



const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'hero', component: HeroComponent },
  { path: 'features', component: FeaturesComponent },
  { path: 'home-contents', component: HomeContentsComponent },
  { path: 'merchants', component: MerchantsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'careers', component: CareersComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'terms-conditions', component: TermsConditionsComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'blogs/:postId', component: BlogDetailComponent },
  { path: 'blogs', component: BlogsComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
