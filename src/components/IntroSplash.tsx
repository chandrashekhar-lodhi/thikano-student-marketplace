import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';

const BRAND_LETTERS = ['T', 'H', 'I', 'K', 'A', 'N', 'O'];
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_CURTAIN: [number, number, number, number] = [0.76, 0, 0.24, 1];

// Tracks whether the pre-home intro has already played during this page load
// so full page loads/refreshes on "/" play it once while in-app navigation stays instant.
let hasPlayedIntroThisLoad = false;

export function IntroSplash() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [visible, setVisible] = useState<boolean>(() => {
    return location.pathname === '/' && !hasPlayedIntroThisLoad;
  });

  useEffect(() => {
    if (location.pathname === '/' && !hasPlayedIntroThisLoad) {
      setVisible(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!visible) return;

    hasPlayedIntroThisLoad = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dismissTimer = window.setTimeout(
      () => {
        setVisible(false);
      },
      prefersReducedMotion ? 750 : 2350
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(dismissTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, prefersReducedMotion]);

  const dismiss = () => {
    hasPlayedIntroThisLoad = true;
    setVisible(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence
        onExitComplete={() => {
          document.body.style.overflow = '';
        }}
      >
        {visible && (
          <motion.div
            key="thikano-intro-splash"
            role="dialog"
            aria-modal="true"
            aria-label="THIKANO welcome intro"
            initial={{ y: '0%', opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0, transition: { duration: 0.25 } }
                : {
                    y: '-100%',
                    transition: { duration: 0.72, ease: EASE_CURTAIN },
                  }
            }
            className="fixed inset-0 z-50 bg-[#F3F5EF] text-[#202820] flex flex-col items-center justify-between px-6 py-8 select-none overflow-hidden"
          >
            {/* Top subtle bar with Skip action */}
            <div className="w-full max-w-6xl flex items-center justify-between">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xs font-medium tracking-[0.18em] uppercase text-[#174C3A]"
              >
                Jabalpur
              </motion.span>

              <button
                type="button"
                onClick={dismiss}
                className="min-h-[40px] px-4 py-2 text-xs font-medium text-[#202820]/65 hover:text-[#174C3A] transition-colors cursor-pointer"
              >
                Skip
              </button>
            </div>

            {/* Center Minimalist Logo + Kinetic Wordmark Stage */}
            <div className="flex flex-col items-center text-center">
              {/* Animated SVG Location Pin + House Roof + Doorway */}
              <div className="relative flex items-center justify-center mb-6">
                {/* Single subtle expanding locator ring */}
                {!prefersReducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0.65, opacity: 0.35 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    transition={{ duration: 1.35, ease: EASE_OUT_EXPO, delay: 0.35 }}
                    className="absolute w-20 h-20 rounded-full border border-[#174C3A]/35 pointer-events-none"
                  />
                )}

                <motion.svg
                  width="80"
                  height="80"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  initial={{ scale: 0.92, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                >
                  {/* Pin fill fades in smoothly once outline draws */}
                  <motion.path
                    d="M32 6C19.297 6 9 16.297 9 29c0 15.6 19.3 28 21.9 29.6a2.2 2.2 0 0 0 2.2 0C35.7 57 55 44.6 55 29 55 16.297 44.703 6 32 6Z"
                    fill="#174C3A"
                    initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.42, ease: 'easeOut' }}
                  />

                  {/* Pin outline traces cleanly */}
                  <motion.path
                    d="M32 6C19.297 6 9 16.297 9 29c0 15.6 19.3 28 21.9 29.6a2.2 2.2 0 0 0 2.2 0C35.7 57 55 44.6 55 29 55 16.297 44.703 6 32 6Z"
                    stroke="#174C3A"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
                  />

                  {/* Roof line */}
                  <motion.path
                    d="M20.5 30 32 20l11.5 10"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.42, delay: 0.48, ease: EASE_OUT_EXPO }}
                  />

                  {/* House walls */}
                  <motion.path
                    d="M24.5 28v13h15V28"
                    stroke="#FFFFFF"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.42, delay: 0.58, ease: EASE_OUT_EXPO }}
                  />

                  {/* Warm doorway rises from threshold */}
                  <motion.path
                    d="M29.2 41v-7.5a2.8 2.8 0 0 1 5.6 0V41"
                    fill="#E9A45B"
                    style={{ transformOrigin: '32px 41px' }}
                    initial={{
                      scaleY: prefersReducedMotion ? 1 : 0,
                      opacity: prefersReducedMotion ? 1 : 0,
                    }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.72, ease: EASE_OUT_EXPO }}
                  />
                </motion.svg>
              </div>

              {/* Staggered Masked Wordmark */}
              <div
                aria-label="THIKANO"
                className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-hidden"
              >
                {BRAND_LETTERS.map((letter, idx) => (
                  <span key={letter} className="inline-block overflow-hidden">
                    <motion.span
                      className="inline-block font-heading text-4xl sm:text-5xl font-bold tracking-[0.08em] text-[#174C3A]"
                      initial={prefersReducedMotion ? { opacity: 0 } : { y: '105%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{
                        duration: 0.62,
                        delay: prefersReducedMotion ? 0.1 : 0.56 + idx * 0.045,
                        ease: EASE_OUT_EXPO,
                      }}
                    >
                      {letter}
                    </motion.span>
                  </span>
                ))}
              </div>

              {/* Minimal Hairline Divider */}
              <motion.div
                aria-hidden="true"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.96, ease: EASE_OUT_EXPO }}
                className="w-32 h-px bg-[#174C3A]/20 my-5 origin-center"
              />

              {/* Masked Primary Tagline Reveal */}
              <div className="overflow-hidden">
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.55, delay: 1.08, ease: EASE_OUT_EXPO }}
                  className="font-heading text-base sm:text-lg font-medium text-[#202820] tracking-tight"
                >
                  Apni jagah, aasani se.
                </motion.p>
              </div>

              {/* Supporting Minimal Metadata */}
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 1.28, ease: EASE_OUT_EXPO }}
                className="mt-2 text-xs sm:text-sm text-[#202820]/60 tracking-wide"
              >
                Find Your Place. Feel at Home. <span aria-hidden="true">·</span> Student Stays
              </motion.p>
            </div>

            {/* Bottom Minimal Loading Hairline */}
            <div className="w-full max-w-[180px] flex flex-col items-center gap-2">
              <div className="w-full h-[2px] bg-[#174C3A]/12 overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.55 : 2.05,
                    delay: 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full w-full bg-[#174C3A] origin-left"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
