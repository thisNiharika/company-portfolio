import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

type TransitionPhase =
  | 'idle'
  | 'cover'
  | 'switching'
  | 'show';

interface NavigationAnimationOptions {
  /*
   Panels cover होने के बाद content show होने से पहले wait.
  */
  contentShowDelay?: number;

  /*
   Animation के दौरान दोबारा navigation रोकने का time.
  */
  navigationLockDuration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RouteTransitionService {
  readonly phase = signal<TransitionPhase>('idle');

  private readonly router = inject(Router);

  /*
   Red panel: 1s
   White panel delay: 1.5s
   White panel duration: 1s
   Total: 2.5s
  */
  private readonly panelSequenceDuration = 2500;

  private isAnimating = false;

  async navigate(
    url: string,
    event?: MouseEvent,
    options: NavigationAnimationOptions = {}
  ): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isAnimating || this.router.url === url) {
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

      await this.wait(this.panelSequenceDuration);

      // Content hide और panels को screen पर रोकें
      this.phase.set('switching');

      await this.nextFrame();

      // Panels के पीछे route change
      await this.router.navigateByUrl(url);

      // New component render होने दें
      await this.nextFrame();
      await this.nextFrame();

      // Manual content show delay
      if (contentShowDelay > 0) {
        await this.wait(contentShowDelay);
      }

      // Panels hide और content animations start
      this.phase.set('show');

      // User interaction को कुछ समय lock रखें
      await this.wait(navigationLockDuration);

      /*
       यहां phase को idle नहीं करना है।
       show class next navigation तक रहेगी।
      */
    } catch (error) {
      this.phase.set('idle');
      throw error;
    } finally {
      this.isAnimating = false;
    }
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
}