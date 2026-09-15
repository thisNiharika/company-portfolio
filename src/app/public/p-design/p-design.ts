import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RouteTransitionService } from '../../core/services/route-transition.service';

interface PortfolioCard {
  category: string;
  title: string;
  description: string;
  image?: string;
  link: string;
}

interface PortfolioYearGroup {
  year: number;
  cards: PortfolioCard[];
}

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-p-design',
  imports: [],
  templateUrl: './p-design.html',
  styleUrl: './p-design.css'
})
export class PDesign implements AfterViewInit, OnDestroy {
  @ViewChild('portfolioPage', { static: true })
  private portfolioPage!: ElementRef<HTMLElement>;

  readonly routeTransition = inject(RouteTransitionService);

  readonly activeYear = signal<number>(2026);

  private gsapContext:
    ReturnType<typeof gsap.context> | null = null;

  private refreshFrame: number | null = null;

  readonly portfolioYears: PortfolioYearGroup[] = [
    {
      year: 2026,
      cards: [
        {
          category: 'Kyrgyzstan | UNFPA, UN Women',
          title: 'Gender Data Portal',
          description:
            'The Gender Data Portal is an interactive, user-friendly digital platform designed as a comprehensive hub for gender statistics in Kyrgyzstan.',
          image: 'assets/images/portfolio/gender-data-portal.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'National Conference of Chief Secretaries',
          description:
            'The National Conference of Chief Secretaries is a flagship initiative of the Government of India, led by NITI Aayog.',
          image:
            'assets/images/portfolio/national-conferenc-of-chief-secretaries.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'Indian Electric Mobility Index',
          description:
            'The Indian Electric Mobility Index is a first-of-its-kind national platform developed to assess and benchmark the progress of electric mobility.',
          image:
            'assets/images/portfolio/indian-electric-mobility-index.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'Bangladesh, India, Vietnam | GIZ',
          title: 'Digital Skills To Succeed',
          description:
            'Digital Skills to Succeed is a digital learning and capacity-building initiative designed to equip youth and professionals.',
          image:
            'assets/images/portfolio/digital-skills-to-succeed.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'Indian Electric Mobility Index',
          description:
            'A national platform developed to assess and benchmark the progress of electric mobility adoption across Indian States.',
          image:
            'assets/images/portfolio/indian-electric-mobility-index.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'Kyrgyzstan | UNFPA, UN Women',
          title: 'Gender Data Portal',
          description:
            'The Gender Data Portal is an interactive, user-friendly platform designed as a comprehensive hub for gender statistics.',
          image:
            'assets/images/portfolio/gender-data-portal.jpg',
          link: '/portfolio-details'
        }
      ]
    },
    {
      year: 2025,
      cards: [
        {
          category: 'Bangladesh, India, Vietnam | GIZ',
          title: 'Digital Skills To Succeed',
          description:
            'Digital Skills to Succeed is a digital learning and capacity-building initiative designed to equip youth and professionals.',
          image:
            'assets/images/portfolio/digital-skills-to-succeed.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'Indian Electric Mobility Index',
          description:
            'A national platform developed to assess and benchmark the progress of electric mobility adoption across Indian States.',
          image:
            'assets/images/portfolio/indian-electric-mobility-index.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'Kyrgyzstan | UNFPA, UN Women',
          title: 'Gender Data Portal',
          description:
            'The Gender Data Portal is an interactive, user-friendly platform designed as a comprehensive hub for gender statistics.',
          image:
            'assets/images/portfolio/gender-data-portal.jpg',
          link: '/portfolio-details'
        }
      ]
    },
    {
      year: 2024,
      cards: [
        {
          category: 'Bangladesh, India, Vietnam | GIZ',
          title: 'Digital Skills To Succeed',
          description:
            'Digital Skills to Succeed is a digital learning and capacity-building initiative designed to equip youth and professionals.',
          image:
            'assets/images/portfolio/digital-skills-to-succeed.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'Indian Electric Mobility Index',
          description:
            'A national platform developed to assess and benchmark the progress of electric mobility adoption across Indian States.',
          image:
            'assets/images/portfolio/indian-electric-mobility-index.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'Kyrgyzstan | UNFPA, UN Women',
          title: 'Gender Data Portal',
          description:
            'The Gender Data Portal is an interactive, user-friendly platform designed as a comprehensive hub for gender statistics.',
          image:
            'assets/images/portfolio/gender-data-portal.jpg',
          link: '/portfolio-details'
        }
      ]
    }
  ];

  ngAfterViewInit(): void {
    this.initializeScrollAnimations();

    this.refreshFrame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }

