import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../api';

/**
 * Runs an async loader and tracks loading / error state.
 * `reload()` re-runs it; stale responses from older runs are ignored.
 */
export default function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: '' });
  const run = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++run.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loaderRef.current();
      if (id === run.current) setState({ data, loading: false, error: '' });
    } catch (e) {
      if (id === run.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error: errMsg(e, 'Could not load this section.') }));
    }
  }, []);

  useEffect(() => { if (immediate) load(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: load, setData: (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })) };
}
