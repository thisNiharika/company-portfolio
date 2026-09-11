import { Component, inject } from '@angular/core';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { RouteStaggerDirective } from '../../core/shared/directives/route-stagger.directive';

interface PortfolioCard {
  category: string;
  title: string;
  description: string;
  image?: string;
  link: string;
}
@Component({
  selector: 'app-p-design',
  imports: [RouteStaggerDirective],
  templateUrl: './p-design.html',
  styleUrl: './p-design.css',
})
export class PDesign {
  readonly routeTransition = inject(RouteTransitionService);
  goTo(url: string, event: MouseEvent): void {
    void this.routeTransition.navigate(url, event);
  }
  readonly cards: PortfolioCard[] = [
    {
      category: 'Kyrgyzstan | UNFPA, UN Women',
      title: 'Gender Data Portal',
      description: 'The Gender Data Portal is an interactive, user-friendly digital platform designed as a comprehensive hub for gender statistics in Kyrgyzstan.',
      image: 'assets/images/portfolio/gender-data-portal.jpg',
      link: '/home'
    },
    {
      category: 'India | NITI Aayog, UNDP',
      title: 'National Conference of Chief Secretaries',
      description: 'The National Conference of Chief Secretaries is a flagship initiative of the Government of India, led by NITI Aayog.',
      image: 'assets/images/portfolio/national-conferenc-of-chief-secretaries.jpg',
      link: '/home'
    },
    {
      category: 'India | NITI Aayog, UNDP',
      title: 'Indian Electric Mobility Index',
      description: 'The Indian Electric Mobility Index is a first-of-its-kind national platform developed to assess and benchmark the progress of electric mobility.',
      image: 'assets/images/portfolio/indian-electric-mobility-index.jpg',
      link: '/home'
    },
    {
      category: 'Bangladesh, India, Vietnam | GIZ',
      title: 'Digital Skills To Succeed',
      description: 'Digital Skills to Succeed is a digital learning and capacity-building initiative designed to equip youth and professionals.',
      image: 'assets/images/portfolio/digital-skills-to-succeed.jpg',
      link: '/home'
    },
    {
      category: 'India | NITI Aayog, UNDP',
      title: 'Indian Electric Mobility Index',
      description: 'A national platform developed to assess and benchmark the progress of electric mobility adoption across Indian States.',
      image: 'assets/images/portfolio/indian-electric-mobility-index.jpg',
      link: '/home'
    },
    {
      category: 'Kyrgyzstan | UNFPA, UN Women',
      title: 'Gender Data Portal',
      description: 'The Gender Data Portal is an interactive, user-friendly platform designed as a comprehensive hub for gender statistics.',
      image: 'assets/images/portfolio/gender-data-portal.jpg',
      link: '/home'
    }
  ];
}
