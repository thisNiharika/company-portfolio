import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
interface RelatedCard {
  category: string;
  title: string;
  description: string;
  image?: string;
  link: string;
}
interface RelatedProjects {
  cards: RelatedCard[];
}

gsap.registerPlugin(ScrollTrigger);
@Component({
  selector: 'app-project-details',
  imports: [],
  templateUrl: './project-details.html',
  styleUrl: './project-details.css',
})
export class ProjectDetails implements AfterViewInit, OnDestroy {
  
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly routeTransition = inject(RouteTransitionService);
  private readonly pageElement = inject(ElementRef);
  private scrollContext: any;
  goTo(
    url: string,
    event: MouseEvent,
    contentShowDelay = 0
  ): void {
    // Horizontal drag ke baad generated click ko route change se roko.
    if (this.relatedClickBlocked) {
      event.preventDefault();
      this.relatedClickBlocked = false;
      return;
    }

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
  @ViewChild('slider') slider!: ElementRef<HTMLElement>;

  tabList = ['Overview', 'Branding'];
  activeTab = 'Overview';

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.moveBackground();
      this.animateSlides(true);
      this.startAutoplay();

      this.initializeRelatedSlider();
      this.startRelatedAutoplay();

      this.initPageScrollAnimation();

      ScrollTrigger.refresh();
    });
  }

  /**
   * Tab ke @if DOM ko paint hone se pehle banners ki starting state set karta hai.
   * Isse banner pehle visible hokar phir animation start nahi karta.
   */
  private resetIntroBanners(): void {
    const page =
      this.pageElement.nativeElement as HTMLElement;

    const bannerLeft =
      page.querySelector<HTMLElement>('.pdb_left');

    const bannerRight =
      page.querySelector<HTMLElement>('.pdb_right');

    if (bannerLeft) {
      gsap.killTweensOf(bannerLeft);
      gsap.set(bannerLeft, {
        autoAlpha: 0,
        x: -100
      });
    }

    if (bannerRight) {
      gsap.killTweensOf(bannerRight);
      gsap.set(bannerRight, {
        autoAlpha: 0,
        x: 100,
        scale: 0.94
      });
    }
  }
  
  private initPageScrollAnimation(
    replayIntro = true,
    introDelay = 0
  ): void {
    const page =
      this.pageElement.nativeElement as HTMLElement;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    this.scrollContext?.revert();

    this.scrollContext = gsap.context(() => {

      // Top banner animation
      const bannerLeft =
        page.querySelector<HTMLElement>('.pdb_left');

      const bannerRight =
        page.querySelector<HTMLElement>('.pdb_right');

      if (replayIntro && bannerLeft) {
        gsap.set(bannerLeft, {
          autoAlpha: 0,
          x: -100
        });

        gsap.to(
          bannerLeft,
          {
            autoAlpha: 1,
            x: 0,
            duration: 1.1,
            delay: introDelay,
            ease: 'power4.out'
          }
        );
      }

      if (replayIntro && bannerRight) {
        gsap.set(bannerRight, {
          autoAlpha: 0,
          x: 100,
          scale: 0.94
        });

        gsap.to(
          bannerRight,
          {
            autoAlpha: 1,
            x: 0,
            scale: 1,
            duration: 1.2,
            delay: introDelay,
            ease: 'power4.out'
          }
        );
      }

      // All context sections
      const contextBlocks =
        page.querySelectorAll<HTMLElement>('.the_context');

      contextBlocks.forEach(block => {
        const number =
          block.querySelector<HTMLElement>(
            '.the_context_heading h2'
          );

        const title =
          block.querySelector<HTMLElement>(
            '.the_context_heading h3'
          );

        const content =
          block.querySelector<HTMLElement>(
            '.the_context_para'
          );

        const contentParts = content
          ? Array.from(content.children) as HTMLElement[]
          : [];

        const listItems = Array.from(
          block.querySelectorAll<HTMLElement>(
            '.approachFocused li'
          )
        );

        const blockImage =
          block.querySelector<HTMLElement>(
            '.approach_img, .ld_img'
          );

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: block,
            start: 'top 78%',
            // once: true
            toggleActions: 'restart none restart none'
          }
        });

        if (number) {
          timeline.fromTo(
            number,
            {
              autoAlpha: 0,
              scale: 0.4,
              rotate: -15,
              x: -30
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotate: 0,
              x: 0,
              duration: 0.8,
              ease: 'back.out(1.7)'
            }
          );
        }

        if (title) {
          timeline.fromTo(
            title,
            {
              autoAlpha: 0,
              x: 70,
              clipPath: 'inset(0 100% 0 0)'
            },
            {
              autoAlpha: 1,
              x: 0,
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.9,
              ease: 'power3.out'
            },
            '-=0.55'
          );
        }

        if (contentParts.length) {
          timeline.fromTo(
            contentParts,
            {
              autoAlpha: 0,
              y: 35
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.13,
              ease: 'power3.out'
            },
            '-=0.45'
          );
        }

        if (listItems.length) {
          timeline.fromTo(
            listItems,
            {
              autoAlpha: 0,
              y: 30,
              rotateX: -10
            },
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: 'power3.out'
            },
            '-=0.35'
          );
        }

        if (blockImage) {
          timeline.fromTo(
            blockImage,
            {
              autoAlpha: 0,
              x: 90,
              scale: 1.08,
              clipPath: 'inset(0 0 0 100%)'
            },
            {
              autoAlpha: 1,
              x: 0,
              scale: 1,
              clipPath: 'inset(0 0 0 0%)',
              duration: 1.1,
              ease: 'power3.out'
            },
            '-=0.55'
          );
        }
      });
      // Certifications images: viewport ke 40%–50% area me aane par reveal
