'use client';

import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NorthlineLogo } from '@/components/brand/NorthlineLogo';
import { Magnetic } from '@/components/motion/Magnetic';
import { RollUpLink } from '@/components/motion/RollUpButton';
import type { PublicContactSettings, PublicSocialSettings, ServiceDto } from '@/types/api';

interface SiteHeaderProps {
  companyName?: string;
  contact?: PublicContactSettings;
  social?: PublicSocialSettings;
  services?: ServiceDto[];
}

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contacts' },
] as const;

export function SiteHeader({
  companyName = 'northline',
  contact,
  social,
  services = [],
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const dropdownTimerRef = useRef<number | null>(null);
  const hoverOpenedAtRef = useRef(0);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const drawer = drawerRef.current;
    if (!backdrop || !drawer) return;

    gsap.set(drawer, { xPercent: 100 });

    const tl = gsap.timeline({ paused: true });
    tl.set([backdrop, drawer], { pointerEvents: 'auto', visibility: 'visible' })
      .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0)
      .fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: 0.75, ease: 'power4.out' }, 0)
      .fromTo(
        drawer.querySelectorAll('.drawer-item'),
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.65, stagger: 0.045, ease: 'power4.out' },
        0.2,
      );

    timelineRef.current = tl;
    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    timelineRef.current?.timeScale(1).play();
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    timelineRef.current?.timeScale(1.35).reverse();
  }, []);

  const toggleDrawer = () => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  const openServicesDropdown = () => {
    if (dropdownTimerRef.current) {
      window.clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
    if (!servicesMenuOpen) {
      hoverOpenedAtRef.current = Date.now();
      setServicesMenuOpen(true);
    }
  };

  const handleServicesButtonClick = () => {
    if (!servicesMenuOpen) {
      setServicesMenuOpen(true);
      return;
    }
    // Avoid immediately closing a dropdown just opened by pointer hover
    if (Date.now() - hoverOpenedAtRef.current > 350) {
      setServicesMenuOpen(false);
    }
  };

  const scheduleCloseServicesDropdown = () => {
    if (dropdownTimerRef.current) {
      window.clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = window.setTimeout(() => {
      setServicesMenuOpen(false);
    }, 140);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeDrawer]);

  const isDarkHeroTop = pathname === '/' && !scrolled && !isOpen;

  return (
    <>
      <header
        data-cursor={isDarkHeroTop ? '-inverse' : undefined}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          isDarkHeroTop
            ? 'bg-transparent text-white'
            : 'md:border-b md:border-[#0E0E0E]/8 md:bg-white/90 md:text-[#0E0E0E] md:backdrop-blur-md'
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-14 md:py-4">
          {/* Desktop Horizontal Navigation Bar (matches Cuberto service header) */}
          <div className="hidden items-center justify-between md:flex">
            <Link
              href="/"
              aria-label={companyName}
              onClick={closeDrawer}
              className={`inline-flex cursor-pointer items-center transition-colors ${
                isDarkHeroTop ? 'text-white' : 'text-[#0E0E0E]'
              }`}
            >
              <NorthlineLogo size="md" />
            </Link>

            <nav aria-label="Primary navigation" className="flex items-center gap-8">
              <div
                className="relative"
                onMouseEnter={openServicesDropdown}
                onMouseLeave={scheduleCloseServicesDropdown}
              >
                <button
                  type="button"
                  aria-expanded={servicesMenuOpen}
                  onClick={handleServicesButtonClick}
                  className={`inline-flex cursor-pointer items-center gap-1.5 pb-0.5 text-[0.94rem] font-medium tracking-[-0.01em] transition-opacity hover:opacity-75 ${
                    isDarkHeroTop
                      ? 'border-b border-white/60 text-white'
                      : 'border-b border-[#0E0E0E]/40 text-[#0E0E0E]'
                  }`}
                >
                  <span>Services</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      servicesMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {servicesMenuOpen && services.length > 0 ? (
                  <div
                    onMouseEnter={openServicesDropdown}
                    onMouseLeave={scheduleCloseServicesDropdown}
                    className="absolute top-full right-0 mt-3 w-72 rounded-2xl border border-[#0E0E0E]/10 bg-white p-2.5 text-[#0E0E0E]"
                  >
                    {services.slice(0, 6).map((service) => (
                      <Link
                        key={service.id}
                        href="/#capabilities"
                        onClick={() => setServicesMenuOpen(false)}
                        className="block cursor-pointer rounded-xl px-3.5 py-2.5 text-[0.875rem] font-medium tracking-[-0.01em] text-[#0E0E0E] transition-colors hover:bg-[#F5F5F7]"
                      >
                        {service.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <Link
                href="/projects"
                className={`cursor-pointer text-[0.94rem] font-medium tracking-[-0.01em] transition-opacity hover:opacity-70 ${
                  pathname.startsWith('/projects') ? 'underline underline-offset-4' : ''
                }`}
              >
                Projects
              </Link>

              <Link
                href="/about"
                className={`cursor-pointer text-[0.94rem] font-medium tracking-[-0.01em] transition-opacity hover:opacity-70 ${
                  pathname.startsWith('/about') ? 'underline underline-offset-4' : ''
                }`}
              >
                About
              </Link>

              <RollUpLink
                href="/contact"
                className={`px-7 py-2.5 text-[0.94rem] font-medium ${
                  isDarkHeroTop
                    ? 'border border-white bg-white text-[#0E0E0E]'
                    : 'border border-[#0E0E0E] bg-[#0E0E0E] text-white'
                }`}
                fillClassName={isDarkHeroTop ? 'bg-[#E9E9EC]' : 'bg-[#2A2A2E]'}
                hoverTextClassName={isDarkHeroTop ? 'text-[#0E0E0E]' : 'text-white'}
              >
                Contacts
              </RollUpLink>
            </nav>
          </div>

          {/* Mobile Frosted Pill Navigation Bar */}
          <div className="flex items-center justify-between rounded-full border border-[#0E0E0E]/10 bg-white/88 px-5 py-2 text-[#0E0E0E] backdrop-blur-md md:hidden">
            <Link
              href="/"
              aria-label={companyName}
              onClick={closeDrawer}
              className="inline-flex cursor-pointer items-center text-[#0E0E0E]"
            >
              <NorthlineLogo size="sm" />
            </Link>

            <Magnetic>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls="cuberto-slide-drawer"
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={toggleDrawer}
                data-cursor="-hidden"
                className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
              >
                <span
                  className={`absolute block h-[1.8px] w-[20px] bg-[#0E0E0E] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    isOpen ? 'translate-y-0 rotate-45' : '-translate-y-[3.5px]'
                  }`}
                />
                <span
                  className={`absolute block h-[1.8px] w-[20px] bg-[#0E0E0E] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    isOpen ? 'translate-y-0 -rotate-45' : 'translate-y-[3.5px]'
                  }`}
                />
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        ref={backdropRef}
        aria-hidden={!isOpen}
        onClick={closeDrawer}
        className="invisible pointer-events-none fixed inset-0 z-40 bg-black/35 opacity-0 backdrop-blur-[2px]"
      />

      {/* Right Slide-Out Drawer (740px desktop) */}
      <aside
        id="cuberto-slide-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        className="invisible pointer-events-none fixed inset-y-0 right-0 z-40 flex w-full flex-col justify-between overflow-y-auto bg-white px-6 pt-28 pb-10 text-[#0E0E0E] md:w-[740px] md:px-16 md:pt-32 md:pb-12"
      >
        <div className="grid gap-12 md:grid-cols-12">
          {/* Left Column: Social & Capabilities */}
          <div className="order-2 space-y-10 md:order-1 md:col-span-5">
            {social?.linkedinUrl || social?.instagramUrl ? (
              <div>
                <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                  Social
                </p>
                <ul className="mt-4 space-y-2">
                  {social.linkedinUrl ? (
                    <li className="overflow-hidden">
                      <a
                        href={social.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="drawer-item group relative inline-block overflow-hidden text-[1rem] font-medium text-[#0E0E0E]"
                      >
                        <span className="block transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full">
                          LinkedIn
                        </span>
                        <span className="absolute inset-0 translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0">
                          LinkedIn
                        </span>
                      </a>
                    </li>
                  ) : null}
                  {social.instagramUrl ? (
                    <li className="overflow-hidden">
                      <a
                        href={social.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="drawer-item group relative inline-block overflow-hidden text-[1rem] font-medium text-[#0E0E0E]"
                      >
                        <span className="block transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full">
                          Instagram
                        </span>
                        <span className="absolute inset-0 translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0">
                          Instagram
                        </span>
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {services.length > 0 ? (
              <div>
                <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                  Capabilities
                </p>
                <ul className="mt-4 space-y-2 text-[0.94rem] text-[#5C5C5C]">
                  {services.slice(0, 6).map((service) => (
                    <li key={service.id} className="overflow-hidden">
                      <Link
                        href="/#capabilities"
                        onClick={closeDrawer}
                        className="drawer-item block transition-colors hover:text-[#0E0E0E]"
                      >
                        {service.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Right Column: Oversized Primary Links */}
          <nav aria-label="Primary drawer navigation" className="order-1 md:order-2 md:col-span-7">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              Menu
            </p>
            <ul className="mt-5 space-y-2">
              {PRIMARY_LINKS.map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <li key={item.href} className="overflow-hidden">
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      className={`drawer-item group relative inline-block overflow-hidden text-[2.25rem] leading-[1.12] font-medium tracking-[-0.025em] md:text-[3.375rem] ${
                        active ? 'text-[#0E0E0E]' : 'text-[#0E0E0E]/85'
                      }`}
                    >
                      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full">
                        {item.label}
                      </span>
                      <span className="absolute inset-0 translate-y-full text-[#5C5C5C] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Row: CMS Contact */}
        <div className="mt-12 border-t border-[#0E0E0E]/12 pt-6">
          <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
            Get in touch
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            {contact?.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="border-b border-[#0E0E0E]/30 pb-0.5 text-[1.06rem] font-medium tracking-[-0.01em] text-[#0E0E0E] transition-colors hover:border-[#0E0E0E]"
              >
                {contact.email}
              </a>
            ) : (
              <Link
                href="/contact"
                onClick={closeDrawer}
                className="border-b border-[#0E0E0E]/30 pb-0.5 text-[1.06rem] font-medium tracking-[-0.01em] text-[#0E0E0E] transition-colors hover:border-[#0E0E0E]"
              >
                Start a project enquiry
              </Link>
            )}
            {contact?.phone ? (
              <a
                href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                className="text-[0.94rem] text-[#5C5C5C] hover:text-[#0E0E0E]"
              >
                {contact.phone}
              </a>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
