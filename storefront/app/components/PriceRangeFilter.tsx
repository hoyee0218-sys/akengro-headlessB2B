import {useEffect, useId, useRef, useState, type CSSProperties} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {
  buildCollectionSearchString,
  getAppliedPriceRange,
  getAppliedProductFilters,
  getPriceRangeBounds,
  setPriceRangeInParams,
  type CollectionFilter,
} from '~/lib/collection-filters';
import {merchantConfig} from '~/merchant.config';
import {currencySymbol} from '~/lib/format';
import {t} from '~/lib/copy';

function roundPrice(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Shopify-theme style price facet: dual-handle slider + "kr" min/max inputs
 * separated by "til". Applies to URL search params on commit (slider release /
 * input blur / Enter).
 */
export function PriceRangeFilter({filter}: {filter: CollectionFilter}) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const applied = getAppliedProductFilters(searchParams);
  const bounds = getPriceRangeBounds(filter);
  const appliedRange = getAppliedPriceRange(applied);

  const apiFloor = roundPrice(bounds.min ?? 0);
  const apiCeiling = roundPrice(
    bounds.max != null && bounds.max > apiFloor ? bounds.max : apiFloor + 1,
  );

  // Keep the widest track seen so applying a price filter doesn't shrink the
  // slider back to the filtered subset (Shopify theme keeps full catalog span).
  const widestRef = useRef({min: apiFloor, max: apiCeiling});
  widestRef.current = {
    min: Math.min(
      widestRef.current.min,
      apiFloor,
      appliedRange?.min != null ? roundPrice(appliedRange.min) : apiFloor,
    ),
    max: Math.max(
      widestRef.current.max,
      apiCeiling,
      appliedRange?.max != null ? roundPrice(appliedRange.max) : apiCeiling,
    ),
  };

  const floor = widestRef.current.min;
  const ceiling = Math.max(widestRef.current.max, floor + 1);

  const selectedMin =
    appliedRange?.min != null ? roundPrice(appliedRange.min) : floor;
  const selectedMax =
    appliedRange?.max != null ? roundPrice(appliedRange.max) : ceiling;

  const initialMin = clamp(selectedMin, floor, ceiling);
  const initialMax = clamp(
    Math.max(selectedMin, selectedMax),
    floor,
    ceiling,
  );

  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  const [minText, setMinText] = useState(String(initialMin));
  const [maxText, setMaxText] = useState(String(initialMax));

  // Refs avoid stale min/max on mouseUp/touchEnd (onChange state isn't flushed yet).
  const minRef = useRef(min);
  const maxRef = useRef(max);
  minRef.current = min;
  maxRef.current = max;

  const rangeKey = `${location.search}|${floor}|${ceiling}`;
  const minId = useId();
  const maxId = useId();

  useEffect(() => {
    setMin(initialMin);
    setMax(initialMax);
    setMinText(String(initialMin));
    setMaxText(String(initialMax));
    minRef.current = initialMin;
    maxRef.current = initialMax;
    // Sync when URL/applied bounds change (filter chips, navigation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  function commit(nextMin: number, nextMax: number) {
    const lo = clamp(roundPrice(nextMin), floor, ceiling);
    const hi = clamp(roundPrice(nextMax), floor, ceiling);
    const orderedMin = Math.min(lo, hi);
    const orderedMax = Math.max(lo, hi);

    setMin(orderedMin);
    setMax(orderedMax);
    setMinText(String(orderedMin));
    setMaxText(String(orderedMax));
    minRef.current = orderedMin;
    maxRef.current = orderedMax;

    const isFullRange = orderedMin === floor && orderedMax === ceiling;
    const appliedMin =
      appliedRange?.min != null ? roundPrice(appliedRange.min) : null;
    const appliedMax =
      appliedRange?.max != null ? roundPrice(appliedRange.max) : null;

    const unchanged = isFullRange
      ? appliedRange == null
      : appliedMin === orderedMin && appliedMax === orderedMax;

    if (unchanged) return;

    const nextParams = isFullRange
      ? setPriceRangeInParams(searchParams, null, null)
      : setPriceRangeInParams(searchParams, orderedMin, orderedMax);

    navigate(`${location.pathname}${buildCollectionSearchString(nextParams)}`, {
      preventScrollReset: true,
    });
  }

  function commitFromRefs() {
    commit(minRef.current, maxRef.current);
  }

  function onMinSlider(value: number) {
    const next = Math.min(value, maxRef.current);
    minRef.current = next;
    setMin(next);
    setMinText(String(next));
  }

  function onMaxSlider(value: number) {
    const next = Math.max(value, minRef.current);
    maxRef.current = next;
    setMax(next);
    setMaxText(String(next));
  }

  const span = ceiling - floor || 1;
  const progressLeft = ((min - floor) / span) * 100;
  const progressRight = ((ceiling - max) / span) * 100;
  const currency = currencySymbol(merchantConfig.currency);

  return (
    <div
      className="sf-price"
      style={
        {
          '--sf-price-left': `${progressLeft}%`,
          '--sf-price-right': `${progressRight}%`,
        } as CSSProperties
      }
    >
      <div className="sf-price__slider">
        <div className="sf-price__track" />
        <div className="sf-price__progress" />
        <input
          className="sf-price__thumb sf-price__thumb--min"
          type="range"
          min={floor}
          max={ceiling}
          step={1}
          value={min}
          aria-label={t('plp.priceMinAria', {label: filter.label})}
          onChange={(event) => onMinSlider(Number(event.target.value))}
          onPointerUp={commitFromRefs}
          onKeyUp={(event) => {
            if (
              event.key === 'ArrowLeft' ||
              event.key === 'ArrowRight' ||
              event.key === 'Home' ||
              event.key === 'End'
            ) {
              commitFromRefs();
            }
          }}
        />
        <input
          className="sf-price__thumb sf-price__thumb--max"
          type="range"
          min={floor}
          max={ceiling}
          step={1}
          value={max}
          aria-label={t('plp.priceMaxAria', {label: filter.label})}
          onChange={(event) => onMaxSlider(Number(event.target.value))}
          onPointerUp={commitFromRefs}
          onKeyUp={(event) => {
            if (
              event.key === 'ArrowLeft' ||
              event.key === 'ArrowRight' ||
              event.key === 'Home' ||
              event.key === 'End'
            ) {
              commitFromRefs();
            }
          }}
        />
      </div>

      <div className="sf-price__fields">
        <label className="sf-price__field" htmlFor={minId}>
          <span className="sf-price__currency">{currency}</span>
          <input
            id={minId}
            className="sf-price__input"
            type="number"
            inputMode="decimal"
            min={floor}
            max={ceiling}
            step={1}
            value={minText}
            aria-label={t('plp.priceMinAria', {label: filter.label})}
            onChange={(event) => setMinText(event.target.value)}
            onBlur={() => {
              const parsed = Number(minText);
              commit(Number.isFinite(parsed) ? parsed : minRef.current, maxRef.current);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </label>

        <span className="sf-price__til">{t('plp.priceTo')}</span>

        <label className="sf-price__field" htmlFor={maxId}>
          <span className="sf-price__currency">{currency}</span>
          <input
            id={maxId}
            className="sf-price__input"
            type="number"
            inputMode="decimal"
            min={floor}
            max={ceiling}
            step={1}
            value={maxText}
            aria-label={t('plp.priceMaxAria', {label: filter.label})}
            onChange={(event) => setMaxText(event.target.value)}
            onBlur={() => {
              const parsed = Number(maxText);
              commit(minRef.current, Number.isFinite(parsed) ? parsed : maxRef.current);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
