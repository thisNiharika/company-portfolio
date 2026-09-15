import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { CanvasVideo } from './canvas-video/canvas-video';
interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

interface SvgTargetConfig {
  element: HTMLElement;
  selector: string;
}

@Component({
  selector: 'app-summary',
  imports: [CanvasVideo],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
  encapsulation: ViewEncapsulation.None
})
export class Summary implements AfterViewInit, OnDestroy {
  @ViewChild('homePage', { static: true })
  private homePage!: ElementRef<HTMLElement>;

  private destroyed = false;
  private readonly cleanupCallbacks: Array<() => void> = [];
  private readonly timeoutIds = new Set<number>();
  private readonly frameIds = new Set<number>();

  ngAfterViewInit(): void {
    this.requestFrame(() => {
      const root = this.homePage.nativeElement;
      this.initializeParticles(root);
      this.initializeStarScene(root);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    for (const cleanup of this.cleanupCallbacks.splice(0)) {
      cleanup();
    }

    for (const timeoutId of this.timeoutIds) {
      window.clearTimeout(timeoutId);
    }
    this.timeoutIds.clear();

    for (const frameId of this.frameIds) {
      window.cancelAnimationFrame(frameId);
    }
    this.frameIds.clear();
  }

  private schedule(callback: () => void, delay: number): number {
    const timeoutId = window.setTimeout(() => {
      this.timeoutIds.delete(timeoutId);

      if (!this.destroyed) {
        callback();
      }
    }, delay);

    this.timeoutIds.add(timeoutId);
    return timeoutId;
  }

  private clearScheduled(timeoutId: number | null): void {
    if (timeoutId === null) {
      return;
    }

    window.clearTimeout(timeoutId);
    this.timeoutIds.delete(timeoutId);
  }

  private requestFrame(callback: FrameRequestCallback): number {
    let frameId = 0;

    frameId = window.requestAnimationFrame((timestamp) => {
      this.frameIds.delete(frameId);

      if (!this.destroyed) {
        callback(timestamp);
      }
    });

    this.frameIds.add(frameId);
    return frameId;
  }

  private cancelFrame(frameId: number | null): void {
    if (frameId === null) {
      return;
    }

    window.cancelAnimationFrame(frameId);
    this.frameIds.delete(frameId);
  }

  // =========================================================
  // STEP 1, STEP 2 AND STEP 3 PARTICLES
  // =========================================================

  private initializeParticles(root: HTMLElement): void {
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('.particles-section')
    );

    if (
      !sections.length ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    sections.forEach((section) => {
      const canvas =
        section.querySelector<HTMLCanvasElement>('.section-particles');
      const context = canvas?.getContext('2d');

      if (!canvas || !context) {
        return;
      }

      const mouse = {
        x: -1000,
        y: -1000,
        radius: 135,
        active: false
      };

      let particles: Particle[] = [];
      let canvasWidth = 0;
      let canvasHeight = 0;
      let animationFrame: number | null = null;
      let resizeFrame: number | null = null;
      let isVisible = false;

      const random = (minimum: number, maximum: number): number => {
        return Math.random() * (maximum - minimum) + minimum;
      };

      const createParticles = (): void => {
        const maximum = window.innerWidth < 768 ? 55 : 90;
        const count = Math.max(
          32,
          Math.min(
            maximum,
            Math.round((canvasWidth * canvasHeight) / 12000)
          )
        );

        particles = Array.from({ length: count }, () => ({
          x: random(0, canvasWidth),
          y: random(0, canvasHeight),
          radius: random(1, 3.2),
          speedX: random(-0.35, 0.35),
          speedY: random(-0.35, 0.35),
          opacity: random(0.25, 0.85),
          color:
            Math.random() > 0.5 ? '170, 170, 220' : '255, 255, 255'
        }));
      };

      const resizeCanvas = (): void => {
        const rectangle = section.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvasWidth = Math.max(1, rectangle.width);
        canvasHeight = Math.max(1, rectangle.height);
        canvas.width = Math.round(canvasWidth * pixelRatio);
        canvas.height = Math.round(canvasHeight * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        createParticles();
      };

      const updateParticle = (particle: Particle): void => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < -5) particle.x = canvasWidth + 5;
        if (particle.x > canvasWidth + 5) particle.x = -5;
        if (particle.y < -5) particle.y = canvasHeight + 5;
        if (particle.y > canvasHeight + 5) particle.y = -5;

        const differenceX = particle.x - mouse.x;
        const differenceY = particle.y - mouse.y;
        const distance = Math.hypot(differenceX, differenceY);

        if (mouse.active && distance > 0 && distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          particle.x += (differenceX / distance) * force * 1.8;
          particle.y += (differenceY / distance) * force * 1.8;
        }
      };

      const drawConnections = (): void => {
        const connectionDistance = window.innerWidth < 768 ? 85 : 115;

        for (let firstIndex = 0; firstIndex < particles.length; firstIndex++) {
          for (
            let secondIndex = firstIndex + 1;
            secondIndex < particles.length;
            secondIndex++
          ) {
            const firstParticle = particles[firstIndex]!;
            const secondParticle = particles[secondIndex]!;
            const differenceX = firstParticle.x - secondParticle.x;
            const differenceY = firstParticle.y - secondParticle.y;
            const distance = Math.hypot(differenceX, differenceY);

            if (distance < connectionDistance) {
              const opacity =
                (1 - distance / connectionDistance) * 0.22;

              context.beginPath();
              context.moveTo(firstParticle.x, firstParticle.y);
              context.lineTo(secondParticle.x, secondParticle.y);
              context.strokeStyle = `rgba(170, 170, 220, ${opacity})`;
              context.lineWidth = 0.7;
              context.stroke();
            }
          }
        }
      };

      const drawMouseEffect = (): void => {
        if (!mouse.active) {
          return;
        }

        particles.forEach((particle) => {
          const differenceX = particle.x - mouse.x;
          const differenceY = particle.y - mouse.y;
          const distance = Math.hypot(differenceX, differenceY);

          if (distance < mouse.radius) {
            const opacity = (1 - distance / mouse.radius) * 0.5;

            context.beginPath();
            context.moveTo(mouse.x, mouse.y);
            context.lineTo(particle.x, particle.y);
            context.strokeStyle = `rgba(108, 110, 245, ${opacity})`;
            context.lineWidth = 0.8;
            context.stroke();
          }
        });

        const glow = context.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          28
        );

        glow.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        glow.addColorStop(0.25, 'rgba(108, 110, 245, 0.28)');
        glow.addColorStop(1, 'rgba(108, 110, 245, 0)');

        context.beginPath();
        context.arc(mouse.x, mouse.y, 28, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
      };

      const animate = (): void => {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        drawConnections();

        particles.forEach((particle) => {
          updateParticle(particle);
          context.beginPath();
          context.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
          );
          context.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
          context.shadowBlur = particle.radius * 4;
          context.shadowColor = `rgba(${particle.color}, 0.7)`;
          context.fill();
        });

        drawMouseEffect();
        context.shadowBlur = 0;
        animationFrame = this.requestFrame(animate);
      };

      const startAnimation = (): void => {
        if (animationFrame !== null || !isVisible) {
          return;
        }

        animationFrame = this.requestFrame(animate);
      };

      const stopAnimation = (): void => {
        this.cancelFrame(animationFrame);
        animationFrame = null;
      };

      const handlePointerMove = (event: PointerEvent): void => {
        const rectangle = section.getBoundingClientRect();
        mouse.x = event.clientX - rectangle.left;
        mouse.y = event.clientY - rectangle.top;
        mouse.active = true;
      };

      const handlePointerLeave = (): void => {
        mouse.x = -1000;
        mouse.y = -1000;
        mouse.active = false;
      };

      const handleResize = (): void => {
        this.cancelFrame(resizeFrame);
        resizeFrame = this.requestFrame(() => {
          resizeFrame = null;
          resizeCanvas();
        });
      };

      section.addEventListener('pointermove', handlePointerMove);
      section.addEventListener('pointerleave', handlePointerLeave);
      window.addEventListener('resize', handleResize, { passive: true });

      resizeCanvas();

      let observer: IntersectionObserver | null = null;

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            isVisible = entries[0]?.isIntersecting ?? false;

            if (isVisible) {
              startAnimation();
            } else {
              stopAnimation();
            }
          },
          { threshold: 0.05 }
        );

        observer.observe(section);
      } else {
        isVisible = true;
        startAnimation();
      }

