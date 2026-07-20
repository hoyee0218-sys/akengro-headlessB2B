/* Lucide icon wrapper (BUILD.md ICONOGRAPHY). The UI kits used the Lucide UMD
   build + `lucide.createIcons()`; for SSR-first Oxygen we import named icons
   from lucide-react so only the icons we use ship in the bundle. The `name`
   prop keeps the kebab-case API the kits used. */
import {
  Search, User, ShoppingCart, ArrowRight, ArrowLeft, ChevronRight, ChevronDown, Image,
  Check, Briefcase, MapPin, CreditCard, FileText, Plus, Minus, X, Menu,
  Gauge, CircleDot, Grip, Spline, Disc, Package,
  LayoutDashboard, Zap, ListChecks, Tag, Wallet, Users, Bell, Store, LogOut,
  Download, RotateCw, FileDown, TriangleAlert, CalendarClock, UserPlus, Clock,
  PackageCheck, Truck, BellOff, CircleCheck, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type {CSSProperties} from 'react';

const MAP: Record<string, LucideIcon> = {
  search: Search, user: User, 'shopping-cart': ShoppingCart,
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, 'chevron-right': ChevronRight,
  'chevron-down': ChevronDown, menu: Menu,
  image: Image, check: Check, briefcase: Briefcase, 'map-pin': MapPin,
  'credit-card': CreditCard, 'file-text': FileText, plus: Plus, minus: Minus, x: X,
  gauge: Gauge, 'circle-dot': CircleDot, grip: Grip, spline: Spline, disc: Disc,
  package: Package, 'layout-dashboard': LayoutDashboard, zap: Zap,
  'list-checks': ListChecks, tag: Tag, wallet: Wallet, users: Users, bell: Bell,
  store: Store, 'log-out': LogOut, download: Download, 'rotate-cw': RotateCw,
  'file-down': FileDown, 'triangle-alert': TriangleAlert, 'calendar-clock': CalendarClock,
  'user-plus': UserPlus, clock: Clock, 'package-check': PackageCheck, truck: Truck,
  'bell-off': BellOff, 'circle-check': CircleCheck,
  'sliders-horizontal': SlidersHorizontal,
};

export function Icon({
  name,
  size = 18,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  const Cmp = MAP[name] ?? Package;
  return (
    <span style={{display: 'inline-flex', ...style}} aria-hidden="true">
      <Cmp width={size} height={size} strokeWidth={1.75} />
    </span>
  );
}
