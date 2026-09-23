import React, { useRef, useEffect, useState } from 'react';
import {
  Target,
  TrendingUp,
  Globe,
  Users,
  Search,
  DollarSign,
  Calculator,
  Cpu,
  ShieldAlert,
  Rocket,
  Compass,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Z_INDEX } from '../constants/zIndex';

export interface AnalysisSectionItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export const ANALYSIS_SECTIONS: AnalysisSectionItem[] = [
  { id: 'problem-demand', label: '1. Problem & Demand', shortLabel: 'Problem', icon: Target },
  { id: 'market-sizing', label: '2. Market Sizing (TAM)', shortLabel: 'Market TAM', icon: TrendingUp },
  {
    id: 'market-research',
    label: 'Real-Time Market Research',
    shortLabel: 'Market Research',
    icon: Globe,
    badge: 'LIVE',
    highlight: true,
  },
  { id: 'competitors', label: '3. Competitors & Moat', shortLabel: 'Competitors', icon: Users },
  {
    id: 'competitor-intelligence',
    label: 'Competitor Intelligence',
    shortLabel: 'Competitor Intel',
    icon: Search,
    badge: 'PRO',
    highlight: true,
  },
  { id: 'business-model', label: '4. Business Model & Pricing', shortLabel: 'Revenue', icon: DollarSign },
  {
    id: 'financial-projections',
    label: 'Financial Projections',
    shortLabel: 'Financials',
    icon: Calculator,
    badge: 'SIMULATOR',
    highlight: true,
  },
  { id: 'tech-architecture', label: '5. Technical Feasibility', shortLabel: 'Tech Feasibility', icon: Cpu },
  { id: 'risk-matrix', label: '6. Risk Matrix', shortLabel: 'Risks', icon: ShieldAlert },
  { id: 'mvp-roadmap', label: '7. MVP Roadmap', shortLabel: 'MVP Roadmap', icon: Rocket },
  { id: 'go-to-market', label: '8. Go-To-Market', shortLabel: 'GTM Strategy', icon: Compass },
  { id: 'recommendations', label: '9. Recommendations', shortLabel: 'Next Steps', icon: Sparkles },
];

interface AnalysisSecondaryNavProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
}

export const AnalysisSecondaryNav: React.FC<AnalysisSecondaryNavProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds for edge fade / arrows
  const checkScrollBounds = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, []);

  // Auto-scroll the active tab into view inside the horizontal bar
  useEffect(() => {
    if (!activeSection) return;
    const activeEl = tabRefs.current[activeSection];
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      // Re-check scroll buttons after scroll settles
      setTimeout(checkScrollBounds, 350);
    }
  }, [activeSection]);

  const handleScrollBy = (distance: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % ANALYSIS_SECTIONS.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + ANALYSIS_SECTIONS.length) % ANALYSIS_SECTIONS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = ANALYSIS_SECTIONS.length - 1;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const targetSection = ANALYSIS_SECTIONS[targetIndex];
      onSelectSection(targetSection.id);
      tabRefs.current[targetSection.id]?.focus();
    }
  };

  return (
    <div
      id="analysis-secondary-nav-wrapper"
      className={`sticky top-16 ${Z_INDEX.SECONDARY_NAV} -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 py-2.5 mt-0 mb-8 transition-colors shadow-xs`}
    >
      <div className="relative flex items-center max-w-7xl mx-auto">
        {/* Left Scroll Arrow (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollBy(-220)}
            aria-label="Scroll navigation left"
            className={`hidden sm:flex absolute left-0 ${Z_INDEX.SCROLL_CHEVRON} h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Left Fade Mask */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent transition-opacity duration-200 ${Z_INDEX.SCROLL_MASK} ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Scrollable Navigation Container */}
        <nav
          ref={scrollContainerRef}
          aria-label="Analysis sections"
          role="tablist"
          className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-0.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {ANALYSIS_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                ref={(el) => {
                  tabRefs.current[section.id] = el;
                }}
                id={`analysis-nav-tab-${section.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={section.id}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectSection(section.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`group flex items-center gap-2 px-3 sm:px-3.5 py-2 min-h-[42px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-sm shadow-indigo-500/25 border border-indigo-500/30'
                    : section.highlight
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/90'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'text-white'
                      : section.highlight
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                <span>{section.label}</span>

                {section.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 border-blue-400/20'
                    }`}
                  >
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Fade Mask */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent transition-opacity duration-200 ${Z_INDEX.SCROLL_MASK} ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right Scroll Arrow (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollBy(220)}
            aria-label="Scroll navigation right"
            className={`hidden sm:flex absolute right-0 ${Z_INDEX.SCROLL_CHEVRON} h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
