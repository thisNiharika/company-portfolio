import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, shareReplay } from 'rxjs';

export interface PortfolioFilterState {
  years: number[];
  domains: string[];
  clients: string[];
  locations: string[];
  technologies: string[];
  search: string;
}

export interface PortfolioProjectRecord {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  year?: number | string;
  serialNo?: number;
  coverImage?: string;
  slug?: string;
  status?: string;
  technology?: string | string[] | { name?: string }[];
  technologies?: string | string[] | { name?: string }[];
  detailPage?: {
    overview?: {
      client?: string | string[];
      duration?: string;
      geoScope?: string | string[];
      domain?: string | string[];
      technology?: string | string[] | { name?: string }[];
      technologies?: string | string[] | { name?: string }[];
      [key: string]: unknown;
    };
    technology?: string | string[] | { name?: string }[];
    technologies?: string | string[] | { name?: string }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const EMPTY_PORTFOLIO_FILTERS: PortfolioFilterState = {
  years: [],
  domains: [],
  clients: [],
  locations: [],
  technologies: [],
  search: ''
};

@Injectable({ providedIn: 'root' })
export class PortfolioFilterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl =
    'https://company-portfolio-api.onrender.com/projects';

  private projectsRequest?: Observable<PortfolioProjectRecord[]>;

  private readonly filtersSubject =
    new BehaviorSubject<PortfolioFilterState>({
      ...EMPTY_PORTFOLIO_FILTERS
    });

  readonly filters$ = this.filtersSubject.asObservable();

  loadProjects(): Observable<PortfolioProjectRecord[]> {
    if (!this.projectsRequest) {
      this.projectsRequest = this.http
        .get<unknown>(this.apiUrl)
        .pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response as PortfolioProjectRecord[];
            }

            const data = (response as { data?: unknown } | null)?.data;
            return Array.isArray(data)
              ? data as PortfolioProjectRecord[]
              : [];
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.projectsRequest;
  }

  get currentFilters(): PortfolioFilterState {
    return this.filtersSubject.value;
  }

  applyFilters(filters: PortfolioFilterState): void {
    this.filtersSubject.next({
      years: [...filters.years],
      domains: [...filters.domains],
      clients: [...filters.clients],
      locations: [...filters.locations],
      technologies: [...filters.technologies],
      search: filters.search.trim()
    });
  }

  setSearch(search: string): void {
    this.filtersSubject.next({
      ...this.filtersSubject.value,
      search: search.trim()
    });
  }

  clearFilters(): void {
    this.filtersSubject.next({
      ...EMPTY_PORTFOLIO_FILTERS
    });
  }

  isPublished(project: PortfolioProjectRecord): boolean {
    return String(project.status ?? '').toLowerCase() === 'published';
  }

  getOverview(project: PortfolioProjectRecord): Record<string, unknown> {
    const detailPage = project.detailPage as
      | { overview?: Record<string, unknown> }
      | undefined;

    return (detailPage?.overview ?? project['overview'] ?? {}) as Record<string, unknown>;
  }

  getYear(project: PortfolioProjectRecord): number {
    return Number(project.year) || 0;
  }

  getDomains(project: PortfolioProjectRecord): string[] {
    const overview = this.getOverview(project);
    return this.toStringList(overview['domain'], true);
  }

  getClients(project: PortfolioProjectRecord): string[] {
    const overview = this.getOverview(project);
    return this.toStringList(overview['client'], true);
  }

  getLocations(project: PortfolioProjectRecord): string[] {
    const overview = this.getOverview(project);
    return this.toStringList(
      overview['geoScope'] ?? overview['location'] ?? project['location'],
      true
    );
  }

  getTechnologies(project: PortfolioProjectRecord): string[] {
    const overview = this.getOverview(project);
    const detailPage = project.detailPage ?? {};

    const value =
      project.technologies ??
      project.technology ??
      project['techStack'] ??
      project['technologyStack'] ??
      project['techStacks'] ??
      detailPage['technologies'] ??
      detailPage['technology'] ??
      overview['technologies'] ??
      overview['technology'] ??
      overview['techStack'];

    return this.toStringList(value, true);
  }

  getUniqueYears(projects: PortfolioProjectRecord[]): number[] {
    return [...new Set(
      projects.map(project => this.getYear(project)).filter(year => year > 0)
    )].sort((a, b) => b - a);
  }

  getUniqueDomains(projects: PortfolioProjectRecord[]): string[] {
    return this.unique(projects.flatMap(project => this.getDomains(project)));
  }

  getUniqueClients(projects: PortfolioProjectRecord[]): string[] {
    return this.unique(projects.flatMap(project => this.getClients(project)));
  }

  getUniqueLocations(projects: PortfolioProjectRecord[]): string[] {
    return this.unique(projects.flatMap(project => this.getLocations(project)));
  }

  getUniqueTechnologies(projects: PortfolioProjectRecord[]): string[] {
    return this.unique(projects.flatMap(project => this.getTechnologies(project)));
  }

  matches(project: PortfolioProjectRecord, filters: PortfolioFilterState): boolean {
    if (filters.years.length &&
        !filters.years.includes(this.getYear(project))) {
      return false;
    }

    if (!this.matchesSelectedValues(filters.domains, this.getDomains(project))) {
      return false;
    }

    if (!this.matchesSelectedValues(filters.clients, this.getClients(project))) {
      return false;
    }

    if (!this.matchesSelectedValues(filters.locations, this.getLocations(project))) {
      return false;
    }

    if (!this.matchesSelectedValues(filters.technologies, this.getTechnologies(project))) {
      return false;
    }

    const search = filters.search.trim().toLowerCase();

    if (search) {
      const overview = this.getOverview(project);
      const searchable = [
        project.title,
        project.description,
        project.slug,
        overview['client'],
        overview['domain'],
        overview['geoScope'],
        this.getTechnologies(project).join(' ')
      ]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  }

  private matchesSelectedValues(
    selected: string[],
    actual: string[]
  ): boolean {
    if (!selected.length) {
      return true;
    }

    const normalizedActual = actual.map(value => this.normalize(value));

    return selected.some(value =>
      normalizedActual.includes(this.normalize(value))
    );
  }

  private toStringList(value: unknown, splitStrings: boolean): string[] {
    if (Array.isArray(value)) {
      return value
        .flatMap(item => {
          if (typeof item === 'string' || typeof item === 'number') {
            return [String(item)];
          }

          if (item && typeof item === 'object' && 'name' in item) {
            const name = (item as { name?: unknown }).name;
            return name ? [String(name)] : [];
          }

          return [];
        })
        .map(item => item.trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      const values = splitStrings ? value.split(/[,;]+/) : [value];
      return values.map(item => item.trim()).filter(Boolean);
    }

    if (typeof value === 'number') {
      return [String(value)];
    }

    return [];
  }

  private unique(values: string[]): string[] {
    const seen = new Set<string>();
    return values
      .map(value => value.trim())
      .filter(value => {
        if (!value) return false;
        const key = this.normalize(value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}

