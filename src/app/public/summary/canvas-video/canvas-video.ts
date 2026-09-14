import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';

export type CanvasImageFit = 'cover' | 'contain';
import { RouteTransitionService } from '../../../core/services/route-transition.service';
@Component({
  selector: 'app-canvas-video',
  standalone: true,
  imports: [],
  templateUrl: './canvas-video.html',
  styleUrl: './canvas-video.css'
})
export class CanvasVideo implements AfterViewInit, OnDestroy {
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
  @Input() frameCount = 300;
  @Input() frameFolder = 'assets/frames';
  @Input() frameExtension = 'webp';
  @Input() smoothness = 0.18;
  @Input() imageFit: CanvasImageFit = 'cover';
  @Input() buttonText = 'Portfolio';

  @Output() completionClick = new EventEmitter<void>();

  @ViewChild('canvasVideoSection', { static: true })
  private sectionRef!: ElementRef<HTMLElement>;

  @ViewChild('videoCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasLoader', { static: true })
  private loaderRef!: ElementRef<HTMLElement>;

  @ViewChild('canvasProgressBar', { static: true })
  private progressBarRef!: ElementRef<HTMLElement>;

  @ViewChild('completionButton', { static: true })
  private completionButtonRef!: ElementRef<HTMLButtonElement>;

  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private context: CanvasRenderingContext2D | null = null;
  private frames: Array<HTMLImageElement | undefined> = [];
  private totalFrames = 1;
  private completedFrames = 0;
  private loadedFrames = 0;

  private targetFrame = 0;
  private currentFrame = 0;
  private lastDrawnFrame = -1;
  private canvasReady = false;
  private destroyed = false;

  private animationFrameId: number | null = null;
  private scrollFrameId: number | null = null;
  private resizeFrameId: number | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;

