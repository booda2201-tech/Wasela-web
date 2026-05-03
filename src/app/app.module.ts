import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
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



@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    FooterComponent,
    HeroComponent,
    FeaturesComponent,
    HomeContentsComponent,
    MerchantsComponent,
    CategoriesComponent,
    CareersComponent,
    FaqComponent,
    AboutUsComponent,
    ContactUsComponent,
    TermsConditionsComponent,
    PrivacyPolicyComponent,
    BlogsComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