const certificationBlock =
  page.querySelector<HTMLElement>('.certifications_img');

if (certificationBlock) {
  gsap.fromTo(
    certificationBlock,
    {
      autoAlpha: 0,
      x: 90,
      scale: 1.08,
      clipPath: 'inset(0 0 0 100%)'
    },
    {
      autoAlpha: 1,
      x: 0,
      scale: 1,
      clipPath: 'inset(0 0 0 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: certificationBlock,
        start: 'top 60%',
        end: 'top 40%',
        scrub: 1.4,
        invalidateOnRefresh: true
      }
    }
  );
}

      // Branding ke typography cards ka scroll reveal.
      const brandingVisuals = Array.from(
        page.querySelectorAll<HTMLElement>(
          '.pd_branding .typo_item'
        )
      );

      brandingVisuals.forEach((visual) => {
        gsap.set(visual, {
          autoAlpha: 0,
          y: 70,
          scale: 0.94,
          filter: 'blur(6px)'
        });

        const visualAnimation = gsap.to(visual, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          paused: true
        });

        ScrollTrigger.create({
          trigger: visual,
          start: 'top 84%',
          animation: visualAnimation,
          toggleActions: 'play none restart reset',
          invalidateOnRefresh: true
        });

        const visualRect = visual.getBoundingClientRect();
        if (
          visualRect.top <= window.innerHeight * 0.84 &&
          visualRect.bottom >= 0
        ) {
          visualAnimation.play(0);
        }
      });

      // Har typo_content ke h4 aur p separately stagger mein animate honge.
      const brandingTextBlocks = Array.from(
        page.querySelectorAll<HTMLElement>('.pd_branding .typo_content')
      );

      brandingTextBlocks.forEach((textBlock) => {
        const textParts = Array.from(
          textBlock.querySelectorAll<HTMLElement>(
            ':scope > h4, :scope > p'
          )
        );

        if (!textParts.length) {
          return;
        }

        gsap.set(textParts, {
          autoAlpha: 0,
          y: 28
        });

        const textAnimation = gsap.timeline({
          paused: true
        });

        textAnimation.to(textParts, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out'
        });

        ScrollTrigger.create({
          trigger: textBlock,
          start: 'top 86%',
          animation: textAnimation,
          toggleActions: 'play none restart reset',
          invalidateOnRefresh: true
        });

        const textRect = textBlock.getBoundingClientRect();
        if (
          textRect.top <= window.innerHeight * 0.86 &&
          textRect.bottom >= 0
        ) {
          textAnimation.play(0);
        }
      });

      // Palette ka heading pehle aur uske baad colours ek-ek karke aayenge.
      const brandingPalettes = Array.from(
        page.querySelectorAll<HTMLElement>('.pd_branding .palette')
      );

      brandingPalettes.forEach((palette) => {
        const paletteHeading = palette.querySelector<HTMLElement>(
          ':scope > h5'
        );

        const paletteList = palette.querySelector<HTMLElement>(
          ':scope > ul'
        );

        const paletteItems = paletteList
          ? Array.from(paletteList.children) as HTMLElement[]
          : [];

        if (!paletteHeading && !paletteItems.length) {
          return;
        }

        if (paletteHeading) {
          gsap.set(paletteHeading, {
            autoAlpha: 0,
            y: 24
          });
        }

        if (paletteItems.length) {
          gsap.set(paletteItems, {
            autoAlpha: 0,
            y: 28,
            scale: 0.86,
            rotateX: -12
          });
        }

        const paletteAnimation = gsap.timeline({
          paused: true
        });

        if (paletteHeading) {
          paletteAnimation.to(paletteHeading, {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: 'power3.out'
          });
        }

        if (paletteItems.length) {
          paletteAnimation.to(
            paletteItems,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.55,
              stagger: 0.1,
              ease: 'back.out(1.4)'
            },
            '-=0.1'
          );
        }

        ScrollTrigger.create({
          trigger: palette,
          start: 'top 86%',
          animation: paletteAnimation,
          toggleActions: 'play none restart reset',
          invalidateOnRefresh: true
        });

        const paletteRect = palette.getBoundingClientRect();
        if (
          paletteRect.top <= window.innerHeight * 0.86 &&
          paletteRect.bottom >= 0
        ) {
          paletteAnimation.play(0);
        }
      });

      // Context slider reveal
      const sliders =
        page.querySelectorAll<HTMLElement>('.context_slider');

      sliders.forEach((slider) => {
        gsap.fromTo(
          slider,
          {
            autoAlpha: 0,
            y: 100,
            scale: 0.9,
            clipPath: 'inset(0 0 100% 0)'
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.2,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: slider,
              start: 'top 85%',
              end: 'top 45%',
              scrub: 1.2,
              invalidateOnRefresh: true
            }
          }
        );
      });

      // Related cards scroll reveal
      // Card par transform nahi lagaya gaya hai, isliye related slider ka
      // .cardList translateX animation ke saath conflict nahi karega.
      const relatedCardLists =
        page.querySelectorAll<HTMLElement>('.relatedCard .cardList');

      if (!reduceMotion) {
        relatedCardLists.forEach((cardList) => {
          const cards = Array.from(
            cardList.querySelectorAll<HTMLElement>('.card_items')
          );

          cards.forEach((card, index) => {
            const column = index % 3;

            const direction =
              column === 0 ? -1 :
              column === 2 ? 1 : 0;

            const imageClipStart =
              column === 0
                ? 'inset(0% 100% 0% 0%)'
                : column === 1
                  ? 'inset(100% 0% 0% 0%)'
                  : 'inset(0% 0% 0% 100%)';

            const content =
              card.querySelector<HTMLElement>('.ci_content');

            const image =
              card.querySelector<HTMLImageElement>('.ci_img img');

            const textElements = Array.from(
              card.querySelectorAll<HTMLElement>(
                '.cic_top > span, .cic_top > h2, .cic_top > p'
              )
            );

            const arrow =
              card.querySelector<HTMLElement>('.arrow_card');

            // Slider ke track ka transform preserve rahega.
            gsap.set(card, {
              clearProps: 'transform'
            });

            if (image) {
              gsap.set(image, {
                clearProps: 'transform'
              });
            }

            const cardTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: card,
                start: 'top 92%',
                end: 'top 48%',
                scrub: 0.8,
                invalidateOnRefresh: true
              }
            });

            cardTimeline.fromTo(
              card,
              {
                autoAlpha: 0
              },
              {
                autoAlpha: 1,
                duration: 0.25,
                ease: 'none'
              },
              0
            );

            if (content) {
              cardTimeline.fromTo(
                content,
                {
                  autoAlpha: 0,
                  x: () => {
                    if (window.innerWidth <= 767) {
                      return direction * 20;
                    }

                    return direction * 60;
                  },
                  y: column === 1 ? 130 : 90,
                  rotationZ: direction * 3,
                  rotationX: column === 1 ? 6 : 0,
                  scale: 0.96,
                  filter: 'blur(8px)',
                  transformPerspective: 1200
                },
                {
                  autoAlpha: 1,
                  x: 0,
                  y: 0,
                  rotationZ: 0,
                  rotationX: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                  duration: 0.9,
                  ease: 'power3.out'
                },
                0
              );
            }

            if (image) {
              cardTimeline.fromTo(
                image,
                {
                  autoAlpha: 0,
                  clipPath: imageClipStart
                },
                {
                  autoAlpha: 1,
                  clipPath: 'inset(0% 0% 0% 0%)',
                  duration: 0.8,
                  ease: 'power2.out'
                },
                0.15
              );
            }

            if (textElements.length) {
              cardTimeline.fromTo(
                textElements,
                {
                  autoAlpha: 0,
                  y: 35,
                  skewY: 2
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  skewY: 0,
                  duration: 0.5,
                  stagger: 0.07,
                  ease: 'power3.out'
                },
                0.3
              );
            }

            if (arrow) {
              cardTimeline.fromTo(
                arrow,
                {
                  autoAlpha: 0,
                  scale: 0.4,
                  rotation: -45
                },
                {
                  autoAlpha: 1,
                  scale: 1,
                  rotation: 0,
                  duration: 0.45,
                  ease: 'back.out(1.7)'
                },
                0.5
              );
            }
          });
        });
      }

      // Impact cards stagger animation
      const impactSection =
        page.querySelector<HTMLElement>('.igList');

      const impactCards = Array.from(
        page.querySelectorAll<HTMLElement>('.igList li')
      );

      if (impactSection && impactCards.length) {
        gsap.fromTo(
          impactCards,
          {
            autoAlpha: 0,
            y: 70,
            rotateY: 12,
            scale: 0.92
          },
          {
            autoAlpha: 1,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.16,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: impactSection,
              start: 'top 82%',
              // once: true
              toggleActions: 'restart none restart none'
            }
          }
        );
      }

    }, page);
  }

  selectTab(tab: string): void {
    // Purana context turant hatao, taaki old banner tween tab change ke baad
    // naye banner ke saath compete na kare.
    this.scrollContext?.revert();
    this.scrollContext = undefined;

    this.activeTab = tab;
    this.changeDetector.detectChanges();

    // @if se bane naye banners ko browser ke next paint se pehle hide karo.
    this.resetIntroBanners();

    requestAnimationFrame(() => {
      this.moveBackground();

      requestAnimationFrame(() => {
        this.animateSlides(true);
        this.startAutoplay();

        this.initPageScrollAnimation(true, 0.5);
        ScrollTrigger.refresh();
      });
    });
  }

  private moveBackground(): void {
    const ul = this.tabs.nativeElement;
    const activeLi = ul.querySelector('li.active') as HTMLElement;

    if (!activeLi) return;

    ul.style.setProperty('--tab-left', `${activeLi.offsetLeft}px`);
    ul.style.setProperty('--tab-width', `${activeLi.offsetWidth}px`);
  }

  // ============================================= Slider
  
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
private pendingDragDistance = 0;
private sideOffset = 0;
private pointerId: number | null = null;

