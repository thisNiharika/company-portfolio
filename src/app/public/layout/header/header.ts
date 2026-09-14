import { Component, inject } from '@angular/core';
import { RouteTransitionService } from '../../../core/services/route-transition.service';
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
}
