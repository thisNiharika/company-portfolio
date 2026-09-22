import { Component, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { RouteTransitionService } from '../../../core/services/route-transition.service';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
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

export class Header {
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
  // ================================ Filter Btn
  isFilterOpen = false;
  @ViewChild('filterShape')
  filterShape!: ElementRef<SVGPathElement>;

  @ViewChild('filterBarsTarget')
  filterBarsTarget!: ElementRef<SVGPathElement>;

  @ViewChild('activeDots')
  activeDots!: ElementRef<SVGPathElement>;

  private filterTimeline!: gsap.core.Timeline;
  toggleFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.isFilterOpen = !this.isFilterOpen;
    if (this.isFilterOpen) {
      this.filterTimeline.play();
    } else {
      this.filterTimeline.reverse();
    }
  }
  @HostListener('document:click')
  closeFilterOutside(): void {
    this.isFilterOpen = false;
    this.filterTimeline.reverse();
  }
  // ================================ Filter Btn
  // ================================ Left Side
  activeFilter: FilterType = 'year';
  selectFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }
  // ================================ Left Side

  // ============================== Year List
  years: number[] = [
    2026, 2025, 2024, 2023, 2022, 2021,
    2020, 2019, 2018, 2017, 2016
  ];

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
  domains: string[] = [
    'Digital',
    'Health',
    'Education',
    'Environment'
  ];

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

agencies: string[] = [
  'UNICEF',
  'WHO',
  'UNAIDS',
  'UNFPA',
  'UNDP',
  'UN Women',
  'Giz',
  'ADB',
  'SADC'
];

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

locations: string[] = [
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cameroon',
  'Cabo Verde',
  'Central African Republic'
];

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
  
  techs: Technology[] = [
    {
      name: 'HTML 5',
      image: 'assets/images/technology/html5.svg',
      alt: 'HTML 5'
    },
    {
      name: 'Angular JS',
      image: 'assets/images/technology/angularjs.svg',
      alt: 'Angular JS'
    },
    {
      name: 'React',
      image: 'assets/images/technology/reactjs.svg',
      alt: 'React Js'
    },
    {
      name: 'Vue JS',
      image: 'assets/images/technology/vuejs.svg',
      alt: 'Vue JS'
    },
    {
      name: 'TypeScript',
      image: 'assets/images/technology/typescript.svg',
      alt: 'TypeScript'
    },
    {
      name: 'SVELTE',
      image: 'assets/images/technology/svelte.svg',
      alt: 'Svelte'
    }
  ];

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
  }

  // ================================== Scroll Top
  ngAfterViewInit(): void {
    this.initScrollTopButton();
    // ================================ Filter Btn
    gsap.set(this.activeDots.nativeElement, {
      opacity: 0,
      scale: 0.4,
      transformOrigin: 'center center'
    });

    this.filterTimeline = gsap.timeline({
      paused: true
    });

    this.filterTimeline
      .to(this.filterShape.nativeElement, {
        duration: 0.65,
        morphSVG: this.filterBarsTarget.nativeElement,
        ease: 'power2.inOut'
      })
      .to(
        this.activeDots.nativeElement,
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.8)'
        },
        0.25
      );
    // ================================ Filter Btn
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
