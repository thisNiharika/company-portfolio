import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Renderer2,
  inject,
  signal
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RouteTransitionService } from '../../core/services/route-transition.service';
import { Subscription } from 'rxjs';
import {
  PortfolioFilterService,
  PortfolioFilterState,
  PortfolioProjectRecord
} from '../../core/services/portfolio-filter.service';

interface PortfolioCard {
  year: number;
  slug: string;
  coverImage: string;
  category: string;
  title: string;
  description: string;
  image?: string;
  link: string;
  domain?: string;
  clients?: string[];
  locations?: string[];
  technologies?: string[];
  projectId?: string;
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
export class PDesign implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('portfolioPage', { static: true })
  private portfolioPage!: ElementRef<HTMLElement>;

  readonly routeTransition = inject(RouteTransitionService);
  private readonly portfolioFilterService = inject(PortfolioFilterService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  private portfolioLoaderElement: HTMLElement | null = null;

  readonly activeYear = signal<number>(new Date().getFullYear());

  private allProjects: PortfolioProjectRecord[] = [];
  private currentFilters: PortfolioFilterState =
    this.portfolioFilterService.currentFilters;

  private projectsSubscription?: Subscription;
  private filtersSubscription?: Subscription;

  private gsapContext:
    ReturnType<typeof gsap.context> | null = null;

  private refreshFrame: number | null = null;

  /**
   * Keeps the existing template contract (year groups containing cards),
   * but builds the cards from the published MongoDB projects and active filters.
   */
  get portfolioYears(): PortfolioYearGroup[] {
    const visibleProjects = this.allProjects
      .filter(project =>
        this.portfolioFilterService.isPublished(project) &&
        this.portfolioFilterService.matches(project, this.currentFilters)
      );

    const groups = new Map<number, PortfolioCard[]>();

    for (const project of visibleProjects) {
      const year = this.portfolioFilterService.getYear(project);
      if (!year) continue;

      const clients = this.portfolioFilterService.getClients(project);
      const locations = this.portfolioFilterService.getLocations(project);
      const technologies = this.portfolioFilterService.getTechnologies(project);
      const domains = this.portfolioFilterService.getDomains(project);

      const category = [
        locations.join(', '),
        clients.join(', ')
      ].filter(Boolean).join(' | ');

      const slug = String(project.slug ?? '').trim();
      const projectId = String(project.id ?? project._id ?? '');

      const card: PortfolioCard = {
        year,
        slug,
        coverImage: String(project.coverImage ?? ''),
        category,
        title: String(project.title ?? ''),
        description: String(project.description ?? ''),
        image: String(project.coverImage ?? ''),
        link: slug ? `/projects/${encodeURIComponent(slug)}` : '',
        domain: domains.join(', '),
        clients,
        locations,
        technologies,
        projectId
      };

      if (!groups.has(year)) {
        groups.set(year, []);
      }

      groups.get(year)!.push(card);
    }

    return [...groups.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, cards]) => ({
        year,
        cards
      }));
  }

  ngOnInit(): void {
    // Show a loader while the first projects API request is pending.
    // The loader is created through Renderer2, so p-design.html stays untouched.
    this.showPortfolioLoader();

    this.filtersSubscription = this.portfolioFilterService.filters$
      .subscribe(filters => {
        this.currentFilters = filters;
        this.syncActiveYear();
        this.scheduleAnimationRefresh();
      });

    this.projectsSubscription = this.portfolioFilterService
      .loadProjects()
      .subscribe({
        next: projects => {
          this.hidePortfolioLoader();
          this.allProjects = projects.filter(project =>
            this.portfolioFilterService.isPublished(project)
          );
          this.syncActiveYear();
          this.scheduleAnimationRefresh();
        },
        error: error => {
          this.hidePortfolioLoader();
          console.error('Unable to load portfolio projects:', error);
          this.allProjects = [];
          this.scheduleAnimationRefresh();
        }
      });
  }

  /**
   * Adds a temporary loading overlay below the existing site header.
   * This is generated from TypeScript so no HTML template changes are needed.
   */
  private showPortfolioLoader(): void {
    if (this.portfolioLoaderElement || !this.document?.body) {
      return;
    }

    const pageRoot = this.portfolioPage?.nativeElement;
    const rootTop = pageRoot?.getBoundingClientRect().top ?? 0;
    const headerBottom = this.document
      .querySelector<HTMLElement>('.header')
      ?.getBoundingClientRect().bottom ?? 0;
    const top = Math.max(0, rootTop, headerBottom);

    const overlay = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(overlay, 'portfolio-api-loader');
    this.renderer.setAttribute(overlay, 'role', 'status');
    this.renderer.setAttribute(overlay, 'aria-live', 'polite');
    this.renderer.setAttribute(overlay, 'aria-label', 'Loading portfolio projects');

    this.renderer.setStyle(overlay, 'position', 'fixed');
    this.renderer.setStyle(overlay, 'top', `${top}px`);
    this.renderer.setStyle(overlay, 'right', '0');
    this.renderer.setStyle(overlay, 'bottom', '0');
    this.renderer.setStyle(overlay, 'left', '0');
    this.renderer.setStyle(overlay, 'z-index', '999');

    const content = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(content, 'portfolio-api-loader__content');

    const spinner = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(spinner, 'portfolio-api-loader__spinner');
    this.renderer.setAttribute(spinner, 'aria-hidden', 'true');

    const message = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(message, 'portfolio-api-loader__message');
    this.renderer.setProperty(message, 'textContent', 'Loading projects...');

    this.renderer.appendChild(content, spinner);
    this.renderer.appendChild(content, message);
    this.renderer.appendChild(overlay, content);
    this.renderer.appendChild(this.document.body, overlay);

    this.portfolioLoaderElement = overlay;
  }

  /** Removes the loading overlay after the projects request completes. */
  private hidePortfolioLoader(): void {
    if (!this.portfolioLoaderElement || !this.document?.body) {
      return;
    }

    this.renderer.removeChild(this.document.body, this.portfolioLoaderElement);
    this.portfolioLoaderElement = null;
  }

  private syncActiveYear(): void {
    const years = this.portfolioYears.map(group => group.year);

    if (!years.length) {
      return;
    }

    if (!years.includes(this.activeYear())) {
      this.activeYear.set(years[0]);
    }
  }

  private scheduleAnimationRefresh(): void {
    if (this.refreshFrame !== null) {
      cancelAnimationFrame(this.refreshFrame);
    }

    this.refreshFrame = requestAnimationFrame(() => {
      this.gsapContext?.revert();
      this.gsapContext = null;
      this.initializeScrollAnimations();
      ScrollTrigger.refresh();
    });
  }

  ngAfterViewInit(): void {
    this.scheduleAnimationRefresh();
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
    this.hidePortfolioLoader();
    this.projectsSubscription?.unsubscribe();
    this.filtersSubscription?.unsubscribe();

    if (this.refreshFrame !== null) {
      cancelAnimationFrame(this.refreshFrame);
    }

    this.gsapContext?.revert();
    this.gsapContext = null;
  }
}