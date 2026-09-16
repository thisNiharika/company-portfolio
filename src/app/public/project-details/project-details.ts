import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { gsap } from 'gsap';
@Component({
  selector: 'app-project-details',
  imports: [],
  templateUrl: './project-details.html',
  styleUrl: './project-details.css',
})
export class ProjectDetails implements AfterViewInit, OnDestroy {
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

  @ViewChild('tabs') tabs!: ElementRef<HTMLUListElement>;

  tabList = ['Overview', 'Branding'];
  activeTab = 'Overview';

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.moveBackground());
    requestAnimationFrame(() => {
      this.animateSlides(true);
      this.startAutoplay();
    });
  }

  selectTab(tab: string): void {
    this.activeTab = tab;

    requestAnimationFrame(() => {
      this.moveBackground();
    });
  }

  private moveBackground(): void {
    const ul = this.tabs.nativeElement;
    const activeLi = ul.querySelector('li.active') as HTMLElement;

    if (!activeLi) return;

    ul.style.setProperty('--tab-left', `${activeLi.offsetLeft}px`);
    ul.style.setProperty('--tab-width', `${activeLi.offsetWidth}px`);
  }

  @HostListener('window:resize')
  

  // ============================================= Slider
  

  @ViewChild('slider', { static: true })
  slider!: ElementRef<HTMLElement>;

  slides = [
    {
      src: 'assets/images/slider_1.jpg',
      alt: 'Slide 1'
    },
    {
      src: 'assets/images/slider_2.jpg',
      alt: 'Slide 2'
    },
    {
      src: 'assets/images/slider_2.jpg',
      alt: 'Slide 3'
    },
    {
      src: 'assets/images/slider_1.jpg',
      alt: 'Slide 4'
    }
  ];

  activeIndex = 0;
  isDragging = false;

  private readonly sideScale = 784 / 1274;

  private dragStartX = 0;
  private dragDistance = 0;
  private sideOffset = 0;
  private pointerId: number | null = null;

  private dragFrame: number | null = null;
  private pendingDragDistance = 0;

  private baseX = new Map<HTMLElement, number>();

  private autoplayTimer:
    ReturnType<typeof setInterval> | undefined;
  private get items(): HTMLElement[] {
    if (!this.slider) {
      return [];
    }

    return Array.from(
      this.slider.nativeElement.querySelectorAll<HTMLElement>('.item')
    );
  }

  private getRelativePosition(
    index: number,
    total: number
  ): number {
    let position = (index - this.activeIndex) % total;

    if (position > total / 2) {
      position -= total;
    }

    if (position < -total / 2) {
      position += total;
    }

    return position;
  }

  private animateSlides(immediate = false): void {
    const items = this.items;

    if (!items.length) {
      return;
    }


    /*
      Side card ko active card ke around position karna hai.
      1274px active width par offset approximately 850px hoga.
    */
    const activeWidth = items[0].offsetWidth;

// 784 / 1274 = 0.615
const sideWidth = activeWidth * this.sideScale;

// 1920px par gap 161px,
// smaller screen par gap responsive rahega
const gap = Math.max(
  24,
  Math.min(161, this.slider.nativeElement.offsetWidth * (161 / 1920))
);

// Active ke edge aur side slide ke edge ke beech gap
this.sideOffset =
  (activeWidth + sideWidth) / 2 + gap;

    gsap.killTweensOf(items);

    items.forEach((item, index) => {
      const position = this.getRelativePosition(
        index,
        items.length
      );

      const isActive = position === 0;
      const isSide = Math.abs(position) === 1;

      const targetX = position * this.sideOffset;

      this.baseX.set(item, targetX);

      gsap.set(item, {
        zIndex: isActive ? 5 : isSide ? 3 : 0
      });

      item.style.pointerEvents =
        isActive || isSide ? 'auto' : 'none';

      const animation = {
        xPercent: -50,
        yPercent: -50,
        x: targetX,
        y: isActive ? 0 : 12,

        // Active: 1
        // Previous/Next: 0.615 = 784 / 1274
        scale: isActive
          ? 1
          : isSide
            ? this.sideScale
            : this.sideScale * 0.85,

        opacity: isActive
          ? 1
          : isSide
            ? 0.72
            : 0,

        rotateY: isActive
          ? 0
          : position > 0
            ? -5
            : 5
      };

      if (immediate) {
        gsap.set(item, animation);
      } else {
        gsap.to(item, {
          ...animation,
          duration: 1.5,
          ease: 'power3.inOut',
          overwrite: 'auto'
        });
      }
    });
  }

  nextSlide(): void {
    if (this.slides.length < 2) {
      return;
    }

    this.activeIndex =
      (this.activeIndex + 1) % this.slides.length;

    this.animateSlides();
  }

  previousSlide(): void {
    if (this.slides.length < 2) {
      return;
    }

    this.activeIndex =
      (this.activeIndex - 1 + this.slides.length) %
      this.slides.length;

    this.animateSlides();
  }

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragDistance = 0;

    this.stopAutoplay();
    gsap.killTweensOf(this.items);

    // Agar animation ke beech drag start ho
    this.items.forEach(item => {
      const currentX = Number(
        gsap.getProperty(item, 'x')
      );

      this.baseX.set(
        item,
        Number.isFinite(currentX) ? currentX : 0
      );
    });

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (
      !this.isDragging ||
      event.pointerId !== this.pointerId
    ) {
      return;
    }

    this.pendingDragDistance =
      event.clientX - this.dragStartX;

    this.dragDistance = this.pendingDragDistance;

    if (Math.abs(this.dragDistance) > 5) {
      event.preventDefault();
    }

    /*
      Har pointer event par GSAP update karne ke bajay
      requestAnimationFrame se smooth update.
    */
    if (this.dragFrame === null) {
      this.dragFrame = requestAnimationFrame(() => {
        this.dragFrame = null;
        this.paintDrag(this.pendingDragDistance);
      });
    }
  }

  private paintDrag(distance: number): void {
    const items = this.items;

    if (!items.length || !this.sideOffset) {
      return;
    }

    const progress = Math.min(
      Math.abs(distance) / this.sideOffset,
      1
    );

    const incomingPosition =
      distance < 0 ? 1 : -1;

    items.forEach((item, index) => {
      const position = this.getRelativePosition(
        index,
        items.length
      );

      const originalX =
        this.baseX.get(item) ?? 0;

      if (position === 0) {
        gsap.set(item, {
          x: originalX + distance,
          scale:
            1 - (1 - this.sideScale) * progress,
          opacity:
            1 - 0.28 * progress
        });
      }

      if (position === incomingPosition) {
        gsap.set(item, {
          x: originalX + distance,
          scale:
            this.sideScale +
            (1 - this.sideScale) * progress,
          opacity:
            0.72 + 0.28 * progress
        });
      }
    });
  }

  onPointerUp(event: PointerEvent): void {
    if (
      !this.isDragging ||
      event.pointerId !== this.pointerId
    ) {
      return;
    }

    if (this.dragFrame !== null) {
      cancelAnimationFrame(this.dragFrame);
      this.dragFrame = null;
    }

    this.paintDrag(this.dragDistance);

    this.isDragging = false;

    const threshold = 60;

    if (Math.abs(this.dragDistance) > threshold) {
      if (this.dragDistance < 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    } else {
      // Threshold se kam drag hone par wapas snap hoga
      this.animateSlides();
    }

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.pointerId = null;
    this.startAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay();

    if (this.slides.length < 2) {
      return;
    }

    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, 40000);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  @HostListener('window:resize')


  ngOnDestroy(): void {
    this.stopAutoplay();

    if (this.dragFrame !== null) {
      cancelAnimationFrame(this.dragFrame);
    }

    gsap.killTweensOf(this.items);
  }
  // ============================================= Slider
  onResize(): void {
    this.moveBackground();
     if (!this.isDragging) {
      requestAnimationFrame(() => {
        this.animateSlides(true);
      });
    }
  }
}