      this.cleanupCallbacks.push(() => {
        observer?.disconnect();
        stopAnimation();
        this.cancelFrame(resizeFrame);
        resizeFrame = null;
        section.removeEventListener('pointermove', handlePointerMove);
        section.removeEventListener('pointerleave', handlePointerLeave);
        window.removeEventListener('resize', handleResize);
      });
    });
  }

  // =========================================================
  // STARS, SVG MORPHING AND SHOOTING BEAMS
  // =========================================================

  private initializeStarScene(root: HTMLElement): void {
    const fullScroll = root.querySelector<HTMLElement>('.full-scroll');
    const starBox = root.querySelector<HTMLElement>('.starBox');
    const starTemplate = root.querySelector<HTMLElement>('.star_item');
    const step1 = root.querySelector<HTMLElement>('.step1');
    const step2 = root.querySelector<HTMLElement>('.step2');

    if (!fullScroll || !starBox || !starTemplate || !step1 || !step2) {
      return;
    }

    const svgMoveDuration = 1800;
    let shootingEnabled = true;

    starTemplate.style.display = 'none';

    const starCount = Math.floor(Math.random() * 11) + 30;
    const step1Height = step1.offsetHeight;
    const stars: HTMLElement[] = [];

    for (let index = 0; index < starCount; index++) {
      const star = starTemplate.cloneNode(true) as HTMLElement;
      const size = Math.floor(Math.random() * 41) + 20;
      const randomX = Math.random() * starBox.clientWidth;
      const randomY = Math.random() * step1Height;
      const rotation = Math.random() * 360;

      star.style.display = 'block';
      star.style.position = 'absolute';
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${randomX}px`;
      star.style.top = `${randomY}px`;
      star.style.opacity = '1';
      star.style.transform =
        `translate(-50%, -50%) rotate(${rotation}deg)`;
      star.dataset['originalLeft'] = String(randomX);
      star.dataset['originalTop'] = String(randomY);
      star.dataset['rotation'] = String(rotation);

      starBox.appendChild(star);
      stars.push(star);
    }

    const svgImages = Array.from(
      step2.querySelectorAll<HTMLElement>('.svg_img')
    );

    if (svgImages.length < 2) {
      stars.forEach((star) => star.remove());
      starTemplate.style.display = '';
      return;
    }

    const svgTargets: SvgTargetConfig[] = [
      {
        element: svgImages[0]!,
        selector: '[id^="dot"]'
      },
      {
        element: svgImages[1]!,
        selector: '[id^="bar_dot"]'
      }
    ];

    let currentSvgIndex = 0;
    let svgChanging = false;
    let step2Started = false;
    let previousScrollY = window.scrollY;
    let firstSvgActiveTimer: number | null = null;
    let svgTimer: number | null = null;
    let shootingTimer: number | null = null;
    let scrollFrame: number | null = null;
    let resizeFrame: number | null = null;
    let lastStart: HTMLElement | null = null;
    let lastEnd: HTMLElement | null = null;

    svgImages.forEach((svg) => svg.classList.remove('active'));

    const getCurrentTargets = (): Element[] => {
      const config = svgTargets[currentSvgIndex];

      if (!config) {
        return [];
      }

      return Array.from(
        config.element.querySelectorAll(config.selector)
      );
    };

    const getTargetPositions = (targets: Element[]): Point[] => {
      const boxRectangle = starBox.getBoundingClientRect();

      return targets.map((target) => {
        const rectangle = target.getBoundingClientRect();

        return {
          x: rectangle.left + rectangle.width / 2 - boxRectangle.left,
          y: rectangle.top + rectangle.height / 2 - boxRectangle.top
        };
      });
    };

    const isStep2Active = (): boolean => {
      const rectangle = step2.getBoundingClientRect();
      const screenHeight = window.innerHeight;

      return (
        rectangle.top < screenHeight * 0.6 &&
        rectangle.bottom > screenHeight * 0.4
      );
    };

    const getPageScrollProgress = (): number => {
      const step2Top =
        step2.getBoundingClientRect().top + window.scrollY;
      const start = 0;
      const end = step2Top - window.innerHeight * 0.25;

      if (end <= start) {
        return 1;
      }

      const progress = (window.scrollY - start) / (end - start);
      return Math.max(0, Math.min(1, progress));
    };

    const updateStarsFromScroll = (): void => {
      if (svgChanging) {
        return;
      }

      const progress = getPageScrollProgress();
      const positions = getTargetPositions(getCurrentTargets());

      if (!positions.length) {
        return;
      }

      stars.forEach((star, index) => {
        if (index >= positions.length) {
          star.style.opacity = progress < 0.8 ? '1' : '0';
          return;
        }

        const target = positions[index]!;
        const originalX = Number(star.dataset['originalLeft'] ?? 0);
        const originalY = Number(star.dataset['originalTop'] ?? 0);
        const positionX =
          originalX + (target.x - originalX) * progress;
        const positionY =
          originalY + (target.y - originalY) * progress;

        star.style.transition = 'none';
        star.style.left = `${positionX}px`;
        star.style.top = `${positionY}px`;
        star.style.opacity = '1';
        star.style.pointerEvents = 'none';
        star.style.transform = 'translate(-50%, -50%)';
      });
    };

    const getOldSvgPositions = (): Point[] => {
      return getTargetPositions(getCurrentTargets());
    };

    const scheduleNextSvg = (): void => {
      this.clearScheduled(svgTimer);

      const randomTime = Math.floor(Math.random() * 5000) + 10000;

      svgTimer = this.schedule(() => {
        svgTimer = null;

        if (isStep2Active() && step2Started) {
          changeSvg();
        } else if (step2Started) {
          scheduleNextSvg();
        }
      }, randomTime);
    };

    const changeSvg = (): void => {
      if (!step2Started || svgChanging) {
        return;
      }

      svgChanging = true;

      const oldPositions = getOldSvgPositions();

      if (!oldPositions.length) {
        svgChanging = false;
        scheduleNextSvg();
        return;
      }

      const oldSvg = svgImages[currentSvgIndex]!;
      currentSvgIndex = (currentSvgIndex + 1) % svgImages.length;
      const newSvg = svgImages[currentSvgIndex]!;

      oldSvg.classList.remove('active');
      newSvg.classList.remove('active');

      this.requestFrame(() => {
        this.requestFrame(() => {
          const newPositions = getTargetPositions(getCurrentTargets());

          if (!newPositions.length) {
            svgChanging = false;
            scheduleNextSvg();
            return;
          }

          stars.forEach((star, index) => {
            if (index >= newPositions.length) {
              star.style.transition = 'opacity 500ms ease';
              star.style.opacity = '0';
              return;
            }

            const newTarget = newPositions[index]!;
            const startPosition =
              oldPositions[index] ??
              oldPositions[
                Math.floor(Math.random() * oldPositions.length)
              ] ?? {
                x: starBox.clientWidth / 2,
                y: starBox.clientHeight / 2
              };

            star.style.transition = 'none';
            star.style.left = `${startPosition.x}px`;
            star.style.top = `${startPosition.y}px`;
            star.style.opacity = '1';
            star.style.pointerEvents = 'none';
            star.style.transform = 'translate(-50%, -50%)';

            void star.offsetWidth;

            this.requestFrame(() => {
              star.style.transition =
                `left ${svgMoveDuration}ms cubic-bezier(.22,.61,.36,1), ` +
                `top ${svgMoveDuration}ms cubic-bezier(.22,.61,.36,1), ` +
                'opacity 700ms ease';
              star.style.left = `${newTarget.x}px`;
              star.style.top = `${newTarget.y}px`;
              star.style.opacity = '1';
            });
          });

          this.schedule(() => {
            svgChanging = false;

            if (!step2Started) {
              return;
            }

            const finalPositions = getTargetPositions(getCurrentTargets());

            stars.forEach((star, index) => {
              const finalPosition = finalPositions[index];

              if (!finalPosition) {
                return;
              }

              star.style.transition = 'none';
              star.style.left = `${finalPosition.x}px`;
              star.style.top = `${finalPosition.y}px`;
              star.style.opacity = '1';
            });

            this.requestFrame(() => newSvg.classList.add('active'));
          }, svgMoveDuration + 100);
        });
      });

      scheduleNextSvg();
    };

    const checkStep2 = (): void => {
      const active = isStep2Active();
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > previousScrollY;

      if (active && !step2Started) {
        step2Started = true;
        shootingEnabled = false;

        starBox
          .querySelectorAll<HTMLElement>('.shooting_beam')
          .forEach((beam) => beam.remove());

        currentSvgIndex = 0;
        svgImages.forEach((svg) => svg.classList.remove('active'));

        this.schedule(() => {
          updateStarsFromScroll();
          this.clearScheduled(firstSvgActiveTimer);

          firstSvgActiveTimer = this.schedule(() => {
            firstSvgActiveTimer = null;

            if (step2Started && currentSvgIndex === 0) {
              svgImages[0]?.classList.add('active');
            }
          }, 300);
        }, 100);

        scheduleNextSvg();
      }

      if (!active && step2Started) {
        step2Started = false;
        this.clearScheduled(firstSvgActiveTimer);
        this.clearScheduled(svgTimer);
        firstSvgActiveTimer = null;
        svgTimer = null;
        shootingEnabled = true;

        if (!scrollingDown) {
          svgImages.forEach((svg) => svg.classList.remove('active'));
        }

        currentSvgIndex = 0;
      }

      previousScrollY = currentScrollY;
    };

    const getStarPosition = (star: HTMLElement): Point => {
      const rectangle = star.getBoundingClientRect();
      const boxRectangle = starBox.getBoundingClientRect();

      return {
        x: rectangle.left + rectangle.width / 2 - boxRectangle.left,
        y: rectangle.top + rectangle.height / 2 - boxRectangle.top
      };
    };

    const getRandomPair = (): [HTMLElement, HTMLElement] | null => {
      if (stars.length < 2) {
        return null;
      }

      let startIndex = Math.floor(Math.random() * stars.length);
      let endIndex = Math.floor(Math.random() * stars.length);

      while (endIndex === startIndex) {
        endIndex = Math.floor(Math.random() * stars.length);
      }

      let startStar = stars[startIndex]!;
      let endStar = stars[endIndex]!;
      let attempts = 0;

      while (
        startStar === lastStart &&
        endStar === lastEnd &&
        attempts < 20
      ) {
        startIndex = Math.floor(Math.random() * stars.length);
        endIndex = Math.floor(Math.random() * stars.length);

        if (startIndex !== endIndex) {
          startStar = stars[startIndex]!;
          endStar = stars[endIndex]!;
        }

        attempts++;
      }

      lastStart = startStar;
      lastEnd = endStar;
      return [startStar, endStar];
    };

    const createShootingBeam = (
      startStar: HTMLElement,
      endStar: HTMLElement
    ): void => {
      if (!shootingEnabled) {
        return;
      }

      const start = getStarPosition(startStar);
      const end = getStarPosition(endStar);
      const differenceX = end.x - start.x;
      const differenceY = end.y - start.y;
      const distance = Math.hypot(differenceX, differenceY);
      const angle = Math.atan2(differenceY, differenceX) * 180 / Math.PI;
      const duration = Math.random() * 0.6 + 1.2;
      const beam = document.createElement('div');

      beam.className = 'shooting_beam';
      beam.style.left = `${start.x}px`;
      beam.style.top = `${start.y}px`;
      beam.style.width = `${distance}px`;
      beam.style.transform = `rotate(${angle}deg)`;
      beam.style.animationDuration = `${duration}s`;
      starBox.appendChild(beam);

      this.requestFrame(() => {
        if (shootingEnabled) {
          beam.classList.add('active');
        }
      });

      this.schedule(() => beam.remove(), duration * 1000 + 100);
    };

    const startShooting = (): void => {
      if (!shootingEnabled) {
        shootingTimer = this.schedule(startShooting, 1000);
        return;
      }

      const numberOfShots = Math.random() < 0.85 ? 1 : 2;
      const usedStars = new Set<HTMLElement>();

      for (let index = 0; index < numberOfShots; index++) {
        let pair = getRandomPair();

        if (!pair) {
          continue;
        }

        let attempts = 0;

        while (
          (usedStars.has(pair[0]) || usedStars.has(pair[1])) &&
          attempts < 20
        ) {
          const nextPair = getRandomPair();

          if (!nextPair) {
            break;
          }

          pair = nextPair;
          attempts++;
        }

        usedStars.add(pair[0]);
        usedStars.add(pair[1]);

        const shotDelay =
          index === 0 ? 0 : Math.random() * 700 + 500;

        const [startStar, endStar] = pair;

        this.schedule(() => {
          if (shootingEnabled) {
            createShootingBeam(startStar, endStar);
          }
        }, shotDelay);
      }

      const nextDelay = Math.random() * 3500 + 2000;
      shootingTimer = this.schedule(startShooting, nextDelay);
    };

    const handleScroll = (): void => {
      if (scrollFrame !== null) {
        return;
      }

      scrollFrame = this.requestFrame(() => {
        scrollFrame = null;
        checkStep2();
        updateStarsFromScroll();
      });
    };

    const handleResize = (): void => {
      this.cancelFrame(resizeFrame);
      resizeFrame = this.requestFrame(() => {
        resizeFrame = null;
        updateStarsFromScroll();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    checkStep2();
    updateStarsFromScroll();
    shootingTimer = this.schedule(startShooting, 800);

    this.cleanupCallbacks.push(() => {
      shootingEnabled = false;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      this.cancelFrame(scrollFrame);
      this.cancelFrame(resizeFrame);
      this.clearScheduled(firstSvgActiveTimer);
      this.clearScheduled(svgTimer);
      this.clearScheduled(shootingTimer);
      starBox
        .querySelectorAll<HTMLElement>('.shooting_beam')
        .forEach((beam) => beam.remove());
      stars.forEach((star) => star.remove());
      starTemplate.style.display = '';
    });
  }
}
