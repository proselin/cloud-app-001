import { Injectable, ElementRef } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

@Injectable({
  providedIn: 'root'
})
export class GsapAnimationService {

  /**
   * Fade in animation for elements
   */
  fadeIn(element: ElementRef | Element, options: {
    duration?: number;
    delay?: number;
    y?: number;
    opacity?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.fromTo(target,
      {
        opacity: options.opacity || 0,
        y: options.y || 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        ease: "power2.out"
      }
    );
  }

  /**
   * Fade out animation for elements
   */
  fadeOut(element: ElementRef | Element, options: {
    duration?: number;
    delay?: number;
    y?: number;
    opacity?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      opacity: options.opacity || 0,
      y: options.y || -30,
      duration: options.duration || 0.4,
      delay: options.delay || 0,
      ease: "power2.in"
    });
  }

  /**
   * Stagger animation for multiple elements (like comic cards)
   */
  staggerIn(elements: NodeListOf<Element> | Element[], options: {
    duration?: number;
    stagger?: number;
    y?: number;
    opacity?: number;
    scale?: number;
  } = {}) {
    return gsap.fromTo(elements,
      {
        opacity: options.opacity || 0,
        y: options.y || 50,
        scale: options.scale || 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration || 0.8,
        stagger: options.stagger || 0.1,
        ease: "power2.out"
      }
    );
  }

  /**
   * Scale hover animation for cards
   */
  scaleHover(element: ElementRef | Element, scale = 1.05) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      scale: scale,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  /**
   * Reset scale animation
   */
  scaleReset(element: ElementRef | Element) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  /**
   * Slide in from left animation
   */
  slideInLeft(element: ElementRef | Element, options: {
    duration?: number;
    delay?: number;
    x?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.fromTo(target,
      {
        opacity: 0,
        x: options.x || -100,
      },
      {
        opacity: 1,
        x: 0,
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        ease: "power2.out"
      }
    );
  }

  /**
   * Slide in from right animation
   */
  slideInRight(element: ElementRef | Element, options: {
    duration?: number;
    delay?: number;
    x?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.fromTo(target,
      {
        opacity: 0,
        x: options.x || 100,
      },
      {
        opacity: 1,
        x: 0,
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        ease: "power2.out"
      }
    );
  }

  /**
   * Page transition animation
   */
  pageTransition(element: ElementRef | Element, options: {
    direction?: 'in' | 'out';
    duration?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;
    const direction = options.direction || 'in';

    if (direction === 'in') {
      return gsap.fromTo(target,
        {
          opacity: 0,
          scale: 0.95,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: options.duration || 0.5,
          ease: "power2.out"
        }
      );
    } else {
      return gsap.to(target, {
        opacity: 0,
        scale: 0.95,
        y: -20,
        duration: options.duration || 0.3,
        ease: "power2.in"
      });
    }
  }

  /**
   * Loading spinner animation
   */
  loadingSpinner(element: ElementRef | Element) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      rotation: 360,
      duration: 1,
      ease: "none",
      repeat: -1
    });
  }

  /**
   * Image loading animation
   */
  imageLoad(element: ElementRef | Element, options: {
    duration?: number;
    scale?: number;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.fromTo(target,
      {
        opacity: 0,
        scale: options.scale || 1.1,
      },
      {
        opacity: 1,
        scale: 1,
        duration: options.duration || 0.8,
        ease: "power2.out"
      }
    );
  }

  /**
   * Chapter navigation animations
   */
  chapterNavigation(element: ElementRef | Element, direction: 'next' | 'prev') {
    const target = element instanceof ElementRef ? element.nativeElement : element;
    const x = direction === 'next' ? 50 : -50;

    return gsap.fromTo(target,
      {
        opacity: 0,
        x: x,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        ease: "power2.out"
      }
    );
  }

  /**
   * Progress bar animation
   */
  progressBar(element: ElementRef | Element, progress: number) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      width: `${progress}%`,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  /**
   * Modal/overlay animations
   */
  modalOpen(element: ElementRef | Element) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.fromTo(target,
      {
        opacity: 0,
        scale: 0.9,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      }
    );
  }

  modalClose(element: ElementRef | Element) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    return gsap.to(target, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      ease: "power2.in"
    });
  }

  /**
   * Text reveal animation
   */
  textReveal(element: ElementRef | Element, options: {
    duration?: number;
    delay?: number;
    stagger?: number;
  } = {}) {    const target = element instanceof ElementRef ? element.nativeElement : element;

    // Split text into words or lines for stagger effect
    const words = target.textContent?.split(' ') || [];
    if (words.length > 1) {
      target.innerHTML = words.map((word: string) => `<span class="word">${word}</span>`).join(' ');
      const wordElements = target.querySelectorAll('.word');

      return gsap.fromTo(wordElements,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: options.duration || 0.6,
          delay: options.delay || 0,
          stagger: options.stagger || 0.1,
          ease: "power2.out"
        }
      );
    } else {
      return this.fadeIn(element, options);
    }
  }

  /**
   * Scroll-triggered animations
   */
  scrollTriggerAnimation(element: ElementRef | Element, animation: gsap.core.Tween, options: {
    trigger?: Element;
    start?: string;
    end?: string;
    scrub?: boolean;
  } = {}) {
    const target = element instanceof ElementRef ? element.nativeElement : element;

    ScrollTrigger.create({
      trigger: options.trigger || target,
      start: options.start || "top 80%",
      end: options.end || "bottom 20%",
      animation: animation,
      scrub: options.scrub || false,
    });
  }

  /**
   * Create timeline for complex animations
   */
  createTimeline(options: gsap.TimelineVars = {}) {
    return gsap.timeline(options);
  }

  /**
   * Kill all animations on an element
   */
  killAnimations(element: ElementRef | Element) {
    const target = element instanceof ElementRef ? element.nativeElement : element;
    gsap.killTweensOf(target);
  }

  /**
   * Set initial state for animations
   */
  set(element: ElementRef | Element, properties: gsap.TweenVars) {
    const target = element instanceof ElementRef ? element.nativeElement : element;
    return gsap.set(target, properties);
  }
}
