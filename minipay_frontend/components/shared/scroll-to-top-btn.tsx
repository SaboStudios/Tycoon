'use client';

import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JSX, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const ScrollToTopBtn: React.FC = (): JSX.Element | null => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = (): void => {
      setIsVisible(window.scrollY > 280);
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onLeaderboard = pathname === '/leaderboard';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`fixed z-[90] ${
            onLeaderboard
              ? 'bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4'
              : 'bottom-6 right-4 md:bottom-8 md:right-8'
          }`}
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="group flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-[#03383a]/95 to-[#011112]/98 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-200 hover:border-cyan-300/60 hover:shadow-[0_0_28px_rgba(0,240,255,0.35)] active:scale-95"
          >
            <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopBtn;