    this.context = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });

    if (!this.context) {
      this.loaderRef.nativeElement.textContent =
        'Canvas is not supported in this browser.';
      return;
    }

    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.totalFrames = Math.max(1, Math.floor(this.frameCount));
    this.frames = new Array<HTMLImageElement | undefined>(this.totalFrames);

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.handleScroll, {
        passive: true
      });
      window.addEventListener('resize', this.handleResize, {
        passive: true
      });

      this.preloadFrames();
      this.resizeCanvas();
      this.updateTargetFrame();
      this.startAnimationLoop();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (!this.isBrowser) {
      return;
    }

    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);

    this.cancelFrame(this.animationFrameId);
    this.cancelFrame(this.scrollFrameId);
    this.cancelFrame(this.resizeFrameId);

    this.animationFrameId = null;
    this.scrollFrameId = null;
    this.resizeFrameId = null;

    this.frames.forEach((image) => {
      if (!image) {
        return;
      }

      image.onload = null;
      image.onerror = null;
    });

    this.frames = [];
    this.context = null;
  }

  private readonly handleScroll = (): void => {
    if (this.scrollFrameId !== null) {
      return;
    }

    this.scrollFrameId = window.requestAnimationFrame(() => {
      this.scrollFrameId = null;
      this.updateTargetFrame();
      this.startAnimationLoop();
    });
  };

  private readonly handleResize = (): void => {
    this.cancelFrame(this.resizeFrameId);

    this.resizeFrameId = window.requestAnimationFrame(() => {
      this.resizeFrameId = null;
      this.resizeCanvas();
      this.updateTargetFrame();
      this.startAnimationLoop();
    });
  };

  private preloadFrames(): void {
    for (let index = 0; index < this.totalFrames; index++) {
      const image = new Image();

      image.decoding = 'async';

      image.onload = () => {
        if (this.destroyed) {
          return;
        }

        this.loadedFrames++;
        this.completedFrames++;
        this.updateLoader();

        if (!this.canvasReady) {
          this.canvasReady = true;
          this.resizeCanvas();
        }

        const requestedFrame = Math.round(this.currentFrame);

        if (Math.abs(index - requestedFrame) < 15) {
          this.lastDrawnFrame = -1;
          this.drawFrame(requestedFrame);
        }
      };

      image.onerror = () => {
        if (this.destroyed) {
          return;
        }

        this.completedFrames++;
        this.updateLoader();
        console.error('Frame load nahi hua:', image.src);
      };

      image.src = this.getFramePath(index);
      this.frames[index] = image;
    }
  }

  private updateLoader(): void {
    const loader = this.loaderRef.nativeElement;
    const percentage = Math.round(
      (this.completedFrames / this.totalFrames) * 100
    );

    loader.textContent = `Loading: ${percentage}%`;

    if (this.completedFrames !== this.totalFrames) {
      return;
    }

    const failedFrames = this.totalFrames - this.loadedFrames;

    if (failedFrames > 0) {
      console.warn(`${failedFrames} canvas frames load nahi hue.`);
    }

    loader.style.display = 'none';
  }

  private getFramePath(index: number): string {
    const frameNumber = String(index + 1).padStart(4, '0');
    const cleanFolder = this.frameFolder.replace(/\/$/, '');

    return `${cleanFolder}/frame_${frameNumber}.${this.frameExtension}`;
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rectangle = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(Math.max(1, rectangle.width) * pixelRatio);
    canvas.height = Math.round(Math.max(1, rectangle.height) * pixelRatio);
    this.lastDrawnFrame = -1;
    this.drawFrame(Math.round(this.currentFrame));
  }

  private getAvailableFrame(frameIndex: number): number {
    if (this.isImageReady(this.frames[frameIndex])) {
      return frameIndex;
    }

    for (let distance = 1; distance < 15; distance++) {
      const previousIndex = frameIndex - distance;
      const nextIndex = frameIndex + distance;

      if (
        previousIndex >= 0 &&
        this.isImageReady(this.frames[previousIndex])
      ) {
        return previousIndex;
      }

      if (
        nextIndex < this.totalFrames &&
        this.isImageReady(this.frames[nextIndex])
      ) {
        return nextIndex;
      }
    }

    return -1;
  }

  private isImageReady(
    image: HTMLImageElement | undefined
  ): image is HTMLImageElement {
    return Boolean(
      image && image.complete && image.naturalWidth > 0
    );
  }

  private drawFrame(frameIndex: number): void {
    const context = this.context;

    if (!this.canvasReady || !context) {
      return;
    }

    const safeFrameIndex = Math.max(
      0,
      Math.min(this.totalFrames - 1, frameIndex)
    );
    const availableFrame = this.getAvailableFrame(safeFrameIndex);

    if (availableFrame < 0 || availableFrame === this.lastDrawnFrame) {
      return;
    }

    const image = this.frames[availableFrame];

    if (!this.isImageReady(image)) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;
    const scale =
      this.imageFit === 'contain'
        ? Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight)
        : Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const x = (canvasWidth - drawWidth) / 2;
    const y = (canvasHeight - drawHeight) / 2;

    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, x, y, drawWidth, drawHeight);
    this.lastDrawnFrame = availableFrame;
  }

  private updateTargetFrame(): void {
    const section = this.sectionRef.nativeElement;
    const sectionRectangle = section.getBoundingClientRect();
    const scrollDistance = section.offsetHeight - window.innerHeight;

    if (scrollDistance <= 0) {
      return;
    }

    const progress = Math.max(
      0,
      Math.min(1, -sectionRectangle.top / scrollDistance)
    );

    this.targetFrame = progress * (this.totalFrames - 1);
    this.progressBarRef.nativeElement.style.transform =
      `scaleX(${progress})`;
    this.updateCompletionButton(progress);
  }

  private updateCompletionButton(progress: number): void {
    const button = this.completionButtonRef.nativeElement;
    const completed = progress >= 0.999;

    button.classList.toggle('is-visible', completed);
    button.setAttribute('aria-hidden', String(!completed));
    button.tabIndex = completed ? 0 : -1;
  }

  private startAnimationLoop(): void {
    if (this.destroyed || this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(
      this.animationLoop
    );
  }

  private readonly animationLoop = (): void => {
    this.animationFrameId = null;

    if (this.destroyed) {
      return;
    }

    const smoothing = Math.max(0.01, Math.min(1, this.smoothness));
    const difference = this.targetFrame - this.currentFrame;

    this.currentFrame += difference * smoothing;

    if (Math.abs(difference) < 0.01) {
      this.currentFrame = this.targetFrame;
    }

    this.drawFrame(Math.round(this.currentFrame));

    if (Math.abs(this.targetFrame - this.currentFrame) >= 0.01) {
      this.startAnimationLoop();
    }
  };

  private cancelFrame(frameId: number | null): void {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
  }
}
