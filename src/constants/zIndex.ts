/**
 * VentureLens AI - Formal Z-Index Hierarchy
 *
 * This formal stacking system prevents visual clipping, unintended overlaps,
 * and backdrop leaks during fast scroll, drawer animations, and modal interactions.
 *
 * Hierarchy (from lowest to highest):
 * - z-0      : Base page content, cards, radar charts, typography
 * - z-10     : In-content sticky elements (table sticky headers/columns in FeatureMatrixTable)
 * - z-20     : In-page interactive masks & scroll indicators
 * - z-25     : Floating Action Buttons (VentureLensAdvisor launcher button at bottom-6 right-6)
 * - z-30     : Secondary Sticky Analysis Navigation (sticky top-16, sits directly flush under Navbar)
 * - z-40     : Floating Advisor Panel (Chat/Voice responsive drawer)
 * - z-50     : Primary Global Header/Navbar (sticky top-0, always above secondary nav and page content)
 * - z-55     : Global Navbar Dropdowns (User menu, Mobile Navigation Drawer)
 * - z-60     : Modal Backdrops & Dialogs (CompetitorDirectory battlecard modal, full-screen dialogs)
 * - z-70     : System-level Notifications, Popovers & Floating Tooltips
 */

export const Z_INDEX = {
  /** Base document flow and standard cards */
  BASE: 'z-0',

  /** In-content sticky components like table columns */
  IN_CONTENT_STICKY: 'z-10',

  /** Fade masks and internal horizontal scroll edges */
  SCROLL_MASK: 'z-[2]',
  SCROLL_CHEVRON: 'z-[3]',

  /** Floating Action Button (FAB) in the bottom-right corner */
  ADVISOR_FAB: 'z-[25]',

  /** Secondary Analysis Navigation Bar (sticky top-16) */
  SECONDARY_NAV: 'z-30',

  /** Floating AI Advisor Chat / Voice expanded dialog */
  ADVISOR_PANEL: 'z-40',

  /** Primary Global Navbar header (sticky top-0) */
  GLOBAL_NAV: 'z-50',

  /** Global Navbar user menu dropdown and mobile menu drawer */
  NAV_DROPDOWN: 'z-[55]',

  /** Fullscreen modal backdrop and dialog windows */
  MODAL_BACKDROP: 'z-[60]',

  /** High-priority tooltips and toast notifications */
  TOOLTIP_TOAST: 'z-[70]',
} as const;
