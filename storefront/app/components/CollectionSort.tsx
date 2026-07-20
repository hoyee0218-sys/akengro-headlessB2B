import type {ChangeEvent} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {Select} from '~/components/ds/Select';
import {
  buildCollectionSearchString,
  COLLECTION_SORT_OPTIONS,
  getSortFromSearchParams,
  setSortInParams,
} from '~/lib/collection-filters';
import {t} from '~/lib/copy';

export function CollectionSort() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const {value} = getSortFromSearchParams(searchParams);

  return (
    <Select
      value={value}
      options={COLLECTION_SORT_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`sort.${option.value}`),
      }))}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
        const nextParams = setSortInParams(searchParams, event.target.value);
        navigate(
          `${location.pathname}${buildCollectionSearchString(nextParams)}`,
          {preventScrollReset: true},
        );
      }}
    />
  );
}
