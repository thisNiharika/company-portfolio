import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteTransitionService } from '../../core/services/route-transition.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
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
  // ======================================= Loader Start
  @ViewChild('itmLoader', { static: true })
  private loaderRef!: ElementRef<HTMLDivElement>;

  private destroyed = false;
  private startFrame: number | null = null;
  private wheelCleanup: (() => void) | null = null;
  private readonly activeAnimations = new Set<Animation>();

  ngAfterViewInit(): void {
    this.startFrame = window.requestAnimationFrame(() => {
      if (this.destroyed) {
        return;
      }

      const loader = this.loaderRef.nativeElement;

      void this.startLogoAnimation(loader);
      this.startWheelSplitAnimation(loader);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.startFrame !== null) {
      window.cancelAnimationFrame(this.startFrame);
      this.startFrame = null;
    }

    this.wheelCleanup?.();
    this.wheelCleanup = null;

    this.activeAnimations.forEach((animation) => animation.cancel());
    this.activeAnimations.clear();
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  }

  private async waitForAnimation(animation: Animation): Promise<void> {
    this.activeAnimations.add(animation);

    try {
      await animation.finished;
    } catch {
      // Component destroy hone par cancel() finished promise reject karta hai.
    } finally {
      this.activeAnimations.delete(animation);
    }
  }

  private async startLogoAnimation(loader: HTMLDivElement): Promise<void> {
    const logo = loader.querySelector<SVGSVGElement>('svg');

    if (!logo) {
      return;
    }

    const iIcons = Array.from(
      logo.querySelectorAll<SVGGElement>('.i_icon')
    );
    const tIcons = Array.from(
      logo.querySelectorAll<SVGPathElement>('path.t_icon')
    );
    const mIcons = Array.from(
      logo.querySelectorAll<SVGPathElement>('path.m_icon')
    );
    const line = logo.querySelector<SVGPathElement>('path.line');
    const text = logo.querySelector<SVGGElement>('.text');
    const zoomDot = logo.querySelector<SVGCircleElement>('.zoom-dot');

    const iPathSteps: SVGPathElement[][] = iIcons.length
      ? Array.from(
          iIcons[0].querySelectorAll<SVGPathElement>('path')
        ).map((_, pathIndex) => {
          return iIcons
            .map((icon) => {
              return icon.querySelectorAll<SVGPathElement>('path')[pathIndex];
            })
            .filter((path): path is SVGPathElement => Boolean(path));
        })
      : [];

    const allLogoPaths: SVGPathElement[] = [
      ...iPathSteps.flat(),
      ...tIcons,
      ...mIcons
    ];

    if (
      !iIcons.length ||
      !iPathSteps.length ||
      !tIcons.length ||
      !mIcons.length ||
      !line ||
      !text ||
      !zoomDot
    ) {
      return;
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reducedMotion) {
      allLogoPaths.forEach((path) => {
        path.style.fill = '#58595b';
        path.style.stroke = 'none';
        path.style.strokeOpacity = '0';
      });

      line.style.clipPath = 'inset(0)';
      line.style.setProperty('-webkit-clip-path', 'inset(0)');
      text.style.opacity = '1';
      text.style.transform = 'translateY(0)';
      zoomDot.style.opacity = '1';
      return;
    }

    const drawStrokeStep = async (
      paths: SVGPathElement[],
      duration: number
    ): Promise<void> => {
      const animations = paths.map((path) => {
        const pathLength = Math.max(path.getTotalLength(), 1);

        path.style.fill = 'transparent';
        path.style.stroke = '#58595b';
        path.style.strokeDasharray = `${pathLength} ${pathLength}`;
        path.style.strokeDashoffset = String(pathLength);
        path.style.strokeOpacity = '1';

        return path.animate(
          [
            { strokeDashoffset: String(pathLength) },
            { strokeDashoffset: '0' }
          ],
          {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
          }
        );
      });

      await Promise.all(
        animations.map((animation) => this.waitForAnimation(animation))
      );

      if (this.destroyed) {
        return;
      }

      paths.forEach((path, index) => {
        path.style.strokeDashoffset = '0';
        animations[index].cancel();
      });
    };

    const fillTracedPaths = async (
      paths: SVGPathElement[]
    ): Promise<void> => {
      const animations = paths.map((path) => {
        return path.animate(
          [
            {
              fill: 'rgba(88, 89, 91, 0)',
              strokeOpacity: 1
            },
            {
              fill: '#58595b',
              strokeOpacity: 0.75,
              offset: 0.65
            },
            {
              fill: '#58595b',
              strokeOpacity: 0
            }
          ],
          {
            duration: 260,
            easing: 'ease-out',
            fill: 'forwards'
          }
        );
      });

      await Promise.all(
        animations.map((animation) => this.waitForAnimation(animation))
      );

      if (this.destroyed) {
        return;
      }

      paths.forEach((path, index) => {
        path.style.fill = '#58595b';
        path.style.strokeOpacity = '0';
        animations[index].cancel();
      });
    };

    const traceAndFillLetter = async (
      pathSteps: SVGPathElement[][],
      strokeDuration: number
    ): Promise<void> => {
      for (const paths of pathSteps) {
        await drawStrokeStep(paths, strokeDuration);

        if (this.destroyed) {
          return;
        }
      }

      await fillTracedPaths(pathSteps.flat());
    };

    const drawRedLine = async (): Promise<void> => {
      const animation = line.animate(
        [
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0 0 0)' }
        ],
        {
          duration: 760,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        }
      );

      await this.waitForAnimation(animation);

      if (this.destroyed) {
        return;
      }

      line.style.clipPath = 'inset(0 0 0 0)';
      line.style.setProperty('-webkit-clip-path', 'inset(0 0 0 0)');
      animation.cancel();
    };

    const showTagline = async (): Promise<void> => {
      const animation = text.animate(
        [
          {
            opacity: 0,
            transform: 'translateY(5px)'
          },
          {
            opacity: 1,
            transform: 'translateY(0)'
          }
        ],
        {
          duration: 500,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );

      await this.waitForAnimation(animation);

      if (this.destroyed) {
        return;
      }

      text.style.opacity = '1';
      text.style.transform = 'translateY(0)';
      animation.cancel();
    };

    await traceAndFillLetter(iPathSteps, 360);
    if (this.destroyed) return;

    await this.wait(80);
    if (this.destroyed) return;

    await traceAndFillLetter([tIcons], 760);
    if (this.destroyed) return;

    await this.wait(80);
    if (this.destroyed) return;

    await traceAndFillLetter([mIcons], 1050);
    if (this.destroyed) return;

    await this.wait(120);
    if (this.destroyed) return;

    await drawRedLine();
    if (this.destroyed) return;

    zoomDot.style.opacity = '0';
    await showTagline();
  }

  private startWheelSplitAnimation(loader: HTMLDivElement): void {
    const upperPart = loader.querySelector<SVGGElement>('.logo-above-line');
    const lowerPart = loader.querySelector<SVGGElement>('.logo-below-line');
    const lowerText = loader.querySelector<SVGGElement>(
      '.logo-text-below-line'
    );
    const redLine = loader.querySelector<SVGPathElement>('path.line');
    const zoomDot = loader.querySelector<SVGCircleElement>('.zoom-dot');

    if (!upperPart || !lowerPart || !lowerText || !redLine || !zoomDot) {
      return;
    }

    const positionDotAtLineMiddle = (): void => {
      const lineBox = redLine.getBBox();
      const centerX = lineBox.x + lineBox.width / 2;
      let centerY = lineBox.y + lineBox.height / 2;
      let lineThickness = 5.2;

      if (
        typeof redLine.isPointInFill === 'function' &&
        typeof DOMPoint === 'function'
      ) {
        let firstFilledY: number | null = null;
        let lastFilledY: number | null = null;
        const sampleCount = 600;

        for (let index = 0; index <= sampleCount; index++) {
          const y = lineBox.y + (lineBox.height * index) / sampleCount;

          if (redLine.isPointInFill(new DOMPoint(centerX, y))) {
            if (firstFilledY === null) {
              firstFilledY = y;
            }

            lastFilledY = y;
          }
        }

        if (firstFilledY !== null && lastFilledY !== null) {
          centerY = (firstFilledY + lastFilledY) / 2;
          lineThickness = Math.max(lastFilledY - firstFilledY, 5.2);
        }
      }

      zoomDot.setAttribute('cx', String(centerX));
      zoomDot.setAttribute('cy', String(centerY));
      zoomDot.setAttribute('r', String(lineThickness / 2));
    };

    positionDotAtLineMiddle();

    let targetProgress = 0;
    let currentProgress = 0;
    let animationFrame: number | null = null;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const clamp = (
      value: number,
      minimum: number,
      maximum: number
    ): number => {
      return Math.min(Math.max(value, minimum), maximum);
    };

    const smoothStep = (progress: number): number => {
      return progress * progress * (3 - 2 * progress);
    };

    const renderSplit = (): void => {
      const difference = targetProgress - currentProgress;

      if (Math.abs(difference) < 0.0001) {
        currentProgress = targetProgress;
      } else {
        currentProgress += difference * (reducedMotion ? 1 : 0.12);
      }

      const progress = smoothStep(currentProgress);
      const travelDistance = window.innerHeight * progress;

      upperPart.style.transform =
        `translate3d(0, ${-travelDistance}px, 0)`;
      lowerPart.style.transform =
        `translate3d(0, ${travelDistance}px, 0)`;
      lowerText.style.transform =
        `translate3d(0, ${travelDistance}px, 0)`;

      const scaleProgress = clamp(progress, 0, 1);
      const dotScale = Math.pow(100, scaleProgress);

      zoomDot.style.transform = `scale(${dotScale})`;

      const dotRed = Math.round(219 * (1 - scaleProgress));
      const dotGreen = Math.round(65 * (1 - scaleProgress));
      const dotBlue = Math.round(76 * (1 - scaleProgress));

      zoomDot.style.fill = `rgb(${dotRed}, ${dotGreen}, ${dotBlue})`;

      const lineHideProgress = clamp(progress / 0.08, 0, 1);

      redLine.style.opacity = String(1 - lineHideProgress);
      redLine.style.visibility =
        lineHideProgress >= 0.999 ? 'hidden' : 'visible';
      zoomDot.style.opacity = progress > 0.0001 ? '1' : '0';

      if (currentProgress !== targetProgress) {
        animationFrame = window.requestAnimationFrame(renderSplit);
      } else {
        animationFrame = null;
      }
    };

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();

      let wheelDistance = event.deltaY;

      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        wheelDistance *= 16;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        wheelDistance *= window.innerHeight;
      }

      targetProgress = clamp(
        targetProgress + wheelDistance * 0.0015,
        0,
        1
      );

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(renderSplit);
      }
    };

    loader.addEventListener('wheel', handleWheel, { passive: false });
    renderSplit();

    this.wheelCleanup = (): void => {
      loader.removeEventListener('wheel', handleWheel);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };
  }
  // ======================================= Loader End

}
