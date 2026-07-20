/* Storefront chrome — Header + Footer (ui_kits/storefront).
   Primary nav links come from Shopify Admin menus (BASELINE-BUILD §3.2);
   handles are configured in merchant.config.ts. Nested menu items render as
   dropdowns. Login/cart stay as functional chrome; search uses the existing
   predictive search components against the live store (BASELINE-BUILD §3.3). */
import {useEffect, useId, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router';
import {Icon} from './ds/Icon';
import {IconButton} from './ds/IconButton';
import {Button} from './ds/Button';
import {useCartUi} from './CartUi';
import {
  SearchFormPredictive,
  SEARCH_ENDPOINT,
} from './SearchFormPredictive';
import {SearchResultsPredictive} from './SearchResultsPredictive';
import {merchantConfig} from '~/merchant.config';
import {t} from '~/lib/copy';
import type {MenuNavItem} from '~/lib/menus';

export type NavItem = MenuNavItem;

function Logo() {
  const [first, ...rest] = merchantConfig.merchantName.split(' ');
  return (
    <Link to="/" className="sf-logo" style={{textDecoration: 'none', color: 'inherit'}}>
      <span className="sf-logo__mark">{first.charAt(0)}</span>
      <span className="sf-logo__name">
        {first}
        {rest.length > 0 && <span>·{rest.join(' ').toLowerCase()}</span>}
      </span>
    </Link>
  );
}

/** True when the current path matches this item or any nested child. */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.url) return true;
  return item.items.some((child) => isNavItemActive(pathname, child));
}

function HeaderNavLink({
  item,
  pathname,
  className,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={item.url}
      className={className}
      aria-current={pathname === item.url || undefined}
      style={{textDecoration: 'none'}}
      prefetch="intent"
      onClick={onNavigate}
    >
      {item.title}
    </Link>
  );
}

