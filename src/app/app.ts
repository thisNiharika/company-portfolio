import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RouteTransitionService } from './core/services/route-transition.service';
import { Header } from './public/layout/header/header';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    Header
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly routeTransition = inject(RouteTransitionService);
  private readonly router =
    inject(Router);
  readonly routeReady =
    signal<boolean>(false);

  readonly isHeaderHidden =
    signal<boolean>(true);

  private readonly headerHiddenRoutes: string[] = [
    '/',
    '/home'
  ];

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        ),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.updateHeaderVisibility(
          event.urlAfterRedirects
        );
        this.routeReady.set(true);
      });
  }

  private updateHeaderVisibility(
    url: string
  ): void {
    const currentPath =
      this.normalizeRoute(url);

    const shouldHide =
      this.headerHiddenRoutes.some(
        (hiddenRoute) =>
          currentPath === hiddenRoute ||
          currentPath.startsWith(
            hiddenRoute + '/'
          )
      );

    this.isHeaderHidden.set(
      shouldHide
    );
  }

  private normalizeRoute(
    url: string
  ): string {
    const path = url
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '');

    return path || '/';
  }
}