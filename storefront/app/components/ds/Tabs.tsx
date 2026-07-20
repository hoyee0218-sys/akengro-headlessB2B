/* DS Tabs — ported. CSS in app/styles/components.css. */
type Tab = string | {value: string; label: string; count?: number};

export function Tabs({
  tabs = [],
  value,
  onChange,
  className = '',
}: {
  tabs?: Tab[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={['dsTabs', className].filter(Boolean).join(' ')} role="tablist">
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? {value: t, label: t, count: undefined} : t;
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={selected}
            className="dsTabs__tab"
            onClick={() => onChange && onChange(tab.value)}
          >
            {tab.label}
            {tab.count != null && <span className="dsTabs__count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
