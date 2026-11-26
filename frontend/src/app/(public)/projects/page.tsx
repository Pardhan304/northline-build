import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { ProjectsFilterBar } from '@/components/public/ProjectsFilterBar';
import { EmptyState, ErrorState } from '@/components/ui/AsyncStates';
import { fetchPublicProjects } from '@/services/public-api';
import type { PaginationMeta, ProjectDto } from '@/types/api';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Published construction, engineering, and architectural case studies.',
};

interface ProjectsPageProps {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category?.trim() || undefined;
  const search = params.search?.trim() || undefined;

  let items: ProjectDto[] = [];
  let meta: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };
  let loadError = false;

  try {
    const res = await fetchPublicProjects({ page, limit: 10, category, search });
    items = res.items;
    meta = res.meta;
  } catch {
    loadError = true;
  }

  const categories = Array.from(new Set(items.map((p) => p.category))).sort();

  return (
    <>
      <section className="bg-white px-6 pt-36 pb-14 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
            Portfolio
          </p>
          <MaskedTextReveal
            as="h1"
            immediate
            text="Selected & delivered projects."
            className="mt-4 max-w-4xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5.5rem]"
          />
        </div>
      </section>

      <section className="bg-white px-6 pb-24 md:px-14 md:pb-32">
        <div className="mx-auto max-w-[1440px]">
          <Suspense fallback={null}>
            <ProjectsFilterBar
              initialSearch={search}
              initialCategory={category}
              categories={categories}
            />
          </Suspense>

          <div className="mt-14">
            {loadError ? (
              <ErrorState
                title="Unable to load projects"
                message="Could not retrieve published projects from the API server."
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="No matching published projects"
                description={
                  search || category
                    ? 'Try clearing your search or category filter.'
                    : 'Published projects created in the Northline admin panel will appear here.'
                }
              />
            ) : (
              <>
                <div className="grid gap-x-10 gap-y-16 md:grid-cols-2">
                  {items.map((project, index) => {
                    const cover =
                      project.media.find((m) => m.role === 'COVER') ?? project.media[0] ?? null;
                    const imageUrl = cover?.variants?.card?.url ?? cover?.publicUrl ?? null;

                    return (
                      <article key={project.id} className={index % 2 === 1 ? 'md:mt-20' : ''}>
                        <Link href={`/projects/${project.slug}`} className="group block">
                          <div
                            data-cursor="-inverse"
                            data-cursor-text="Explore"
                            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#F5F5F7]"
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
                              <div className="flex h-full w-full items-end p-8">
                                <span className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                                  {project.category}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#0E0E0E]/12 px-3.5 py-1 text-[0.75rem] font-medium text-[#5C5C5C]">
                              {project.category}
                            </span>
                            {project.location ? (
                              <span className="rounded-full border border-[#0E0E0E]/12 px-3.5 py-1 text-[0.75rem] font-medium text-[#9A9A9A]">
                                {project.location}
                              </span>
                            ) : null}
                          </div>

                          <h2 className="mt-4 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.02em] text-[#0E0E0E] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1.5 md:text-[2rem]">
                            {project.title}
                          </h2>

                          {project.excerpt ? (
                            <p className="mt-2 line-clamp-2 max-w-lg text-[0.94rem] leading-[1.6] text-[#5C5C5C]">
                              {project.excerpt}
                            </p>
                          ) : null}
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {meta.totalPages > 1 ? (
                  <nav
                    aria-label="Projects pagination"
                    className="mt-16 flex items-center justify-between border-t border-[#0E0E0E]/12 pt-6 text-xs text-[#5C5C5C]"
                  >
                    <span>
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <div className="flex gap-3">
                      {meta.page > 1 ? (
                        <Link
                          href={`/projects?page=${meta.page - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="rounded-full border border-[#0E0E0E]/15 bg-[#F5F5F7] px-5 py-2 font-medium text-[#0E0E0E]"
                        >
                          Previous
                        </Link>
                      ) : null}
                      {meta.page < meta.totalPages ? (
                        <Link
                          href={`/projects?page=${meta.page + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="rounded-full border border-[#0E0E0E]/15 bg-[#F5F5F7] px-5 py-2 font-medium text-[#0E0E0E]"
                        >
                          Next
                        </Link>
                      ) : null}
                    </div>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
