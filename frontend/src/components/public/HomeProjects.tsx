import Image from 'next/image';
import Link from 'next/link';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { RollUpLink } from '@/components/motion/RollUpButton';
import type { ProjectDto } from '@/types/api';

interface HomeProjectsProps {
  eyebrow?: string;
  heading: string;
  intro?: string;
  projects: ProjectDto[];
}

function getCoverMedia(project: ProjectDto) {
  return project.media.find((m) => m.role === 'COVER') ?? project.media[0] ?? null;
}

export function HomeProjects({ eyebrow, heading, intro, projects }: HomeProjectsProps) {
  return (
    <section
      data-cursor="-inverse"
      className="rounded-t-[2.5rem] bg-[#0E0E0E] px-6 py-24 text-white md:rounded-t-[4rem] md:px-14 md:py-36"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-12 md:flex-row md:items-end">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <MaskedTextReveal
              as="h2"
              text={heading}
              className="mt-4 text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-white md:text-[4.25rem]"
            />
            {intro ? (
              <p className="mt-5 max-w-xl text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#9A9A9A] md:text-[1.25rem]">
                {intro}
              </p>
            ) : null}
          </div>

          <RollUpLink
            href="/projects"
            className="border border-white/25 bg-[#0E0E0E] text-white"
            fillClassName="bg-white"
            hoverTextClassName="text-[#0E0E0E]"
          >
            View all work
          </RollUpLink>
        </div>

        {projects.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-white/15 bg-[#1A1A1A] p-10 text-white">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              Selected work
            </p>
            <h3 className="mt-3 text-[1.5rem] font-medium tracking-[-0.02em] text-white">
              Published case studies appear here automatically
            </h3>
            <p className="mt-2 max-w-xl text-[0.94rem] leading-[1.6] text-[#9A9A9A]">
              Manage and publish featured construction case studies from the Northline CMS.
            </p>
          </div>
        ) : (
          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">
            {projects.map((project, index) => {
              const cover = getCoverMedia(project);
              const imageUrl = cover?.variants?.card?.url ?? cover?.publicUrl ?? null;
              const year = project.completionDate
                ? new Date(project.completionDate).getUTCFullYear()
                : null;

              return (
                <article key={project.id} className={index % 2 === 1 ? 'md:mt-28' : ''}>
                  <Link href={`/projects/${project.slug}`} className="group block">
                    <div
                      data-cursor="-inverse"
                      data-cursor-text="Explore"
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#1A1A1A]"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={cover?.altText || project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-end p-8 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105">
                          <span className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                            {project.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/15 px-3.5 py-1 text-[0.75rem] font-medium text-white/80">
                        {project.category}
                      </span>
                      {project.location ? (
                        <span className="rounded-full border border-white/15 px-3.5 py-1 text-[0.75rem] font-medium text-[#9A9A9A]">
                          {project.location}
                        </span>
                      ) : null}
                      {project.area ? (
                        <span className="rounded-full border border-white/15 px-3.5 py-1 text-[0.75rem] font-medium text-[#9A9A9A]">
                          {project.area}
                        </span>
                      ) : null}
                      {year ? (
                        <span className="rounded-full border border-white/15 px-3.5 py-1 text-[0.75rem] font-medium tabular-nums text-[#9A9A9A]">
                          {year}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.02em] text-white transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1.5 md:text-[2rem]">
                      {project.title}
                    </h3>

                    {project.excerpt ? (
                      <p className="mt-2 line-clamp-2 max-w-lg text-[0.94rem] leading-[1.6] text-[#9A9A9A] md:text-[1rem]">
                        {project.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
