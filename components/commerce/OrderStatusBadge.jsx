import React from 'react';
import { Badge } from '../data/Badge.jsx';

/* Maps B2B order states → Badge tone + Norwegian label (i18n-ready, §6). */
const STATE_MAP = {
  draft:      { tone: 'neutral', label: 'Utkast' },
  quote:      { tone: 'info',    label: 'Tilbud' },
  pending:    { tone: 'warning', label: 'Avventer' },
  confirmed:  { tone: 'info',    label: 'Bekreftet' },
  processing: { tone: 'info',    label: 'Behandles' },
  shipped:    { tone: 'info',    label: 'På vei' },
  delivered:  { tone: 'success', label: 'Levert' },
  invoiced:   { tone: 'neutral', label: 'Fakturert' },
  paid:       { tone: 'success', label: 'Betalt' },
  overdue:    { tone: 'danger',  label: 'Forfalt' },
  cancelled:  { tone: 'danger',  label: 'Kansellert' },
  returned:   { tone: 'warning', label: 'Returnert' },
};

export function OrderStatusBadge({ status, label, dot = true, ...rest }) {
  const m = STATE_MAP[status] || { tone: 'neutral', label: status };
  return <Badge tone={m.tone} dot={dot} {...rest}>{label || m.label}</Badge>;
}
