import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

export type MenuItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

interface HamburgerMenuProps {
  items: MenuItem[];
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  items,
  ease = 'power3.easeOut',
  baseColor = '#fff',
  pillColor = '#060010',
  hoveredPillTextColor = '#060010',
  pillTextColor
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const resolvedPillTextColor = pillTextColor ?? baseColor;

  useEffect(() => {
    console.log('isMobileMenuOpen:', isMobileMenuOpen);
    console.log('items:', items);
  }, [isMobileMenuOpen, items]);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.fromTo(
          menu,
          { opacity: 0, y: -10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease,
            pointerEvents: 'auto'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease,
          pointerEvents: 'none'
        });
      }
    }
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  return (
    <div className="relative md:hidden">
      {/* Hamburger Button */}
      <button
        ref={hamburgerRef}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
        className="rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0"
        style={{
          width: '36px',
          height: '36px',
          background: 'var(--base, #000)'
        }}
      >
        <span
          className="hamburger-line w-4 h-0.5 rounded origin-center"
          style={{ background: 'var(--pill-bg, #fff)' }}
        />
        <span
          className="hamburger-line w-4 h-0.5 rounded origin-center"
          style={{ background: 'var(--pill-bg, #fff)' }}
        />
      </button>

      {/* Mobile Menu */}
      {items && items.length > 0 && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 rounded-2xl shadow-2xl backdrop-blur-md bg-black/80 border border-white/20 z-50 w-48"
          style={{
            opacity: isMobileMenuOpen ? 1 : 0,
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}
        >
          <ul className="list-none m-0 p-4 flex flex-col gap-3">
            {items.map((item) => {
              const pillStyle: React.CSSProperties = {
                background: pillColor,
                color: resolvedPillTextColor,
                paddingLeft: '20px',
                paddingRight: '20px',
                textAlign: 'center',
                display: 'block',
                width: '100%'
              };

              const basePillClasses =
                'relative overflow-hidden block h-10 no-underline rounded-full box-border font-semibold text-sm uppercase tracking-wide whitespace-nowrap cursor-pointer transition-all';

              return (
                <li key={item.href} className="flex justify-center">
                  {isRouterLink(item.href) ? (
                    <Link
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
