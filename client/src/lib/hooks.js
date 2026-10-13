import { useEffect, useState, useCallback } from 'react';

// Sets the browser tab title
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | HBK` : 'HBK';
  }, [title]);
}

// Runs an async loader and tracks loading / error state.
// `deps` decide when it runs again. `reload()` runs it on demand.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}

// Delays a fast-changing value (like a search box) until typing pauses
export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
