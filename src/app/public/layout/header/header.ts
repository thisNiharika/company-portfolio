import { Component, inject, HostListener, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouteTransitionService } from '../../../core/services/route-transition.service';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { PortfolioFilterService } from '../../../core/services/portfolio-filter.service';
gsap.registerPlugin(MorphSVGPlugin);
gsap.registerPlugin(ScrollTrigger);
interface Technology {
  name: string;
  image: string;
  alt: string;
}
type FilterType =
    | 'year'
    | 'domain'
    | 'client'
    | 'location'
    | 'technology';
@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})

export class Header implements AfterViewInit, OnDestroy {
  readonly routeTransition = inject(RouteTransitionService);
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

  constructor(public router: Router) {}

  private readonly portfolioFilterService = inject(PortfolioFilterService);
  private readonly ngZone = inject(NgZone);
  private routerEventsSubscription?: Subscription;
  private projectsSubscription?: Subscription;
  private applyButton?: HTMLButtonElement;
  private applyButtonListener?: () => void;
  private globalSearchInput?: HTMLInputElement;
  private globalSearchListener?: (event: Event) => void;
  private globalSearch = '';
  // ================================ Filter Btn
  isFilterOpen = false;

  private filterShape?: ElementRef<SVGPathElement>;
private filterBarsTarget?: ElementRef<SVGPathElement>;
private activeDots?: ElementRef<SVGPathElement>;

@ViewChild('filterShape')
set filterShapeRef(value: ElementRef<SVGPathElement> | undefined) {
  this.filterShape = value;
  this.initFilterAnimation();
}

@ViewChild('filterBarsTarget')
set filterBarsTargetRef(value: ElementRef<SVGPathElement> | undefined) {
  this.filterBarsTarget = value;
  this.initFilterAnimation();
}

@ViewChild('activeDots')
set activeDotsRef(value: ElementRef<SVGPathElement> | undefined) {
  this.activeDots = value;
  this.initFilterAnimation();
}

private initFilterAnimation(): void {
  const filterShape = this.filterShape?.nativeElement;
  const filterBarsTarget = this.filterBarsTarget?.nativeElement;
  const activeDots = this.activeDots?.nativeElement;

  // The filter SVG is conditionally rendered on /portfolio.
  // Wait until all three references exist.
  if (!filterShape || !filterBarsTarget || !activeDots) {
    this.filterTimeline?.kill();
    this.filterTimeline = undefined;
    return;
  }

  // Prevent duplicate timelines when the route changes.
  this.filterTimeline?.kill();

  gsap.set(activeDots, {
    opacity: 0,
    scale: 0.4,
    transformOrigin: 'center center'
  });

  this.filterTimeline = gsap.timeline({
    paused: true
  });

  this.filterTimeline
    .to(filterShape, {
      duration: 0.65,
      morphSVG: filterBarsTarget,
      ease: 'power2.inOut'
    })
    .to(
      activeDots,
      {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'back.out(1.8)'
      },
      0.25
    );
}

  private filterTimeline?: gsap.core.Timeline;

  toggleFilter(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.filterTimeline) {
      console.warn(
        'Filter timeline is not initialized. Check the filter SVG references in header.html.'
      );
      return;
    }

    this.isFilterOpen = !this.isFilterOpen;

    if (this.isFilterOpen) {
      this.filterTimeline.play();
    } else {
      this.filterTimeline.reverse();
    }
  }

  @HostListener('document:click')
  closeFilterOutside(): void {
    if (!this.isFilterOpen) {
      return;
    }

    this.isFilterOpen = false;
    this.filterTimeline?.reverse();
  }
  // ================================ Filter Btn
  // ================================ Left Side
  activeFilter: FilterType = 'year';
  selectFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }
  // ================================ Left Side

  // ============================== Year List
  years: number[] = [];

  selectedYears: number[] = [];

  toggleYear(year: number): void {
    const index = this.selectedYears.indexOf(year);

    if (index === -1) {
      this.selectedYears.push(year);
    } else {
      this.selectedYears.splice(index, 1);
    }
  }
  resetYears(): void {
    this.selectedYears = [];
  }
  // ============================== Year List
  
  // ============================== Domain List
  domains: string[] = [];

  selectedDomains: string[] = [];

  toggleDomains(domain: string): void {
    const index = this.selectedDomains.indexOf(domain);

    if (index === -1) {
      this.selectedDomains.push(domain);
    } else {
      this.selectedDomains.splice(index, 1);
    }
  }
  resetDomains(): void {
    this.selectedDomains = [];
  }
  // ============================== Domain List

 // =======================================
