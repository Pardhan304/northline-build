import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { ClosingCta } from '@/components/public/ClosingCta';
import { fetchPublicProjectBySlug } from '@/services/public-api';

interface ProjectDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchPublicProjectBySlug(slug).catch(() => null);
  if (!project) {
    return { title: 'Project Not Found' };
  }

  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.excerpt,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const project = await fetchPublicProjectBySlug(slug).catch(() => null);

  if (!project) {
    notFound();
  }

  const cover = project.media.find((m) => m.role === 'COVER') ?? project.media[0] ?? null;
  const gallery = project.media.filter((m) => m.mediaId !== cover?.mediaId);
  const coverUrl = cover?.variants?.hero?.url ?? cover?.publicUrl ?? null;

  return (
    <>
      <article className="bg-white px-6 pt-36 pb-20 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-28">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase transition-colors hover:text-[#0E0E0E]"
          >
            <span aria-hidden="true">←</span>
            <span>Back to projects</span>
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                {project.category}
              </p>
              <MaskedTextReveal
                as="h1"
                immediate
                text={project.title}
                className="mt-4 text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5rem]"
              />
              {project.excerpt ? (
                <p className="mt-6 max-w-2xl text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#5C5C5C] md:text-[1.25rem]">
                  {project.excerpt}
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-6 border-t border-[#0E0E0E]/12 pt-6 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                  Category
                </dt>
                <dd className="mt-1 text-[0.94rem] font-medium text-[#0E0E0E]">
                  {project.category}
                </dd>
              </div>
              {project.location ? (
                <div>
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-[0.94rem] font-medium text-[#0E0E0E]">
                    {project.location}
                  </dd>
                </div>
              ) : null}
              {project.area ? (
                <div>
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Area
                  </dt>
                  <dd className="mt-1 text-[0.94rem] font-medium text-[#0E0E0E]">{project.area}</dd>
                </div>
              ) : null}
              {project.clientName ? (
                <div>
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Client
                  </dt>
                  <dd className="mt-1 text-[0.94rem] font-medium text-[#0E0E0E]">
                    {project.clientName}
                  </dd>
                </div>
              ) : null}
              {project.completionDate ? (
                <div>
                  <dt className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Completed
                  </dt>
                  <dd className="mt-1 text-[0.94rem] font-medium tabular-nums text-[#0E0E0E]">
                    {new Date(project.completionDate).getUTCFullYear()}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {coverUrl ? (
            <div className="relative mt-14 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#F5F5F7]">
              <Image
                src={coverUrl}
                alt={cover?.altText || project.title}
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1328px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="mt-16 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                Project Overview
              </h2>
            </div>
            <div className="space-y-5 text-[1rem] leading-[1.65] text-[#5C5C5C] lg:col-span-8">
              {project.description
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>

          {gallery.length > 0 ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {gallery.map((item) => {
                const url = item.variants?.card?.url ?? item.publicUrl;
                if (!url) return null;
                return (
                  <div
                    key={item.mediaId}
                    className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F5F7]"
                  >
                    <Image
                      src={url}
                      alt={item.altText || project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </article>

      <ClosingCta
        eyebrow="Similar Scope?"
        heading="Discuss a project with Northline Build."
        ctaLabel="Get in touch"
        ctaHref="/contact"
      />
    </>
  );
}
