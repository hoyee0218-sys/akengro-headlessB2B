import {
  useFetcher,
  useNavigate,
  type FormProps,
  type Fetcher,
} from 'react-router';
import React, {useEffect, useRef} from 'react';
import type {PredictiveSearchReturn} from '~/lib/search';
import {useOptionalAside} from './Aside';

type SearchFormPredictiveChildren = (args: {
  fetchResults: (event: React.ChangeEvent<HTMLInputElement>) => void;
  goToSearch: () => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  fetcher: Fetcher<PredictiveSearchReturn>;
}) => React.ReactNode;

type SearchFormPredictiveProps = Omit<FormProps, 'children'> & {
  children: SearchFormPredictiveChildren | null;
};

export const SEARCH_ENDPOINT = '/search';

/** Idle wait before hitting the Storefront predictive API (keystroke coalescing). */
const PREDICTIVE_DEBOUNCE_MS = 280;

/**
 *  Search form component that sends search requests to the `/search` route
 **/
export function SearchFormPredictive({
  children,
  className = 'predictive-search-form',
  ...props
}: SearchFormPredictiveProps) {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const aside = useOptionalAside();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSubmittedTerm = useRef<string | null>(null);

  /** Navigate to the search page with the current input value */
  function goToSearch() {
    const term = inputRef?.current?.value?.trim();
    void navigate(SEARCH_ENDPOINT + (term ? `?q=${encodeURIComponent(term)}` : ''));
    aside.close();
  }

  function submitPredictive(term: string) {
    if (term === lastSubmittedTerm.current && fetcher.state !== 'idle') return;
    if (term === lastSubmittedTerm.current && fetcher.data?.term === term) return;
    lastSubmittedTerm.current = term;
    void fetcher.submit(
      {q: term, limit: 4, predictive: true},
      {method: 'GET', action: SEARCH_ENDPOINT},
    );
  }

  /** Fetch search results based on the input value (debounced). */
  function fetchResults(event: React.ChangeEvent<HTMLInputElement>) {
    const term = event.target.value.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Empty input: clear suggestions immediately (no Shopify round-trip).
    if (!term) {
      lastSubmittedTerm.current = '';
      if (fetcher.data && fetcher.data.term !== '') {
        void fetcher.submit(
          {q: '', limit: 4, predictive: true},
          {method: 'GET', action: SEARCH_ENDPOINT},
        );
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      submitPredictive(term);
    }, PREDICTIVE_DEBOUNCE_MS);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    goToSearch();
  }

  useEffect(() => {
    inputRef?.current?.setAttribute('type', 'search');
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  if (typeof children !== 'function') {
    return null;
  }

  return (
    <fetcher.Form {...props} className={className} onSubmit={handleSubmit}>
      {children({inputRef, fetcher, fetchResults, goToSearch})}
    </fetcher.Form>
  );
}