// Client List Start
// =======================================

agencies: string[] = [];

selectedAgencies: string[] = [];
sortedAgencies: string[] = [...this.agencies];

clientSearch: string = '';

sortOptions: string[] = ['A to Z', 'Z to A'];
selectedSort: string | null = null;

onClientSearch(event: Event): void {
  this.clientSearch = (event.target as HTMLInputElement).value;
  this.updateClientList();
}

private updateClientList(): void {
  const search = this.clientSearch.trim().toLowerCase();

  const filteredAgencies = this.agencies.filter((agency) =>
    agency.toLowerCase().includes(search)
  );

  this.sortedAgencies = this.sortList(
    filteredAgencies,
    this.selectedSort
  );
}

selectSort(option: string): void {
  this.selectedSort = this.selectedSort === option ? null : option;
  this.updateClientList();
}

toggleAgency(agency: string): void {
  const index = this.selectedAgencies.indexOf(agency);

  if (index === -1) {
    this.selectedAgencies.push(agency);
  } else {
    this.selectedAgencies.splice(index, 1);
  }
}

resetClients(): void {
  this.selectedAgencies = [];
  this.selectedSort = null;
  this.clientSearch = '';
  this.updateClientList();
}

// =======================================
// Client List End
// =======================================


// =======================================
// Geo Scope List Start
// =======================================

locations: string[] = [];

selectedLocation: string[] = [];
sortedLocations: string[] = [...this.locations];

locationSearch: string = '';

sortLocationOptions: string[] = ['A to Z', 'Z to A'];
selectedLocationSort: string | null = null;

onLocationSearch(event: Event): void {
  this.locationSearch = (event.target as HTMLInputElement).value;
  this.updateLocationList();
}

private updateLocationList(): void {
  const search = this.locationSearch.trim().toLowerCase();

  const filteredLocations = this.locations.filter((location) =>
    location.toLowerCase().includes(search)
  );

  this.sortedLocations = this.sortList(
    filteredLocations,
    this.selectedLocationSort
  );
}

selectLocationSort(option: string): void {
  this.selectedLocationSort =
    this.selectedLocationSort === option ? null : option;

  this.updateLocationList();
}

toggleLocation(location: string): void {
  const index = this.selectedLocation.indexOf(location);

  if (index === -1) {
    this.selectedLocation.push(location);
  } else {
    this.selectedLocation.splice(index, 1);
  }
}

resetLocations(): void {
  this.selectedLocation = [];
  this.selectedLocationSort = null;
  this.locationSearch = '';
  this.updateLocationList();
}

