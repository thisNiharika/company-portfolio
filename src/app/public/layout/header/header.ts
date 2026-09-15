import { Component, inject } from '@angular/core';
import { RouteTransitionService } from '../../../core/services/route-transition.service';
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


  isFilterOpen = false;

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }
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
  
}
