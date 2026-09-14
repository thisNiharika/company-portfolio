import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal, inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteTransitionService } from '../../core/services/route-transition.service';
@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements AfterViewInit, OnDestroy {
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

  @ViewChild('itmLoader', { static: false })
  private loaderRef?: ElementRef<HTMLDivElement>;

  // =============================================
  // private readonly loaderStorageKey =
  //   'itm-home-loader-played-v1';

  // readonly showHomeLoader = signal<boolean>(
  //   this.shouldShowHomeLoader()
  // );
  readonly showHomeLoader =
  signal<boolean>(true);
  // =============================================
  readonly homeEntering = signal<boolean>(false);

  private destroyed = false;
  private loaderFinished = false;
  private startFrame: number | null = null;
  private wheelCleanup: (() => void) | null = null;

  private readonly activeAnimations =
    new Set<Animation>();

  // =========================================================
  // Lifecycle
  // =========================================================

  ngAfterViewInit(): void {
    if (!this.showHomeLoader()) {
      return;
    }

    const loader =
      this.loaderRef?.nativeElement;

    if (!loader) {
      this.showHomeLoader.set(false);
      return;
    }

    document.body.classList.add(
      'itm-loader-open'
    );

    this.startFrame =
      window.requestAnimationFrame(() => {
        this.startFrame = null;

        if (this.destroyed) {
          return;
        }

        void this.runHomeLoader(loader);
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    document.body.classList.remove(
      'itm-loader-open'
    );

    if (this.startFrame !== null) {
      window.cancelAnimationFrame(
        this.startFrame
      );

      this.startFrame = null;
    }

    this.wheelCleanup?.();
    this.wheelCleanup = null;

    this.activeAnimations.forEach(
      (animation) => {
        animation.cancel();
      }
    );

    this.activeAnimations.clear();
  }

  // =========================================================
  // Session storage
  // =========================================================

  // private shouldShowHomeLoader(): boolean {
  //   if (typeof window === 'undefined') {
  //     return false;
  //   }

  //   try {
  //     return (
  //       window.sessionStorage.getItem(
  //         this.loaderStorageKey
  //       ) !== '1'
  //     );
  //   } catch {
  //     return true;
  //   }
  // }

  // private markHomeLoaderAsPlayed(): void {
  //   try {
  //     window.sessionStorage.setItem(
  //       this.loaderStorageKey,
  //       '1'
  //     );
  //   } catch {
  //     // Storage unavailable होने पर ignore करें।
  //   }
  // }

  // =========================================================
  // Loader main flow
  // =========================================================

  private async runHomeLoader(
    loader: HTMLDivElement
  ): Promise<void> {
    await this.startLogoAnimation(loader);

    if (this.destroyed) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (reducedMotion) {
      void this.finishHomeLoader(loader);
      return;
    }

    this.startWheelSplitAnimation(loader);
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  }

  private async waitForAnimation(
    animation: Animation
  ): Promise<void> {
    this.activeAnimations.add(animation);

    try {
      await animation.finished;
    } catch {
      // Component destroy होने पर animation cancel हो सकती है।
    } finally {
      this.activeAnimations.delete(animation);
    }
  }

  // =========================================================
  // Logo drawing animation
  // =========================================================

  private async startLogoAnimation(
    loader: HTMLDivElement
  ): Promise<void> {
    const logo =
      loader.querySelector<SVGSVGElement>(
        'svg'
      );

    if (!logo) {
      return;
    }

    const iIcons = Array.from(
      logo.querySelectorAll<SVGGElement>(
        '.i_icon'
      )
    );

    const tIcons = Array.from(
      logo.querySelectorAll<SVGPathElement>(
        'path.t_icon'
      )
    );

    const mIcons = Array.from(
      logo.querySelectorAll<SVGPathElement>(
        'path.m_icon'
      )
    );

    const line =
      logo.querySelector<SVGPathElement>(
        'path.line'
      );

    const text =
      logo.querySelector<SVGGElement>(
        '.text'
      );

    /*
     * HTML dot SVG के बाहर है।
     */
    const zoomDot =
      loader.querySelector<HTMLElement>(
        '.zoom-dot'
      );

    const iPathSteps: SVGPathElement[][] =
      iIcons.length
        ? Array.from(
            iIcons[0].querySelectorAll<
              SVGPathElement
            >('path')
          ).map((_, pathIndex) => {
            return iIcons
              .map((icon) => {
                return icon.querySelectorAll<
                  SVGPathElement
                >('path')[pathIndex];
              })
              .filter(
                (
                  path
                ): path is SVGPathElement =>
                  Boolean(path)
              );
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

    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (reducedMotion) {
      allLogoPaths.forEach((path) => {
        path.style.fill = '#58595b';
        path.style.stroke = 'none';
        path.style.strokeOpacity = '0';
      });

      line.style.clipPath = 'inset(0)';
      line.style.setProperty(
        '-webkit-clip-path',
        'inset(0)'
      );

      text.style.opacity = '1';
      text.style.transform = 'translateY(0)';
      zoomDot.style.opacity = '1';

      return;
    }

    const drawStrokeStep = async (
      paths: SVGPathElement[],
      duration: number
    ): Promise<void> => {
      const animations = paths.map(
        (path) => {
          const pathLength = Math.max(
            path.getTotalLength(),
            1
          );

          path.style.fill = 'transparent';
          path.style.stroke = '#58595b';
          path.style.strokeDasharray =
            `${pathLength} ${pathLength}`;
          path.style.strokeDashoffset =
            String(pathLength);
          path.style.strokeOpacity = '1';

          return path.animate(
            [
              {
                strokeDashoffset:
                  String(pathLength)
              },
              {
                strokeDashoffset: '0'
              }
            ],
            {
              duration,
              easing:
                'cubic-bezier(0.4, 0, 0.2, 1)',
              fill: 'forwards'
            }
          );
        }
      );

      await Promise.all(
        animations.map((animation) =>
          this.waitForAnimation(animation)
        )
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
      const animations = paths.map(
        (path) => {
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
        }
      );

      await Promise.all(
        animations.map((animation) =>
          this.waitForAnimation(animation)
        )
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
        await drawStrokeStep(
          paths,
          strokeDuration
        );

        if (this.destroyed) {
          return;
        }
      }

      await fillTracedPaths(
        pathSteps.flat()
      );
    };

    const drawRedLine =
      async (): Promise<void> => {
        const animation = line.animate(
          [
            {
              clipPath:
                'inset(0 100% 0 0)'
            },
            {
              clipPath:
                'inset(0 0 0 0)'
            }
          ],
          {
            duration: 760,
            easing:
              'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );

        await this.waitForAnimation(
          animation
        );

        if (this.destroyed) {
          return;
        }

        line.style.clipPath =
          'inset(0 0 0 0)';

        line.style.setProperty(
          '-webkit-clip-path',
          'inset(0 0 0 0)'
        );

        animation.cancel();
      };

    const showTagline =
      async (): Promise<void> => {
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

        await this.waitForAnimation(
          animation
        );

        if (this.destroyed) {
          return;
        }

        text.style.opacity = '1';
        text.style.transform = 'translateY(0)';

        animation.cancel();
      };

    /*
     * I animation
     */
    await traceAndFillLetter(
      iPathSteps,
      360
    );

    if (this.destroyed) {
      return;
    }

    await this.wait(80);

    if (this.destroyed) {
      return;
    }

    /*
     * T animation
     */
    await traceAndFillLetter(
      [tIcons],
      760
    );

    if (this.destroyed) {
      return;
    }

    await this.wait(80);

    if (this.destroyed) {
      return;
    }

    /*
     * M animation
     */
    await traceAndFillLetter(
      [mIcons],
      1050
    );

    if (this.destroyed) {
      return;
    }

    await this.wait(120);

    if (this.destroyed) {
      return;
    }

    /*
     * Red line animation
     */
    await drawRedLine();

    if (this.destroyed) {
      return;
    }

    zoomDot.style.opacity = '0';

    /*
     * Tagline animation
     */
    await showTagline();
  }

  // =========================================================
  // Scroll split and equal dot animation
  // =========================================================

  private startWheelSplitAnimation(
    loader: HTMLDivElement
  ): void {
    const upperPart =
      loader.querySelector<SVGGElement>(
        '.logo-above-line'
      );

    const lowerPart =
      loader.querySelector<SVGGElement>(
        '.logo-below-line'
      );

    const lowerText =
      loader.querySelector<SVGGElement>(
        '.logo-text-below-line'
      );

    const redLine =
      loader.querySelector<SVGPathElement>(
        'path.line'
      );

    const zoomDot =
      loader.querySelector<HTMLElement>(
        '.zoom-dot'
      );

    if (
      !upperPart ||
      !lowerPart ||
      !lowerText ||
      !redLine ||
      !zoomDot
    ) {
      void this.finishHomeLoader(loader);
      return;
    }

    let dotStartX =
      window.innerWidth / 2;

    let dotStartY =
      window.innerHeight / 2;

    let initialDotSize = 6;

    /*
     * Dot को SVG red line के center पर रखेगा।
     */
    const positionDotAtLineMiddle =
      (): void => {
        const lineBox =
          redLine.getBBox();

        const centerX =
          lineBox.x +
          lineBox.width / 2;

        let centerY =
          lineBox.y +
          lineBox.height / 2;

        let lineThickness = 5.2;

        if (
          typeof redLine.isPointInFill ===
            'function' &&
          typeof DOMPoint === 'function'
        ) {
          let firstFilledY:
            number | null = null;

          let lastFilledY:
            number | null = null;

          const sampleCount = 600;

          for (
            let index = 0;
            index <= sampleCount;
            index++
          ) {
            const y =
              lineBox.y +
              (
                lineBox.height *
                index
              ) /
                sampleCount;

            if (
              redLine.isPointInFill(
                new DOMPoint(
                  centerX,
                  y
                )
              )
            ) {
              if (
                firstFilledY === null
              ) {
                firstFilledY = y;
              }

              lastFilledY = y;
            }
          }

          if (
            firstFilledY !== null &&
            lastFilledY !== null
          ) {
            centerY =
              (
                firstFilledY +
                lastFilledY
              ) /
              2;

            lineThickness = Math.max(
              lastFilledY -
                firstFilledY,
              5.2
            );
          }
        }

        const matrix =
          redLine.getScreenCTM();

        if (!matrix) {
          return;
        }

        /*
         * SVG coordinates को screen coordinates
         * में convert करना।
         */
        dotStartX =
          matrix.a * centerX +
          matrix.c * centerY +
          matrix.e;

        dotStartY =
          matrix.b * centerX +
          matrix.d * centerY +
          matrix.f;

        const verticalScale =
          Math.hypot(
            matrix.c,
            matrix.d
          ) || 1;

        initialDotSize = Math.max(
          lineThickness *
            verticalScale,
          6
        );

        zoomDot.style.left =
          `${dotStartX}px`;

        zoomDot.style.top =
          `${dotStartY}px`;

        zoomDot.style.width =
          `${initialDotSize}px`;

        zoomDot.style.height =
          `${initialDotSize}px`;

        zoomDot.style.borderRadius =
          '50%';
      };

    positionDotAtLineMiddle();

    let targetProgress = 0;
    let currentProgress = 0;
    let animationFrame: number | null = null;
    let completionStarted = false;
    let lastTouchY: number | null = null;

    const clamp = (
      value: number,
      minimum: number,
      maximum: number
    ): number => {
      return Math.min(
        Math.max(
          value,
          minimum
        ),
        maximum
      );
    };

    const smoothStep = (
      progress: number
    ): number => {
      return (
        progress *
        progress *
        (3 - 2 * progress)
      );
    };

    const renderSplit = (): void => {
      animationFrame = null;

      const difference =
        targetProgress -
        currentProgress;

      if (
        Math.abs(difference) <
        0.0001
      ) {
        currentProgress =
          targetProgress;
      } else {
        currentProgress +=
          difference * 0.12;
      }

      const progress =
        smoothStep(currentProgress);

      /*
       * Logo split movement
       */
      const travelDistance =
        window.innerHeight *
        progress;

      upperPart.style.transform =
        `translate3d(0, ${
          -travelDistance
        }px, 0)`;

      lowerPart.style.transform =
        `translate3d(0, ${
          travelDistance
        }px, 0)`;

      lowerText.style.transform =
        `translate3d(0, ${
          travelDistance
        }px, 0)`;

      /*
       * Dot red line position से
       * viewport center तक जाएगा।
       */
      const dotCenterX =
        dotStartX +
        (
          window.innerWidth / 2 -
          dotStartX
        ) *
          progress;

      const dotCenterY =
        dotStartY +
        (
          window.innerHeight / 2 -
          dotStartY
        ) *
          progress;

      /*
       * Viewport diagonal calculate करेंगे।
       * इससे circle पूरे viewport के
       * corners को भी cover करेगा।
       */
      const targetDotSize =
        Math.hypot(
          window.innerWidth,
          window.innerHeight
        ) + 10;

      /*
       * Width और height दोनों के लिए
       * एक ही currentDotSize रहेगा।
       */
      const currentDotSize =
        initialDotSize +
        (
          targetDotSize -
          initialDotSize
        ) *
          progress;

      zoomDot.style.left =
        `${dotCenterX}px`;

      zoomDot.style.top =
        `${dotCenterY}px`;

      zoomDot.style.width =
        `${currentDotSize}px`;

      zoomDot.style.height =
        `${currentDotSize}px`;

      /*
       * Dot हमेशा perfect circle रहेगा।
       */
      zoomDot.style.borderRadius =
        '50%';

      /*
       * Red से black color animation
       */
      const dotRed = Math.round(
        219 * (1 - progress)
      );

      const dotGreen = Math.round(
        65 * (1 - progress)
      );

      const dotBlue = Math.round(
        76 * (1 - progress)
      );

      zoomDot.style.backgroundColor =
        `rgb(${dotRed}, ${dotGreen}, ${dotBlue})`;

      /*
       * Scroll शुरू होते ही line hide होगी।
       */
      const lineHideProgress =
        clamp(
          progress / 0.08,
          0,
          1
        );

      redLine.style.opacity =
        String(
          1 - lineHideProgress
        );

      redLine.style.visibility =
        lineHideProgress >= 0.999
          ? 'hidden'
          : 'visible';

      zoomDot.style.opacity =
        progress > 0.0001
          ? '1'
          : '0';

      /*
       * Full viewport cover होने पर
       * loader finish होगा।
       */
      if (
        targetProgress >= 1 &&
        currentProgress >= 0.9999 &&
        !completionStarted
      ) {
        completionStarted = true;

        void this.finishHomeLoader(
          loader
        );

        return;
      }

      /*
       * Reverse scroll पर currentProgress
       * कम होगा, इसलिए dot की width और
       * height बराबर decrease होंगी।
       */
      if (
        currentProgress !==
        targetProgress
      ) {
        animationFrame =
          window.requestAnimationFrame(
            renderSplit
          );
      }
    };

    const updateTargetProgress = (
      inputDistance: number
    ): void => {
      targetProgress = clamp(
        targetProgress +
          inputDistance * 0.0015,
        0,
        1
      );

      if (animationFrame === null) {
        animationFrame =
          window.requestAnimationFrame(
            renderSplit
          );
      }
    };

    /*
     * Desktop mouse wheel
     */
    const handleWheel = (
      event: WheelEvent
    ): void => {
      event.preventDefault();

      let wheelDistance =
        event.deltaY;

      if (
        event.deltaMode ===
        WheelEvent.DOM_DELTA_LINE
      ) {
        wheelDistance *= 16;
      } else if (
        event.deltaMode ===
        WheelEvent.DOM_DELTA_PAGE
      ) {
        wheelDistance *=
          window.innerHeight;
      }

      updateTargetProgress(
        wheelDistance
      );
    };

    /*
     * Mobile touch
     */
    const handleTouchStart = (
      event: TouchEvent
    ): void => {
      const touch =
        event.touches.item(0);

      lastTouchY =
        touch?.clientY ?? null;
    };

    const handleTouchMove = (
      event: TouchEvent
    ): void => {
      const touch =
        event.touches.item(0);

      if (
        !touch ||
        lastTouchY === null
      ) {
        return;
      }

      event.preventDefault();

      const touchDistance =
        lastTouchY -
        touch.clientY;

      lastTouchY =
        touch.clientY;

      updateTargetProgress(
        touchDistance
      );
    };

    const handleTouchEnd =
      (): void => {
        lastTouchY = null;
      };

    /*
     * Screen resize
     */
    const handleResize =
      (): void => {
        positionDotAtLineMiddle();

        if (
          animationFrame === null
        ) {
          animationFrame =
            window.requestAnimationFrame(
              renderSplit
            );
        }
      };

    loader.addEventListener(
      'wheel',
      handleWheel,
      {
        passive: false
      }
    );

    loader.addEventListener(
      'touchstart',
      handleTouchStart,
      {
        passive: true
      }
    );

    loader.addEventListener(
      'touchmove',
      handleTouchMove,
      {
        passive: false
      }
    );

    loader.addEventListener(
      'touchend',
      handleTouchEnd
    );

    window.addEventListener(
      'resize',
      handleResize
    );

    renderSplit();

    this.wheelCleanup = (): void => {
      loader.removeEventListener(
        'wheel',
        handleWheel
      );

      loader.removeEventListener(
        'touchstart',
        handleTouchStart
      );

      loader.removeEventListener(
        'touchmove',
        handleTouchMove
      );

      loader.removeEventListener(
        'touchend',
        handleTouchEnd
      );

      window.removeEventListener(
        'resize',
        handleResize
      );

      if (
        animationFrame !== null
      ) {
        window.cancelAnimationFrame(
          animationFrame
        );

        animationFrame = null;
      }
    };
  }

  // =========================================================
  // Loader finish
  // =========================================================

  private async finishHomeLoader(
    loader: HTMLDivElement
  ): Promise<void> {
    if (
      this.loaderFinished ||
      this.destroyed
    ) {
      return;
    }

    this.loaderFinished = true;

    this.wheelCleanup?.();
    this.wheelCleanup = null;

    /*
     * Fullscreen circle थोड़ी देर दिखेगा।
     */
    await this.wait(180);

    if (this.destroyed) {
      return;
    }

    this.homeEntering.set(true);

    loader.classList.add(
      'is-leaving'
    );

    await this.wait(380);

    if (this.destroyed) {
      return;
    }

    document.body.classList.remove(
      'itm-loader-open'
    );

    this.showHomeLoader.set(false);
  }
}