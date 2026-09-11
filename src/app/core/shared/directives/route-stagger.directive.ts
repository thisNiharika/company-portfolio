import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  inject
} from '@angular/core';

@Directive({
  selector: '[routeStagger]',
  standalone: true
})
export class RouteStaggerDirective
  implements AfterViewInit, OnDestroy {

  private readonly elementRef =
    inject<ElementRef<HTMLElement>>(ElementRef);

  /*
   हर element के बीच delay.
   Default: 100ms
  */
  @Input() routeStagger = 100;

  /*
   First element का starting delay.
   Default: 100ms
  */
  @Input() routeStaggerStart = 100;

  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.applyStaggerDelay();

    /*
     Dynamic *ngFor या API content आने पर
     delays दोबारा calculate होंगे.
    */
    this.observer = new MutationObserver(() => {
      this.applyStaggerDelay();
    });

    this.observer.observe(
      this.elementRef.nativeElement,
      {
        childList: true,
        subtree: true
      }
    );
  }

  private applyStaggerDelay(): void {
    const elements =
      this.elementRef.nativeElement
        .querySelectorAll<HTMLElement>('.route-animate');

    elements.forEach((element, index) => {
      const delay =
        this.routeStaggerStart +
        index * this.routeStagger;

      element.style.setProperty(
        '--route-delay',
        `${delay}ms`
      );
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}