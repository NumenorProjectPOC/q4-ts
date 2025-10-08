"use client";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];            // e.g. ["/assets/seq/01.jpg", "/assets/seq/02.jpg", "/assets/seq/03.jpg"]
  sectionVh?: number;          // total height (in viewport heights) of this zoom section
  fromScale?: number;          // per-image starting scale
  toScale?: number;            // per-image ending scale
  fromTranslateY?: number;     // per-image starting translateY (px)
  toTranslateY?: number;       // per-image ending translateY (px)
  stepSensitivity?: number;    // how much each wheel notch advances the playhead (lower = slower)
  smoothing?: number;          // easing for the playhead (0..0.3 is good)
  className?: string;
  children?: React.ReactNode;  // optional overlay content
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function ScrollZoomSection({
  images,
  sectionVh = 2.7,        // Taller section => more scroll distance (slower overall)
  fromScale = 1.0,
  toScale = 1.95,
  fromTranslateY = 0,
  toTranslateY = -120,
  stepSensitivity = 0.1,   // Slower than previous (you can raise to 0.7–0.8 if you want a tad faster)
  smoothing = 0.18,
  className = "",
  children,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Playhead (target and smoothed), measured in "image segments":
  //   0..1 => animating image 0
  //   1..2 => animating image 1
  //   ...
  const target = useRef(0);
  const smooth = useRef(0);

  const [segIndex, setSegIndex] = useState(0); // current integer segment index
  
  // FIXED: Track scroll position for browser scrollbar detection
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);

  // Preload first few images
  useEffect(() => {
    images.slice(0, 3).forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, [images]);

  useEffect(() => {
    if (!sectionRef.current || !layerRef.current) return;
    const section = sectionRef.current;
    const layer = layerRef.current;
    let raf = 0;

    const PIN_TOLERANCE = 8; // px tolerance to consider "fully pinned"

    const isVisible = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return rect.top < vh && rect.bottom > 0;
    };

    // Only zoom when the sticky area fully occupies the viewport.
    const isPinnedFully = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return rect.top <= PIN_TOLERANCE && rect.bottom >= vh - PIN_TOLERANCE;
    };

    const totalLen = Math.max(images.length, 1);           // number of segments
    const playheadMax = totalLen - 0.0001;                 // allow last subProgress to reach ~1.0

    const render = () => {
      smooth.current += (target.current - smooth.current) * smoothing;
      const p = clamp(smooth.current, 0, playheadMax);

      // Segment and sub-progress
      const i = Math.floor(p);
      const sub = p - i;                                   // 0..~1
      if (i !== segIndex) setSegIndex(i);

      // Transform for the current image
      const eased = ease(sub);
      const scale = fromScale + (toScale - fromScale) * eased;
      const y = fromTranslateY + (toTranslateY - fromTranslateY) * eased;

      // Build two layers for a soft crossfade near segment end
      // Current image opacity: 1 until sub ~0.9, then fade out to 0
      // Next image opacity: 0 until sub ~0.9, then fade in to 1
      const FADE_START = 0.9;
      const fadeT = clamp((sub - FADE_START) / (1 - FADE_START), 0, 1);
      const nextIndex = Math.min(i + 1, images.length - 1);

      // Paint layers
      const html = `
        <div class="absolute inset-0">
          <img src="${images[i] ?? images[0]}" alt="" class="h-full w-full object-cover select-none pointer-events-none" style="opacity:${1 - fadeT}" />
        </div>
        <div class="absolute inset-0">
          <img src="${images[nextIndex] ?? images[i] ?? images[0]}" alt="" class="h-full w-full object-cover select-none pointer-events-none" style="opacity:${fadeT}" />
        </div>
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35)_100%)]"></div>
      `;
      if (layer.innerHTML !== html) {
        layer.innerHTML = html;
      }

      // Apply transform to the whole stack
      layer.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;

      raf = requestAnimationFrame(render);
    };

    // FIXED: Enhanced wheel handler that works with touchpad AND scrollbar
    const onWheel = (e: WheelEvent) => {
      if (!isVisible()) return;
      if (!isPinnedFully()) return;

      const atStart = target.current <= 0;
      const atEnd = target.current >= playheadMax;

      // Release the page scroll at edges
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) {
        return;
      }

      // FIXED: Detect scrollbar vs touchpad scrolling
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const timeDelta = now - (lastScrollY.current || now);
      const scrollDelta = Math.abs(currentScrollY - (lastScrollY.current || currentScrollY));
      
      // Update tracking
      lastScrollY.current = currentScrollY;
      
      // Calculate velocity for better detection
      const velocity = timeDelta > 0 ? scrollDelta / timeDelta : 0;
      scrollVelocity.current = velocity;

      // FIXED: Different sensitivity for different input methods
      let sensitivity = stepSensitivity;
      
      // Detect touchpad (smaller, smoother increments) vs mouse wheel (larger, discrete increments)
      if (Math.abs(e.deltaY) < 50 && velocity < 2) {
        // Likely touchpad - use normal sensitivity
        sensitivity = stepSensitivity;
      } else if (Math.abs(e.deltaY) >= 100 || velocity > 5) {
        // Likely mouse wheel or scrollbar - increase sensitivity for better responsiveness
        sensitivity = stepSensitivity * 2.5;
      }

      // Trap and scrub while inside
      e.preventDefault();
      target.current = clamp(
        target.current + Math.sign(e.deltaY) * sensitivity,
        0,
        playheadMax
      );
    };

    // FIXED: Additional scroll handler for browser scrollbar dragging
    const onScroll = () => {
      if (!isVisible()) return;
      if (!isPinnedFully()) return;

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      if (Math.abs(scrollDelta) > 5) { // Threshold for scrollbar dragging
        const atStart = target.current <= 0;
        const atEnd = target.current >= playheadMax;

        // Release at edges
        if ((atStart && scrollDelta < 0) || (atEnd && scrollDelta > 0)) {
          lastScrollY.current = currentScrollY;
          return;
        }

        // Update playhead based on scroll position change
        const scrollSensitivity = stepSensitivity * 3; // Higher sensitivity for scroll dragging
        target.current = clamp(
          target.current + Math.sign(scrollDelta) * scrollSensitivity,
          0,
          playheadMax
        );

        lastScrollY.current = currentScrollY;
      }
    };

    // FIXED: Add both event listeners
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    images,
    sectionVh,
    fromScale,
    toScale,
    fromTranslateY,
    toTranslateY,
    smoothing,
    stepSensitivity,
    segIndex,
  ]);

  return (
    <section
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ height: `${sectionVh * 100}vh` }}
      aria-label="Scroll zoom sequence"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Transformed multi-layer (we swap innerHTML to avoid recreating nodes) */}
        <div
          ref={layerRef}
          className="absolute inset-0 [will-change:transform] [transform-origin:center]"
        />
        {/* Optional overlay */}
        {children ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}