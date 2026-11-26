'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

interface ProjectsFilterBarProps {
  initialSearch?: string;
  initialCategory?: string;
  categories: string[];
}

export function ProjectsFilterBar({
  initialSearch = '',
  initialCategory = '',
  categories,
}: ProjectsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);

  const applyFilters = (nextSearch: string, nextCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSearch.trim()) {
      params.set('search', nextSearch.trim());
    } else {
      params.delete('search');
    }
    if (nextCategory) {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/projects?${qs}` : '/projects');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters(search, category);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 border-y border-border py-6 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="projects-search"
          className="block font-mono text-xs tracking-[0.12em] text-olive uppercase"
        >
          Search projects
        </label>
        <input
          id="projects-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project title or location"
          className="mt-2 w-full border border-border bg-surface px-4 py-2.5 text-sm text-graphite placeholder:text-concrete focus:border-graphite focus:outline-none"
        />
      </div>

      {categories.length > 0 ? (
        <div className="sm:w-56">
          <label
            htmlFor="projects-category"
            className="block font-mono text-xs tracking-[0.12em] text-olive uppercase"
          >
            Category
          </label>
          <select
            id="projects-category"
            value={category}
            onChange={(e) => {
              const nextCat = e.target.value;
              setCategory(nextCat);
              applyFilters(search, nextCat);
            }}
            className="mt-2 w-full border border-border bg-surface px-4 py-2.5 text-sm text-graphite focus:border-graphite focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="submit"
        className="border border-graphite bg-graphite px-6 py-2.5 text-xs font-semibold tracking-[0.14em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
      >
        Apply
      </button>
    </form>
  );
}