// =======================================
// Geo Scope List End
// =======================================

  // =======================================
  // Technology List End
  // =======================================
  
  techs: Technology[] = [];

  selectedTech: string[] = [];

  toggleTech(techName: string): void {
    const index = this.selectedTech.indexOf(techName);

    if (index === -1) {
      this.selectedTech.push(techName);
    } else {
      this.selectedTech.splice(index, 1);
    }
  }
  resetTech(): void {
    this.selectedTech = [];
  }
  // =======================================
  // Technology List End
  // =======================================


  // =======================================
  // Common Sort Function
  // =======================================

  private sortList(
    list: string[],
    sortType: string | null
  ): string[] {
    const result = [...list];

    if (sortType === 'A to Z') {
      result.sort((a, b) => a.localeCompare(b));
    }

    if (sortType === 'Z to A') {
      result.sort((a, b) => b.localeCompare(a));
    }

    return result;
  }

  // =====================================
  get appliedFilterCount(): number {
    return [
      this.selectedYears.length > 0,
      this.selectedDomains.length > 0,
      this.selectedAgencies.length > 0,
      this.selectedLocation.length > 0,
      this.selectedTech.length > 0
    ].filter(Boolean).length;
  }

  clearFilterAll(): void {
    this.resetYears();
    this.resetDomains();
    this.resetClients();
    this.resetLocations();
    this.resetTech();

    this.globalSearch = '';
    if (this.globalSearchInput) {
      this.globalSearchInput.value = '';
    }

    this.portfolioFilterService.clearFilters();
  }

  // ================================== Scroll Top
  ngAfterViewInit(): void {
    this.initScrollTopButton();
    this.loadPortfolioFilterOptions();

    // The filter UI is rendered only on /portfolio. Re-bind after route changes.
    this.routerEventsSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        requestAnimationFrame(() => this.bindPortfolioFilterDom());
      });

    requestAnimationFrame(() => this.bindPortfolioFilterDom());
  }

  private loadPortfolioFilterOptions(): void {
    this.projectsSubscription = this.portfolioFilterService
      .loadProjects()
      .subscribe({
        next: projects => {
          const publishedProjects = projects.filter(project =>
            this.portfolioFilterService.isPublished(project)
          );

          this.years = this.portfolioFilterService.getUniqueYears(publishedProjects);
          this.domains = this.portfolioFilterService.getUniqueDomains(publishedProjects);
          this.agencies = this.portfolioFilterService.getUniqueClients(publishedProjects);
          this.sortedAgencies = [...this.agencies];
          this.locations = this.portfolioFilterService.getUniqueLocations(publishedProjects);
          this.sortedLocations = [...this.locations];

          const technologyNames =
            this.portfolioFilterService.getUniqueTechnologies(publishedProjects);

          this.techs = technologyNames.map(name => ({
            name,
            image: this.getTechnologyImage(name),
            alt: name
          }));

          // Keep selected values valid if the database options have changed.
          this.selectedYears = this.selectedYears.filter(value => this.years.includes(value));
          this.selectedDomains = this.selectedDomains.filter(value => this.domains.includes(value));
          this.selectedAgencies = this.selectedAgencies.filter(value => this.agencies.includes(value));
          this.selectedLocation = this.selectedLocation.filter(value => this.locations.includes(value));
          this.selectedTech = this.selectedTech.filter(value =>
            this.techs.some(item => item.name === value)
          );
        },
        error: error => {
          console.error('Unable to load portfolio filter options:', error);
        }
      });
  }

  private getTechnologyImage(name: string): string {
    const value = name.toLowerCase();

    if (value.includes('html')) return 'assets/images/technology/html5.svg';
    if (value.includes('angular')) return 'assets/images/technology/angularjs.svg';
    if (value.includes('react')) return 'assets/images/technology/reactjs.svg';
    if (value.includes('vue')) return 'assets/images/technology/vuejs.svg';
    if (value.includes('typescript')) return 'assets/images/technology/typescript.svg';
    if (value.includes('svelte')) return 'assets/images/technology/svelte.svg';

    // Keep the existing image slot valid for technologies without a dedicated icon.
    return 'assets/images/technology/typescript.svg';
  }

  /**
   * header.html is intentionally left untouched.
   * Its Apply button has no Angular click binding and is marked disabled,
   * so this attaches the action to the existing button from TypeScript.
   */
  private bindPortfolioFilterDom(): void {
    const isPortfolioRoute =
      this.router.url.split('?')[0].split('#')[0] === '/portfolio';

    if (!isPortfolioRoute) {
      this.detachPortfolioFilterDom();
      return;
    }

    const button = document.querySelector<HTMLButtonElement>(
      '.headerFilter .applyFilters'
    );

    if (button && button !== this.applyButton) {
      this.detachApplyButton();
      this.applyButton = button;
      this.applyButton.disabled = false;
      this.applyButton.removeAttribute('disabled');
      this.applyButtonListener = () => this.ngZone.run(() => this.applySelectedFilters());
      this.applyButton.addEventListener('click', this.applyButtonListener);
    } else if (button) {
      button.disabled = false;
      button.removeAttribute('disabled');
    }

    const searchInput = document.querySelector<HTMLInputElement>(
      '.headerFilter .h_filter_box > .h_search input'
    );

    if (searchInput && searchInput !== this.globalSearchInput) {
      this.detachGlobalSearch();
      this.globalSearchInput = searchInput;
      this.globalSearchInput.value = this.globalSearch;

      this.globalSearchListener = (event: Event) => {
        const input = event.target as HTMLInputElement;
        this.ngZone.run(() => {
          this.globalSearch = input.value;
          this.portfolioFilterService.setSearch(this.globalSearch);
        });
      };

      this.globalSearchInput.addEventListener('input', this.globalSearchListener);
    }
  }

  private applySelectedFilters(): void {
    this.portfolioFilterService.applyFilters({
      years: this.selectedYears,
      domains: this.selectedDomains,
      clients: this.selectedAgencies,
      locations: this.selectedLocation,
      technologies: this.selectedTech,
      search: this.globalSearch
    });

    this.isFilterOpen = false;
    this.filterTimeline?.reverse();
  }

  private detachApplyButton(): void {
    if (this.applyButton && this.applyButtonListener) {
      this.applyButton.removeEventListener('click', this.applyButtonListener);
    }

    this.applyButton = undefined;
    this.applyButtonListener = undefined;
  }

  private detachGlobalSearch(): void {
    if (this.globalSearchInput && this.globalSearchListener) {
      this.globalSearchInput.removeEventListener('input', this.globalSearchListener);
    }

    this.globalSearchInput = undefined;
    this.globalSearchListener = undefined;
  }

  private detachPortfolioFilterDom(): void {
    this.detachApplyButton();
    this.detachGlobalSearch();
  }

  ngOnDestroy(): void {
    this.routerEventsSubscription?.unsubscribe();
    this.projectsSubscription?.unsubscribe();
    this.detachPortfolioFilterDom();
    this.filterTimeline?.kill();
    this.scrollTopTween?.kill();
  }

  @ViewChild('scrollTopButton')
  scrollTopButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('scrollProgressCircle')
  scrollProgressCircle!: ElementRef<SVGCircleElement>;

  private readonly scrollTopThreshold = 120;
  private scrollProgressCircumference = 0;
  private scrollTopTween?: gsap.core.Tween;
  private initScrollTopButton(): void {
    const button = this.scrollTopButton?.nativeElement;
    const circle = this.scrollProgressCircle?.nativeElement;

    if (!button || !circle) {
      return;
    }

    const radius = Number(circle.getAttribute('r')) || 20;

    this.scrollProgressCircumference =
      2 * Math.PI * radius;

    button.style.pointerEvents = 'none';

    gsap.set(button, {
      autoAlpha: 0,
      scale: 0.8
    });

    gsap.set(circle, {
      strokeDasharray: this.scrollProgressCircumference,
      strokeDashoffset: this.scrollProgressCircumference,
      rotation: -90,
      transformOrigin: '50% 50%'
    });

    this.updateScrollTopProgress(true);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollTopProgress();
  }

  private updateScrollTopProgress(immediate = false): void {
    const button = this.scrollTopButton?.nativeElement;
    const circle = this.scrollProgressCircle?.nativeElement;

    if (
      !button ||
      !circle ||
      !this.scrollProgressCircumference
    ) {
      return;
    }

    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop;

    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    const scrollableHeight = Math.max(
      scrollHeight - window.innerHeight,
      1
    );

    const progress = Math.min(
      Math.max(scrollTop / scrollableHeight, 0),
      1
    );

    const showButton =
      scrollTop > this.scrollTopThreshold;

    const duration = immediate ? 0 : 0.3;

    gsap.to(button, {
      autoAlpha: showButton ? 1 : 0,
      scale: showButton ? 1 : 0.8,
      duration,
      ease: 'power2.out',
      overwrite: 'auto',
      onStart: () => {
        button.style.pointerEvents =
          showButton ? 'auto' : 'none';
      }
    });

    gsap.to(circle, {
      strokeDashoffset:
        this.scrollProgressCircumference *
        (1 - progress),
      duration,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  scrollToTop(): void {
    this.scrollTopTween?.kill();

    const scrollElement =
      (document.scrollingElement as HTMLElement | null) ??
      document.documentElement;

    this.scrollTopTween = gsap.to(scrollElement, {
      scrollTop: 0,
      duration: 0.3,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate: () => this.updateScrollTopProgress(),
      onComplete: () => this.updateScrollTopProgress()
    });
  }
  // ================================== Scroll Top
  
}