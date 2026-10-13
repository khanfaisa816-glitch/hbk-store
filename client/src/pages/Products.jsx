import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync, useTitle } from '../lib/hooks';
import { useStore } from '../context/StoreContext';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { EmptyState, ErrorBox, Pagination } from '../components/ui';
import { FilterIcon, SearchIcon, CloseIcon } from '../components/Icons';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most popular'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Best rated'],
];
const PAGE_SIZE = 12;

export default function Products() {
  const { categories } = useStore();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const get = (k) => params.get(k) || '';
  const page = Number(get('page')) || 1;

  // Change one or more filters. Any filter change goes back to page 1.
  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries({ page: '', ...changes })) {
      if (v === '' || v == null || v === false) next.delete(k);
      else next.set(k, v);
    }
    setParams(next);
  };

  const activeCategory = categories.find((c) => c.slug === get('category'));
  useTitle(activeCategory ? activeCategory.name : get('search') ? `Search: ${get('search')}` : 'Shop');

  const { data, error, loading, reload } = useAsync(
    () =>
      api.get('/products', {
        search: get('search'),
        category: get('category'),
        minPrice: get('minPrice'),
        maxPrice: get('maxPrice'),
        minRating: get('minRating'),
        inStock: get('inStock'),
        sort: get('sort') || 'newest',
        page,
        limit: PAGE_SIZE,
      }),
    [params.toString()]
  );

  const filterCount = ['category', 'minPrice', 'maxPrice', 'minRating', 'inStock'].filter((k) => get(k)).length;

  const submitPrice = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update({ minPrice: f.get('min'), maxPrice: f.get('max') });
  };

  const radio = 'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper';
  const filters = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-1 font-display font-bold">Category</legend>
        <label className={radio}>
          <input type="radio" name="cat" checked={!get('category')} onChange={() => update({ category: '' })} className="accent-brand-600" />
          All categories
        </label>
        {categories.map((c) => (
          <label key={c.id} className={radio}>
            <input type="radio" name="cat" checked={get('category') === c.slug} onChange={() => update({ category: c.slug })} className="accent-brand-600" />
            {c.name} <span className="text-ink-soft">({c.productCount})</span>
          </label>
        ))}
      </fieldset>

      <form onSubmit={submitPrice} key={`${get('minPrice')}-${get('maxPrice')}`}>
        <p className="mb-2 font-display font-bold">Price (Rs)</p>
        <div className="flex items-center gap-2">
          <input name="min" type="number" min="0" inputMode="numeric" placeholder="Min" defaultValue={get('minPrice')} className="input" aria-label="Minimum price" />
          <span className="text-ink-soft">to</span>
          <input name="max" type="number" min="0" inputMode="numeric" placeholder="Max" defaultValue={get('maxPrice')} className="input" aria-label="Maximum price" />
        </div>
        <button className="btn btn-outline btn-sm mt-2 w-full">Apply price</button>
      </form>

      <fieldset>
        <legend className="mb-1 font-display font-bold">Rating</legend>
        {[['', 'Any rating'], ['4', '4 stars and up'], ['3', '3 stars and up']].map(([v, label]) => (
          <label key={v} className={radio}>
            <input type="radio" name="rating" checked={get('minRating') === v} onChange={() => update({ minRating: v })} className="accent-brand-600" />
            {label}
          </label>
        ))}
      </fieldset>

      <label className={`${radio} font-medium`}>
        <input type="checkbox" checked={get('inStock') === 'true'} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} className="accent-brand-600" />
        In stock only
      </label>

      {(filterCount > 0 || get('search')) && (
        <button onClick={() => setParams({})} className="btn btn-ghost btn-sm w-full">
          <CloseIcon size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{activeCategory ? activeCategory.name : 'All products'}</h1>
        {activeCategory?.description && <p className="mt-1 text-ink-soft">{activeCategory.description}</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          {filters}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <form
              key={get('search')}
              onSubmit={(e) => {
                e.preventDefault();
                update({ search: new FormData(e.currentTarget).get('q').trim() });
              }}
              role="search"
              className="relative min-w-0 flex-1 basis-56"
            >
              <label htmlFor="shop-search" className="sr-only">
                Search products
              </label>
              <input id="shop-search" name="q" defaultValue={get('search')} placeholder="Search in the store" className="input pr-10" />
              <button aria-label="Search" className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink-soft hover:text-ink">
                <SearchIcon size={18} />
              </button>
            </form>

            <button onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="btn btn-outline lg:hidden">
              <FilterIcon size={16} /> Filters{filterCount > 0 && ` (${filterCount})`}
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-ink-soft">
                Sort by
              </label>
              <select id="sort" className="input !w-auto" value={get('sort') || 'newest'} onChange={(e) => update({ sort: e.target.value })}>
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtersOpen && <div className="panel mb-4 p-4 lg:hidden">{filters}</div>}

          {data && (
            <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
              {data.total} {data.total === 1 ? 'product' : 'products'}
              {get('search') && <> for "{get('search')}"</>}
            </p>
          )}

          {error ? (
            <ErrorBox error={error} onRetry={reload} />
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState icon="🔍" title="No products found" text="Try a different search or remove some filters." action={{ label: 'Clear filters', onClick: () => setParams({}) }} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(n) => { update({ page: n === 1 ? '' : n }); window.scrollTo(0, 0); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
