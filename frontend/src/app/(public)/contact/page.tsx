import type { Metadata } from 'next';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { ContactForm } from '@/components/public/ContactForm';
import { fetchPublicPage, fetchPublicSettings } from '@/services/public-api';
import type { PublicSettingsDto } from '@/types/api';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicPage('contact').catch(() => null);
  return {
    title: page?.seoTitle || 'Contact',
    description:
      page?.seoDescription || 'Submit a construction or engineering enquiry to Northline Build.',
  };
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([
    fetchPublicPage('contact').catch(() => null),
    fetchPublicSettings().catch((): PublicSettingsDto => ({})),
  ]);

  const heroSection = page?.sections.find((s) => s.type === 'HERO' && s.isVisible);
  const headline =
    (typeof heroSection?.content.headline === 'string' && heroSection.content.headline) ||
    'Let’s give your next project a strong start.';
  const supportingText =
    (typeof heroSection?.content.supportingText === 'string' &&
      heroSection.content.supportingText) ||
    'Whether you’re planning a new facility, developing a commercial space or exploring a construction partnership, tell us a little about the project. Share the details you have today. We’ll take it from there.';

  const contact = settings.contact;
  const social = settings.social;

  return (
    <>
      <section className="border-b border-[#0E0E0E]/12 bg-white px-6 pt-36 pb-16 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-24">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
            Contact
          </p>
          <MaskedTextReveal
            as="h1"
            immediate
            text={headline}
            className="mt-4 max-w-4xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5.5rem]"
          />
          <p className="mt-6 max-w-2xl text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#5C5C5C] md:text-[1.25rem]">
            {supportingText}
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:px-14 md:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-4">
            <div>
              <h2 className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                Prefer to speak with someone?
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.6] text-[#5C5C5C]">
                Reach out directly or share your project details through the form. We’ll help you
                take the next step.
              </p>
            </div>

            <dl className="divide-y divide-[#0E0E0E]/12 border-y border-[#0E0E0E]/12 text-[0.94rem]">
              {contact?.email ? (
                <div className="py-4">
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Email
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-medium text-[#0E0E0E] hover:text-[#5C5C5C]"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              ) : null}

              {contact?.phone ? (
                <div className="py-4">
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Telephone
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                      className="font-medium text-[#0E0E0E] hover:text-[#5C5C5C]"
                    >
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              ) : null}

              {contact?.address ? (
                <div className="py-4">
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Office
                  </dt>
                  <dd className="mt-1 text-[#5C5C5C]">{contact.address}</dd>
                </div>
              ) : null}

              {contact?.businessHours ? (
                <div className="py-4">
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Hours
                  </dt>
                  <dd className="mt-1 text-[#5C5C5C]">{contact.businessHours}</dd>
                </div>
              ) : null}
            </dl>

            {social?.linkedinUrl || social?.instagramUrl ? (
              <div className="flex items-center gap-5 text-[0.75rem] font-medium tracking-[0.08em] uppercase">
                {social.linkedinUrl ? (
                  <a
                    href={social.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0E0E0E] hover:text-[#5C5C5C]"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {social.instagramUrl ? (
                  <a
                    href={social.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0E0E0E] hover:text-[#5C5C5C]"
                  >
                    Instagram
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-8">
            <div className="mb-8">
              <h2 className="text-[1.75rem] font-medium tracking-[-0.02em] text-[#0E0E0E] md:text-[2.25rem]">
                Tell us what you’re planning.
              </h2>
              <p className="mt-2 text-[0.94rem] leading-[1.6] text-[#5C5C5C]">
                A few details will help us understand your requirements and direct your enquiry to
                the right team.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
