import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteTransitionService } from './core/services/route-transition.service';
import { Header } from './public/layout/header/header';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    readonly routeTransition = inject(RouteTransitionService);
}