  private initializeScrollAnimations(): void {
    const root = this.portfolioPage.nativeElement;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    this.gsapContext = gsap.context(() => {

      const cardLists =
        root.querySelectorAll<HTMLElement>('.cardList');

      if (!reduceMotion) {
        cardLists.forEach((cardList) => {
          const cards = Array.from(
            cardList.querySelectorAll<HTMLElement>('.card_items')
          );

          cards.forEach((card, index) => {
  const column = index % 3;

  const direction =
    column === 0 ? -1 :
    column === 2 ? 1 : 0;

  const imageClipStart =
    column === 0
      ? 'inset(0% 100% 0% 0%)'
      : column === 1
        ? 'inset(100% 0% 0% 0%)'
        : 'inset(0% 0% 0% 100%)';

  const content =
    card.querySelector<HTMLElement>('.ci_content');

  const image =
    card.querySelector<HTMLImageElement>('.ci_img img');

  const textElements = Array.from(
    card.querySelectorAll<HTMLElement>(
      '.cic_top > span, .cic_top > h2, .cic_top > p'
    )
  );

  const arrow =
    card.querySelector<HTMLElement>('.arrow_card');

  /*
   * Old GSAP transforms remove karega.
   * CSS wali original position automatically restore hogi.
   */
  gsap.set(card, {
    clearProps: 'transform'
  });

  if (image) {
    gsap.set(image, {
      clearProps: 'transform'
    });
  }

  const cardTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: card,
      start: 'top 92%',
      end: 'top 48%',
      scrub: 0.8,
      invalidateOnRefresh: true
    }
  });

  /*
   * Parent card par transform nahi lagayenge.
   * Isse image ki absolute position same rahegi.
   */
  cardTimeline.fromTo(
    card,
    {
      autoAlpha: 0
    },
    {
      autoAlpha: 1,
      duration: 0.25,
      ease: 'none'
    },
    0
  );

  /*
   * Sirf white content box animate hoga
   */
  if (content) {
    cardTimeline.fromTo(
      content,
      {
        autoAlpha: 0,

        x: () => {
          if (window.innerWidth <= 767) {
            return direction * 20;
          }

          return direction * 60;
        },

        y: column === 1 ? 130 : 90,
        rotationZ: direction * 3,
        rotationX: column === 1 ? 6 : 0,
        scale: 0.96,
        filter: 'blur(8px)',
        transformPerspective: 1200
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotationZ: 0,
        rotationX: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        ease: 'power3.out'
      },
      0
    );
  }

  /*
   * Image ki position aur transform change nahi honge.
   * Sirf mask reveal hoga.
   */
  if (image) {
    cardTimeline.fromTo(
      image,
      {
        autoAlpha: 0,
        clipPath: imageClipStart
      },
      {
        autoAlpha: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.8,
        ease: 'power2.out'
      },
      0.15
    );
  }

  /*
   * Text reveal
   */
  if (textElements.length) {
    cardTimeline.fromTo(
      textElements,
      {
        autoAlpha: 0,
        y: 35,
        skewY: 2
      },
      {
        autoAlpha: 1,
        y: 0,
        skewY: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power3.out'
      },
      0.3
    );
  }

  /*
   * Arrow reveal
   */
  if (arrow) {
    cardTimeline.fromTo(
      arrow,
      {
        autoAlpha: 0,
        scale: 0.4,
        rotation: -45
      },
      {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: 0.45,
        ease: 'back.out(1.7)'
      },
      0.5
    );
  }
});
        });
      }

      /*
      * Active year navigation
      */
      const sections = Array.from(
        root.querySelectorAll<HTMLElement>('.yearColumn')
      );

      sections.forEach((section, index) => {
        const year = Number(section.dataset['year']);

        ScrollTrigger.create({
          trigger: section,
          start: 'top 45%',
          end: 'bottom 45%',

          onEnter: () => {
            this.activeYear.set(year);
          },

          onEnterBack: () => {
            this.activeYear.set(year);
          },

          onLeaveBack: () => {
            if (index > 0) {
              const previousYear = Number(
                sections[index - 1].dataset['year']
              );

              this.activeYear.set(previousYear);
            }
          }
        });
      });

    }, root);
  }

  scrollToYear(year: number): void {
    const section =
      this.portfolioPage.nativeElement
        .querySelector<HTMLElement>(
          `[data-year="${year}"]`
        );

    if (!section) {
      return;
    }

    this.activeYear.set(year);

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  goTo(
    url: string,
    event: MouseEvent,
    contentShowDelay = 0
  ): void {
    void this.routeTransition.navigate(
      url,
      event,
      {
        contentShowDelay,
        navigationLockDuration: 2000
      }
    );
  }

  ngOnDestroy(): void {
    if (this.refreshFrame !== null) {
      cancelAnimationFrame(this.refreshFrame);
    }

    this.gsapContext?.revert();
    this.gsapContext = null;
  }
}