import {
  inject,
  Injectable,
  signal
} from '@angular/core';

import { ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';

type TransitionPhase =
  | 'idle'
  | 'cover'
  | 'switching'
  | 'show';

interface NavigationAnimationOptions {
  contentShowDelay?: number;
  navigationLockDuration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RouteTransitionService {
  readonly phase = signal<TransitionPhase>('idle');

  private readonly router = inject(Router);

  private readonly viewportScroller =
    inject(ViewportScroller);

  private readonly panelSequenceDuration = 2500;

  private isAnimating = false;

  async navigate(
    url: string,
    event?: MouseEvent,
    options: NavigationAnimationOptions = {}
  ): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isAnimating) {
      return;
    }

    if (this.router.url === url) {
      this.scrollPageToTop();
      return;
    }

    const {
      contentShowDelay = 0,
      navigationLockDuration = 1000
    } = options;

    this.isAnimating = true;

    try {
      // Panel animation start
      this.phase.set('cover');

      await this.wait(
        this.panelSequenceDuration
      );

      // Route content hidden रहेगा
      this.phase.set('switching');

      await this.nextFrame();

      // Hidden panels के पीछे route change
      const navigationSuccessful =
        await this.router.navigateByUrl(url);

      if (!navigationSuccessful) {
        this.phase.set('idle');
        return;
      }

      // New component render
      await this.nextFrame();
      await this.nextFrame();

      // पहले scroll top
      this.scrollPageToTop();

      await this.nextFrame();

      // Scroll position confirm
      this.scrollPageToTop();

      await this.nextFrame();

      // Optional content delay
      if (contentShowDelay > 0) {
        await this.wait(contentShowDelay);
      }

      // Scroll top के बाद content show
      this.phase.set('show');

      await this.wait(
        navigationLockDuration
      );
    } catch (error) {
      this.phase.set('idle');
      throw error;
    } finally {
      this.isAnimating = false;
    }
  }

  private scrollPageToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });

    document.scrollingElement?.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document
      .querySelector<HTMLElement>('.route-page-content')
      ?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}