private dragFrame: number | null = null;

private pointerDownItemIndex: number | null = null;
private suppressSlideClick = false;

private baseX = new Map<HTMLElement, number>();

private autoplayTimer:
  ReturnType<typeof setInterval> | undefined;

private get items(): HTMLElement[] {
  if (!this.slider) {
    return [];
  }

  return Array.from(
    this.slider.nativeElement.querySelectorAll<HTMLElement>(
      '.item'
    )
  );
}

private getRelativePosition(
  index: number,
  total: number
): number {
  let position =
    (index - this.activeIndex) % total;

  if (position > total / 2) {
    position -= total;
  }

  if (position < -total / 2) {
    position += total;
  }

  return position;
}

private animateSlides(
  immediate = false
): void {
  const items = this.items;

  if (!items.length || !this.slider) {
    return;
  }

  const activeWidth =
    items[0].offsetWidth;

  const sideWidth =
    activeWidth * this.sideScale;

  const sliderWidth =
    this.slider.nativeElement.offsetWidth;

  const gap = Math.max(
    24,
    Math.min(
      161,
      sliderWidth * (161 / 1920)
    )
  );

  this.sideOffset =
    (activeWidth + sideWidth) / 2 + gap;

  gsap.killTweensOf(items);

  items.forEach((item, index) => {
    const position =
      this.getRelativePosition(
        index,
        items.length
      );

    const isActive =
      position === 0;

    const isSide =
      Math.abs(position) === 1;

    const targetX =
      position * this.sideOffset;

    this.baseX.set(
      item,
      targetX
    );

    gsap.set(item, {
      zIndex: isActive
        ? 5
        : isSide
          ? 3
          : 0
    });

    item.style.pointerEvents =
      isActive || isSide
        ? 'auto'
        : 'none';

    const animation = {
      xPercent: -50,
      yPercent: -50,
      x: targetX,
      y: isActive ? 0 : 12,

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
    (this.activeIndex + 1) %
    this.slides.length;

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

/*
 * Side previous/next item click
 */
onSlideItemClick(
  index: number,
  event: MouseEvent
): void {
  event.stopPropagation();

  /*
   * Drag ke baad generated click ignore karein
   */
  if (this.suppressSlideClick) {
    return;
  }

  /*
   * Active item par action nahi
   */
  if (index === this.activeIndex) {
    return;
  }

  /*
   * Click kiya hua item center mein laayein
   */
  this.activeIndex = index;

  this.animateSlides();
  this.startAutoplay();
}

onPointerDown(
  event: PointerEvent
): void {
  const target =
    event.target as HTMLElement;

  /*
   * Arrow buttons par drag start nahi hoga
   */
  if (target.closest('.slider_btn')) {
    return;
  }

  const clickedItem =
    target.closest<HTMLElement>('.item');

  const itemIndex = clickedItem
    ? this.items.indexOf(clickedItem)
    : -1;

  this.pointerDownItemIndex =
    itemIndex >= 0
      ? itemIndex
      : null;

  this.suppressSlideClick = false;
  this.isDragging = true;
  this.pointerId = event.pointerId;
  this.dragStartX = event.clientX;
  this.dragDistance = 0;
  this.pendingDragDistance = 0;

  this.stopAutoplay();

  gsap.killTweensOf(this.items);

  this.items.forEach((item) => {
    const currentX =
      Number(
        gsap.getProperty(item, 'x')
      );

    this.baseX.set(
      item,
      Number.isFinite(currentX)
        ? currentX
        : 0
    );
  });

  const sliderElement =
    event.currentTarget as HTMLElement;

  sliderElement.setPointerCapture(
    event.pointerId
  );
}

onPointerMove(
  event: PointerEvent
): void {
  if (
    !this.isDragging ||
    event.pointerId !== this.pointerId
  ) {
    return;
  }

  this.pendingDragDistance =
    event.clientX - this.dragStartX;

  this.dragDistance =
    this.pendingDragDistance;

  if (Math.abs(this.dragDistance) > 5) {
    event.preventDefault();
  }

  if (this.dragFrame === null) {
    this.dragFrame =
      requestAnimationFrame(() => {
        this.dragFrame = null;

        this.paintDrag(
          this.pendingDragDistance
        );
      });
  }
}

private paintDrag(
  distance: number
): void {
  const items = this.items;

  if (
    !items.length ||
    !this.sideOffset
  ) {
    return;
  }

  const progress = Math.min(
    Math.abs(distance) / this.sideOffset,
    1
  );

  const incomingPosition =
    distance < 0 ? 1 : -1;

  items.forEach((item, index) => {
    const position =
      this.getRelativePosition(
        index,
        items.length
      );

    const originalX =
      this.baseX.get(item) ?? 0;

    if (position === 0) {
      gsap.set(item, {
        x: originalX + distance,
        scale:
          1 -
          (1 - this.sideScale) *
            progress,
        opacity:
          1 - 0.28 * progress
      });
    }

    if (
      position === incomingPosition
    ) {
      gsap.set(item, {
        x: originalX + distance,
        scale:
          this.sideScale +
          (1 - this.sideScale) *
            progress,
        opacity:
          0.72 + 0.28 * progress
      });
    }
  });
}

onPointerUp(
  event: PointerEvent
): void {
  if (
    !this.isDragging ||
    event.pointerId !== this.pointerId
  ) {
    return;
  }

  if (this.dragFrame !== null) {
    cancelAnimationFrame(
      this.dragFrame
    );

    this.dragFrame = null;
  }

  const distance =
    this.dragDistance;

  const clickedIndex =
    this.pointerDownItemIndex;

  const clickThreshold = 10;
  const dragThreshold = 60;

  const wasDrag =
    Math.abs(distance) > clickThreshold;

  this.paintDrag(distance);
  this.isDragging = false;

  if (Math.abs(distance) > dragThreshold) {
    if (distance < 0) {
      this.nextSlide();
    } else {
      this.previousSlide();
    }
  } else if (
    !wasDrag &&
    clickedIndex !== null &&
    clickedIndex !== this.activeIndex
  ) {
    /*
     * Clicked previous/next item center mein aaye
     */
    this.activeIndex = clickedIndex;
    this.animateSlides();
  } else {
    this.animateSlides();
  }

  this.pointerDownItemIndex = null;

  /*
   * Drag ke baad browser ke generated click ko block karein
   */
  if (wasDrag) {
    this.suppressSlideClick = true;

    window.setTimeout(() => {
      this.suppressSlideClick = false;
    }, 0);
  }

  const sliderElement =
    event.currentTarget as HTMLElement;

  if (
    sliderElement.hasPointerCapture(
      event.pointerId
    )
  ) {
    sliderElement.releasePointerCapture(
      event.pointerId
    );
  }

  this.pointerId = null;
  this.startAutoplay();
}

private startAutoplay(): void {
  this.stopAutoplay();

  if (this.slides.length < 2) {
    return;
  }

  this.autoplayTimer =
    setInterval(() => {
      this.nextSlide();
    }, 40000);
}

private stopAutoplay(): void {
  if (this.autoplayTimer) {
    clearInterval(
      this.autoplayTimer
    );

    this.autoplayTimer =
      undefined;
  }
}

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.stopRelatedAutoplay();

    if (this.dragFrame !== null) {
      cancelAnimationFrame(this.dragFrame);
    }

    if (this.relatedDragFrame !== null) {
      cancelAnimationFrame(this.relatedDragFrame);
    }

    this.scrollContext?.revert();

    gsap.killTweensOf(this.items);

    const relatedTrack = this.relatedTrack;
    if (relatedTrack) {
      gsap.killTweensOf(relatedTrack);
    }
  }
  // ============================================= Slider

  // ======================================= Related cards GSAP slider

  @ViewChild('relatedSlider')
  relatedSlider?: ElementRef<HTMLElement>;

  relatedActiveIndex = 0;
  relatedIsDragging = false;

  private relatedStep = 0;
  private relatedDragStartX = 0;
  private relatedDragStartTrackX = 0;
  private relatedDragDistance = 0;
  private relatedPointerId: number | null = null;
  private relatedDragFrame: number | null = null;
  private relatedPendingDragDistance = 0;
  private relatedClickBlocked = false;

  private relatedAutoplayTimer:
    ReturnType<typeof setInterval> | undefined;

  private get relatedCards(): RelatedCard[] {
    return this.portfolioYears.flatMap(related => related.cards);
  }
  get isRelatedSliderEnabled(): boolean {
    return this.relatedCards.length > 2;
  }

  private get relatedCloneCount(): number {
    return this.isRelatedSliderEnabled
      ? Math.min(2, this.relatedCards.length)
      : 0;
  }

  /**
   * Start aur end par cards duplicate kiye gaye hain.
   * Isse track ko reset karte waqt visible jump nahi aata.
   */
  get relatedSliderCards(): RelatedCard[] {
    const cards = this.relatedCards;

    if (!this.isRelatedSliderEnabled) {
      return cards;
    }

    const cloneCount = this.relatedCloneCount;

    return [
      ...cards.slice(-cloneCount),
      ...cards,
      ...cards.slice(0, cloneCount)
    ];
  }

  private get relatedTrack(): HTMLElement | null {
    return this.relatedSlider?.nativeElement
      .querySelector<HTMLElement>('.cardList') ?? null;
  }

  private get relatedItems(): HTMLElement[] {
    const track = this.relatedTrack;

    if (!track) {
      return [];
    }

    return Array.from(
      track.querySelectorAll<HTMLElement>('.card_items')
    );
  }

  private initializeRelatedSlider(): void {
    if (!this.relatedItems.length) {
      return;
    }

    if (!this.isRelatedSliderEnabled) {
      this.relatedActiveIndex = 0;

      if (this.relatedTrack) {
        gsap.set(this.relatedTrack, { x: 0 });
      }

      return;
    }

    this.relatedActiveIndex = this.relatedCloneCount;

    this.animateRelatedSlides(true);
  }

  private measureRelatedStep(): number {
    const items = this.relatedItems;

    if (!items.length) {
      return 0;
    }

    const firstItem = items[0];
    const secondItem = items[1];

    this.relatedStep = secondItem
      ? secondItem.offsetLeft - firstItem.offsetLeft
      : firstItem.getBoundingClientRect().width;

    return this.relatedStep;
  }

  private animateRelatedSlides(immediate = false): void {
    const track = this.relatedTrack;

    if (!track || !this.relatedItems.length) {
      return;
    }

    const step = this.measureRelatedStep();

    if (!step) {
      return;
    }

    const targetX = -(this.relatedActiveIndex * step);

    if (immediate) {
      gsap.set(track, { x: targetX });
      return;
    }

    gsap.to(track, {
      x: targetX,
      duration: 0.8,
      ease: 'power3.inOut',
      overwrite: true,
      onComplete: () => this.normalizeRelatedLoop()
    });
  }

  private normalizeRelatedLoop(): void {
    const total = this.relatedCards.length;
    const cloneCount = this.relatedCloneCount;
    const track = this.relatedTrack;

    if (!track || !this.isRelatedSliderEnabled || !this.relatedStep) {
      return;
    }

    let shouldReset = false;

    while (this.relatedActiveIndex >= cloneCount + total) {
      this.relatedActiveIndex -= total;
      shouldReset = true;
    }

    while (this.relatedActiveIndex < cloneCount) {
      this.relatedActiveIndex += total;
      shouldReset = true;
    }

    if (shouldReset) {
      gsap.set(track, {
        x: -(this.relatedActiveIndex * this.relatedStep)
      });
    }
  }

  nextRelatedSlide(): void {
    if (!this.isRelatedSliderEnabled) {
      return;
    }

    this.relatedActiveIndex += 1;
    this.animateRelatedSlides();
  }

  previousRelatedSlide(): void {
    if (!this.isRelatedSliderEnabled) {
      return;
    }

    this.relatedActiveIndex -= 1;
    this.animateRelatedSlides();
  }

  onRelatedPointerDown(event: PointerEvent): void {
    if (!this.isRelatedSliderEnabled) {
      return;
    }

    const track = this.relatedTrack;

    if (!track) {
      return;
    }

    this.relatedIsDragging = true;
    this.relatedPointerId = event.pointerId;
    this.relatedDragStartX = event.clientX;
    this.relatedDragDistance = 0;
    this.relatedPendingDragDistance = 0;
    this.relatedClickBlocked = false;

    this.stopRelatedAutoplay();
    gsap.killTweensOf(track);

    const currentX = Number(gsap.getProperty(track, 'x'));

    this.relatedDragStartTrackX = Number.isFinite(currentX)
      ? currentX
      : -(this.relatedActiveIndex * this.relatedStep);

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
  }

  onRelatedPointerMove(event: PointerEvent): void {
    if (
      !this.relatedIsDragging ||
      event.pointerId !== this.relatedPointerId
    ) {
      return;
    }

    this.relatedPendingDragDistance =
      event.clientX - this.relatedDragStartX;

    this.relatedDragDistance = this.relatedPendingDragDistance;

    if (Math.abs(this.relatedDragDistance) > 5) {
      event.preventDefault();
    }

    if (this.relatedDragFrame === null) {
      this.relatedDragFrame = requestAnimationFrame(() => {
        this.relatedDragFrame = null;
        this.paintRelatedDrag(this.relatedPendingDragDistance);
      });
    }
  }

  private paintRelatedDrag(distance: number): void {
    const track = this.relatedTrack;

    if (!track) {
      return;
    }

    gsap.set(track, {
      x: this.relatedDragStartTrackX + distance
    });
  }

  onRelatedPointerUp(event: PointerEvent): void {
    if (
      !this.relatedIsDragging ||
      event.pointerId !== this.relatedPointerId
    ) {
      return;
    }

    if (this.relatedDragFrame !== null) {
      cancelAnimationFrame(this.relatedDragFrame);
      this.relatedDragFrame = null;
    }

    this.paintRelatedDrag(this.relatedDragDistance);
    this.relatedIsDragging = false;

    const distance = this.relatedDragDistance;
    const threshold = 60;

    if (Math.abs(distance) > threshold) {
      distance < 0
        ? this.nextRelatedSlide()
        : this.previousRelatedSlide();
    } else {
      this.animateRelatedSlides();
    }

    if (Math.abs(distance) > 8) {
      this.relatedClickBlocked = true;

      setTimeout(() => {
        this.relatedClickBlocked = false;
      }, 100);
    }

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.relatedPointerId = null;
    this.startRelatedAutoplay();
  }

  onRelatedPointerCancel(event: PointerEvent): void {
    if (
      !this.relatedIsDragging ||
      event.pointerId !== this.relatedPointerId
    ) {
      return;
    }

    this.relatedIsDragging = false;

    if (this.relatedDragFrame !== null) {
      cancelAnimationFrame(this.relatedDragFrame);
      this.relatedDragFrame = null;
    }

    this.animateRelatedSlides();
    this.relatedPointerId = null;
    this.startRelatedAutoplay();
  }

  private startRelatedAutoplay(): void {
    this.stopRelatedAutoplay();

    if (!this.isRelatedSliderEnabled) {
      return;
    }

    this.relatedAutoplayTimer = setInterval(() => {
      this.nextRelatedSlide();
    }, 4000);
  }

  private stopRelatedAutoplay(): void {
    if (this.relatedAutoplayTimer) {
      clearInterval(this.relatedAutoplayTimer);
      this.relatedAutoplayTimer = undefined;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.moveBackground();
    if (!this.isDragging) {
      requestAnimationFrame(() => {
        this.animateSlides(true);
      });
    }

    if (!this.relatedIsDragging) {
      requestAnimationFrame(() => {
        this.animateRelatedSlides(true);
      });
    }

    ScrollTrigger.refresh();
  }

  // =======================================
  readonly portfolioYears: RelatedProjects[] = [
    {
      cards: [
        {
          category: 'Kyrgyzstan | UNFPA, UN Women',
          title: 'Gender Data Portal',
          description:
            'The Gender Data Portal is an interactive, user-friendly digital platform designed as a comprehensive hub for gender statistics in Kyrgyzstan.',
          image: 'assets/images/portfolio/gender-data-portal.jpg',
          link: '/portfolio-details'
        },
        {
          category: 'India | NITI Aayog, UNDP',
          title: 'National Conference of Chief Secretaries',
          description:
            'The National Conference of Chief Secretaries is a flagship initiative of the Government of India, led by NITI Aayog.',
          image:
            'assets/images/portfolio/national-conferenc-of-chief-secretaries.jpg',
          link: '/portfolio-details'
        }
      ]
    }
  ];
  
}