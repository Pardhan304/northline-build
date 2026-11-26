import Link from 'next/link';
import { NorthlineLogo } from '@/components/brand/NorthlineLogo';
import { RollUpLink } from '@/components/motion/RollUpButton';
import type { PublicSettingsDto } from '@/types/api';

interface SiteFooterProps {
  settings: PublicSettingsDto;
}

export function SiteFooter({ settings }: SiteFooterProps) {
  const companyName = settings.general?.companyName || 'Northline Build';
  const statement =
    settings.general?.footerStatement || 'Building with purpose. Delivering with care.';
  const contact = settings.contact;
  const social = settings.social;

  return (
    <footer
      data-cursor="-inverse"
      className="rounded-t-[2.5rem] bg-[#0E0E0E] px-6 py-20 text-white md:rounded-t-[4rem] md:px-14 md:py-28"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 border-b border-white/15 pb-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              Start a conversation
            </p>
            <h2 className="mt-4 max-w-3xl text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-white md:text-[4.25rem]">
              Have a project in mind?
            </h2>
          </div>
          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <RollUpLink
              href="/contact"
              className="border border-white/30 bg-[#0E0E0E] text-white"
              fillClassName="bg-white"
              hoverTextClassName="text-[#0E0E0E]"
            >
              Let’s talk
            </RollUpLink>
          </div>
        </div>

        <div className="grid gap-10 py-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex text-white" aria-label={companyName}>
              <NorthlineLogo size="md" className="text-white" />
            </Link>
            <p className="mt-4 max-w-sm text-[0.94rem] leading-[1.6] text-[#9A9A9A]">{statement}</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              Navigation
            </p>
            <ul className="mt-4 space-y-2.5 text-[0.94rem]">
              <li>
                <Link href="/" className="text-white/80 transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              Contact
            </p>
            <div className="mt-4 space-y-2 text-[0.94rem] text-[#9A9A9A]">
              {contact?.email ? (
                <p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-white transition-colors hover:text-[#9A9A9A]"
                  >
                    {contact.email}
                  </a>
                </p>
              ) : null}
              {contact?.phone ? (
                <p>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    className="text-white transition-colors hover:text-[#9A9A9A]"
                  >
                    {contact.phone}
                  </a>
                </p>
              ) : null}
              {contact?.address ? <p>{contact.address}</p> : null}
              {contact?.businessHours ? <p>{contact.businessHours}</p> : null}
              {!contact?.email && !contact?.phone && !contact?.address ? (
                <p>Enquiries can be submitted directly via our contact page.</p>
              ) : null}
            </div>

            {social?.linkedinUrl || social?.instagramUrl ? (
              <div className="mt-6 flex items-center gap-5 text-[0.75rem] font-medium tracking-[0.08em] uppercase">
                {social.linkedinUrl ? (
                  <a
                    href={social.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 transition-colors hover:text-white"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {social.instagramUrl ? (
                  <a
                    href={social.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 transition-colors hover:text-white"
                  >
                    Instagram
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-white/15 pt-8 text-[0.75rem] text-[#9A9A9A] sm:flex-row">
          <p>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <p>Construction · Engineering · Project Delivery</p>
        </div>
      </div>
    </footer>
  );
}
