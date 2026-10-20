import type { ReactNode } from 'react';
import { windowLabels, type WindowKey } from './types';

const iconPaths: Record<string, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  topics: <><path d="M4 5h12M4 12h16M4 19h8"/><path d="M4 3v18"/></>,
  time: <><path d="M3 3v18h18M6 15l4-5 4 3 6-8"/></>,
  compare: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  share: <><path d="M12 16V3m-4 4 4-4 4 4M5 11v9h14v-9"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 5H4v15h15v-6"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  book: <><path d="M12 5c-4-3-8-1-9 0v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-3-2-6-2-9 0Zm0 0v15"/></>,
};
export function Icon({ name, size = 18 }: { name: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name] || iconPaths.arrow}</svg>; }
export function CompanyMark({ company, small = false }: { company: string; small?: boolean }) {
  const symbols: Record<string,string> = { Meta: '∞', Google: 'G', Apple: 'a', Netflix: 'N', Palantir: 'P' };
  return <span aria-hidden="true" className={`company-mark ${company.toLowerCase()} ${small ? 'small' : ''}`}>{symbols[company] || company[0]}</span>;
}
export function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) { return <label className="select-field"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>{children}</select></label>; }
export const windowOrder: WindowKey[] = ['30d', '3m', '6m', 'older6m', 'all'];
export const shortWindow: Record<WindowKey,string> = { '30d': '30 days', '3m': '3 months', '6m': '6 months', older6m: '6+ months', all: 'All time' };
export function WindowSlider({ value, onChange }: { value: WindowKey; onChange: (value: WindowKey) => void }) {
  return <div className="window-control"><div className="window-control-label"><span>Recency</span><strong>{windowLabels[value]}</strong></div><div className="window-slider"><input aria-label="Recency" type="range" min="0" max="4" step="1" value={windowOrder.indexOf(value)} aria-valuetext={windowLabels[value]} onChange={e=>onChange(windowOrder[Number(e.target.value)])}/><div className="window-stops">{windowOrder.map(w=><button key={w} aria-pressed={value===w} onClick={()=>onChange(w)}>{shortWindow[w]}</button>)}</div></div></div>;
}
export function Sample({ count, unavailable = false }: { count: number; unavailable?: boolean }) { return <span className={`sample ${count < 10 ? 'low' : ''}`}>{unavailable ? 'Unavailable' : `${count.toLocaleString()} questions`}{!unavailable && count > 0 && count < 10 ? ' · Low data' : ''}</span>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty-state"><Icon name="search" size={26}/><h3>{title}</h3>{children}</div>; }
export function Segment({ options, value, onChange, label }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) { return <div className="segmented" role="group" aria-label={label}>{options.map(o=><button key={o.value} aria-pressed={o.value===value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>; }
