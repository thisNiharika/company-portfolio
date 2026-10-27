
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RouteTransitionService } from '../../core/services/route-transition.service';
import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/services/project';

interface PortfolioCard {
  id: Project['id'];
  year: number;
  title: string;
  description: string;
  coverImage?: string;
  slug: string;
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

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  readonly routeTransition = inject(RouteTransitionService);

  readonly activeYear = signal<number>(2026);

  projects: Project[] = [];

  portfolioYears: PortfolioYearGroup[] = [];

  private viewReady = false;
  private animationsInitialized = false;

  private gsapContext:
    ReturnType<typeof gsap.context> | null = null;

  private refreshFrame: number | null = null;

  ngOnInit(): void {
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeWhenReady();
  }

  // =========================
  // LOAD PUBLISHED PROJECTS
  // =========================

  private loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects.filter(
          project => project.status === 'published'
        );

        this.buildPortfolioYears();

        if (this.portfolioYears.length > 0) {
          this.activeYear.set(this.portfolioYears[0].year);
        }

        this.cdr.detectChanges();
        this.initializeWhenReady();
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
      }
    });
  }
  // =========================
  // GROUP PROJECTS BY YEAR
  // =========================

  private buildPortfolioYears(): void {
    const grouped = new Map<number, PortfolioCard[]>();

    for (const project of this.projects) {
      const year = Number(project.year);

      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      
      grouped.get(year)!.push({
        id: project.id,
        year,
        title: project.title,
        description: project.description,
        coverImage: project.coverImage,
        slug: project.slug
      });
    }

    this.portfolioYears = Array.from(grouped.entries())
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, cards]) => ({
        year,
        cards: cards.sort(
          (a, b) =>
            (this.projects.find(p => p.id === a.id)?.serialNo ?? 0) -
            (this.projects.find(p => p.id === b.id)?.serialNo ?? 0)
        )
      }));
  }

  // =========================
  // INITIALIZE AFTER DOM RENDERS
  // =========================

  private initializeWhenReady(): void {
    if (
      !this.viewReady ||
      this.animationsInitialized ||
      this.portfolioYears.length === 0
    ) {
      return;
    }

    this.animationsInitialized = true;

    this.initializeScrollAnimations();

    this.refreshFrame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      this.refreshFrame = null;
    });
  }

  // =========================
  // GSAP SCROLL ANIMATIONS
  // =========================

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
      start: 'top 80%',
      end: 'top 48%',
      scrub: 1.2,
      invalidateOnRefresh: true
    }
  });

            // Card visibility
            cardTimeline.fromTo(
              card,
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: 0.25,
                ease: 'none'
              },
              0
            );

            // Content animation
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

            // Image reveal
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

            // Text reveal
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

            // Arrow reveal
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

      // Active year navigation
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

  // =========================
  // SCROLL TO YEAR
  // =========================

  scrollToYear(year: number): void {
    const section =
      this.portfolioPage.nativeElement.querySelector<HTMLElement>(
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

  // =========================
  // PROJECT NAVIGATION
  // =========================

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

  // =========================
  // CLEANUP
  // =========================

  ngOnDestroy(): void {
    if (this.refreshFrame !== null) {
      cancelAnimationFrame(this.refreshFrame);
      this.refreshFrame = null;
    }

    this.gsapContext?.revert();
    this.gsapContext = null;
  }
}
