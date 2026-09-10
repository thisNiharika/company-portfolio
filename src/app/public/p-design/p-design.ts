import { Component, inject } from '@angular/core';
import { RouteTransitionService } from '../../core/services/route-transition.service';

@Component({
  selector: 'app-p-design',
  imports: [],
  templateUrl: './p-design.html',
  styleUrl: './p-design.css',
})
export class PDesign {
  readonly routeTransition = inject(RouteTransitionService);
  goTo(url: string, event: MouseEvent): void {
    void this.routeTransition.navigate(url, event);
  }
}