function HeaderNavItem({item, pathname}: {item: NavItem; pathname: string}) {
  const hasChildren = item.items.length > 0;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = isNavItemActive(pathname, item);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!hasChildren) {
    return (
      <HeaderNavLink
        item={item}
        pathname={pathname}
        className="sf-nav__item"
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className="sf-nav__drop"
      data-open={open || undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="sf-nav__drop-trigger">
        <HeaderNavLink
          item={item}
          pathname={pathname}
          className="sf-nav__item"
          onNavigate={() => setOpen(false)}
        />
        <button
          type="button"
          className="sf-nav__caret"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          aria-label={t(open ? 'nav.closeSubmenu' : 'nav.openSubmenu', {
            title: item.title,
          })}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name="chevron-down" size={14} />
        </button>
        {active ? <span className="sf-nav__item-active" aria-hidden="true" /> : null}
      </div>
      <ul
        id={menuId}
        className="sf-nav__menu"
        role="menu"
        aria-label={t('nav.submenu')}
        hidden={!open}
      >
        {item.items.map((child) => (
          <li key={child.id} role="none">
            <HeaderNavLink
              item={child}
              pathname={pathname}
              className="sf-nav__subitem"
              onNavigate={() => setOpen(false)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeaderPredictiveSearch() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="sf-search"
      data-open={open || undefined}
    >
      <SearchFormPredictive className="sf-search__form">
        {({fetchResults, inputRef}) => (
          <div className="dsInput sf-search__field">
            <span className="dsInput__affix" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              ref={inputRef}
              className="dsInput__el"
              name="q"
              type="search"
              placeholder={t('chrome.searchPlaceholder')}
              aria-label={t('search.title')}
              aria-autocomplete="list"
              aria-controls="sf-predictive-results"
              aria-expanded={open}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(event) => {
                setOpen(Boolean(event.target.value.trim()));
                fetchResults(event);
              }}
              onFocus={(event) => {
                if (event.target.value.trim()) setOpen(true);
                fetchResults(event);
              }}
            />
          </div>
        )}
      </SearchFormPredictive>

      {open ? (
        <div
          id="sf-predictive-results"
          className="sf-search__dropdown"
          role="listbox"
          aria-label={t('search.predictiveAria')}
        >
          <SearchResultsPredictive>
            {({items, total, term, state, closeSearch}) => {
              const {articles, collections, pages, products, queries} = items;
              const close = () => {
                closeSearch();
                setOpen(false);
              };

              if (state === 'loading' && term.current) {
                return (
                  <p className="sf-search__status">{t('search.predictiveLoading')}</p>
                );
              }

              if (!total) {
                return <SearchResultsPredictive.Empty term={term} />;
              }

              return (
                <>
                  <SearchResultsPredictive.Queries
                    queries={queries}
                    term={term}
                    closeSearch={close}
                  />
                  <SearchResultsPredictive.Products
                    products={products}
                    closeSearch={close}
                    term={term}
                  />
                  <SearchResultsPredictive.Collections
                    collections={collections}
                    closeSearch={close}
                    term={term}
                  />
                  <SearchResultsPredictive.Pages
                    pages={pages}
                    closeSearch={close}
                    term={term}
                  />
                  <SearchResultsPredictive.Articles
                    articles={articles}
                    closeSearch={close}
                    term={term}
                  />
                  {term.current && total ? (
                    <Link
                      className="sf-search__view-all"
                      onClick={() => setOpen(false)}
                      to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term.current)}`}
                    >
                      {t('search.viewAll', {term: term.current})}
                    </Link>
                  ) : null}
                </>
              );
            }}
          </SearchResultsPredictive>
        </div>
      ) : null}
    </div>
  );
}

export function StorefrontHeader({
  menu,
  loggedIn,
  cartCount = 0,
}: {
  menu: NavItem[];
  loggedIn: boolean;
  cartCount?: number;
}) {
  const {pathname} = useLocation();
  const {openCart} = useCartUi();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuPanelId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="sf-top">
        <div className="sf-top__in">
          <span className="sf-top__tagline">{t('chrome.topBar')}</span>
          <span className="sf-top__links">
            <Link to="/account/quickorder">{t('nav.quickOrder')}</Link>
            <span>{t('chrome.localeCurrency')}</span>
          </span>
        </div>
      </div>
      <header className="sf-head">
        <div className="sf-head__in">
          <button
            type="button"
            className="sf-head__menu-btn"
            aria-label={t('chrome.menu')}
            aria-expanded={menuOpen}
            aria-controls={menuPanelId}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
          </button>
          <Logo />
          <HeaderPredictiveSearch />
          <div className="sf-head__actions">
            {loggedIn ? (
              <Button
                as={Link}
                to="/account"
                variant="ghost"
                size="sm"
                className="sf-head__account"
                iconStart={<Icon name="user" size={16} />}
              >
                <span className="sf-head__account-label">{t('nav.myPages')}</span>
              </Button>
            ) : (
              <Button
                as={Link}
                to="/account/login"
                variant="ghost"
                size="sm"
                className="sf-head__account"
                iconStart={<Icon name="user" size={16} />}
              >
                <span className="sf-head__account-label">{t('nav.login')}</span>
              </Button>
            )}
            <IconButton
              label={t('nav.cart')}
              badge={cartCount || undefined}
              onClick={openCart}
            >
              <Icon name="shopping-cart" size={18} />
            </IconButton>
          </div>
        </div>
      </header>
      <nav className="sf-nav sf-nav--desktop" aria-label={t('nav.catalog')}>
        <div className="sf-nav__in">
          {menu.map((n) => (
            <HeaderNavItem key={n.id} item={n} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div
        className="sf-nav-drawer"
        data-open={menuOpen || undefined}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="sf-nav-drawer__backdrop"
          aria-label={t('chrome.closeMenu')}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <div
          id={menuPanelId}
          className="sf-nav-drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-label={t('chrome.menu')}
        >
          <header className="sf-nav-drawer__head">
            <h2>{t('chrome.menu')}</h2>
            <button
              type="button"
              className="sf-nav-drawer__close"
              aria-label={t('chrome.closeMenu')}
              onClick={closeMenu}
            >
              <Icon name="x" size={18} />
            </button>
          </header>
          <nav className="sf-nav-drawer__nav" aria-label={t('nav.catalog')}>
            {menu.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                pathname={pathname}
                onNavigate={closeMenu}
              />
            ))}
          </nav>
          <div className="sf-nav-drawer__foot">
            <Link
              to="/account/quickorder"
              className="sf-nav-drawer__link"
              onClick={closeMenu}
            >
              {t('nav.quickOrder')}
            </Link>
            <span className="sf-nav-drawer__meta">{t('chrome.localeCurrency')}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const hasChildren = item.items.length > 0;
  const [open, setOpen] = useState(() => isNavItemActive(pathname, item));
  const panelId = useId();

  if (!hasChildren) {
    return (
      <HeaderNavLink
        item={item}
        pathname={pathname}
        className="sf-nav-drawer__item"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="sf-nav-drawer__group" data-open={open || undefined}>
      <div className="sf-nav-drawer__row">
        <HeaderNavLink
          item={item}
          pathname={pathname}
          className="sf-nav-drawer__item"
          onNavigate={onNavigate}
        />
        <button
          type="button"
          className="sf-nav-drawer__caret"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t(open ? 'nav.closeSubmenu' : 'nav.openSubmenu', {
            title: item.title,
          })}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name="chevron-down" size={16} />
        </button>
      </div>
      <div id={panelId} className="sf-nav-drawer__sub" hidden={!open}>
        {item.items.map((child) => (
          <HeaderNavLink
            key={child.id}
            item={child}
            pathname={pathname}
            className="sf-nav-drawer__subitem"
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export function StorefrontFooter({menu}: {menu: NavItem[]}) {
  const hasNested = menu.some((item) => item.items.length > 0);

  return (
    <footer className="sf-foot">
      <div className="sf-foot__in">
        <div className="sf-foot__brand">
          <Logo />
          <p className="sf-foot__blurb">{t('chrome.footerBlurb')}</p>
        </div>
        {hasNested
          ? menu.map((column) => (
              <div key={column.id} className="sf-foot__col">
                <h5>
                  {column.items.length > 0 ? (
                    column.title
                  ) : (
                    <Link to={column.url}>{column.title}</Link>
                  )}
                </h5>
                {column.items.length > 0 ? (
                  <ul>
                    {column.items.map((item) => (
                      <li key={item.id}>
                        <Link to={item.url} prefetch="intent">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          : menu.length > 0 ? (
              <div className="sf-foot__col">
                <ul>
                  {menu.map((item) => (
                    <li key={item.id}>
                      <Link to={item.url} prefetch="intent">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
      </div>
      <div className="sf-foot__legal">
        <span>
          {t('chrome.footerCopyright', {
            year: 2026,
            merchant: merchantConfig.merchantName,
          })}
        </span>
        <span>{t('chrome.footerLegal')}</span>
      </div>
    </footer>
  );
}
