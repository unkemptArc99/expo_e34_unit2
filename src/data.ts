import { aggregate, mergeQuestionSources } from './model';
import type { CompanyData, Manifest, Question, Row, Share, Snapshot, WindowKey } from './types';

export type Tagging = 'study' | 'source';
export interface Bundle { manifest: Manifest; catalog: Record<string, Question>; data: Record<string, CompanyData> }
export interface Fingerprint { company: string; rows: Row[] | null; shares: Share[]; count: number }
export interface BankRow extends Row { companyNames: string[] }
export const dataBase = (import.meta.env?.BASE_URL || '/') + 'data/';
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(dataBase + path.split('/').map(encodeURIComponent).join('/'), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
}
export async function loadBundle(manifest: Manifest): Promise<Bundle> {
  const catalog = await getJson<Record<string, Question>>(manifest.catalogFile);
  const data: Bundle['data'] = {};
  await Promise.all(manifest.snapshots.flatMap(s => Object.entries(s.files).map(async ([company, file]) => {
    data[`${s.id}/${company}`] = await getJson<CompanyData>(file!);
  })));
  return { manifest, catalog, data };
}
export function rowsFor(bundle: Bundle, company: string, window: WindowKey, tagging: Tagging, include: (s: Snapshot) => boolean = () => true): Row[] | null {
  const groups = bundle.manifest.snapshots.filter(include).flatMap(snapshot => {
    const data = bundle.data[`${snapshot.id}/${company}`];
    const observations = window === 'all' && data ? Object.values(data.windows).flat() : data?.windows[window];
    return observations ? [{ source: snapshot.repository, rows: observations.flatMap(o => bundle.catalog[o.questionId] ? [{ ...bundle.catalog[o.questionId], score: o.score }] : []) }] : [];
  });
  if (!groups.length) return null;
  return mergeQuestionSources(groups).map(row => ({ ...row, sourceTopics: row.topics, topics: tagging === 'source' ? row.topics : row.primaryTopic ? [row.primaryTopic] : [] }));
}
export function fingerprint(company: string, rows: Row[] | null): Fingerprint {
  return { company, rows, shares: aggregate(rows || []), count: rows?.length || 0 };
}
export const shareOf = (p: Fingerprint, topic: string) => p.shares.find(s => s.topic === topic)?.percent || 0;
export const questionsWith = (p: Fingerprint, topic: string) => p.shares.find(s => s.topic === topic)?.questions || 0;
/** Each available company has equal weight; large question banks do not set the baseline. */
export function averageShares(profiles: Fingerprint[]) {
  const valid = profiles.filter(p => p.count > 0);
  const averages = new Map<string, number>();
  for (const p of valid) for (const s of p.shares) averages.set(s.topic, (averages.get(s.topic) || 0) + s.percent / valid.length);
  return averages;
}
export function globalTopicOrder(profiles: Fingerprint[]) {
  return [...averageShares(profiles)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([topic]) => topic);
}
export function overIndex(profile: Fingerprint, topic: string, average: Map<string, number>) {
  const baseline = average.get(topic) || 0;
  return profile.count && baseline ? shareOf(profile, topic) / baseline : null;
}
/** Distribution overlap: 100% minus total-variation distance. Not question-bank overlap. */
export function topicSimilarity(a: Fingerprint, b: Fingerprint): number | null {
  if (!a.count || !b.count) return null;
  const topics = new Set([...a.shares, ...b.shares].map(s => s.topic));
  return [...topics].reduce((n, t) => n + Math.min(shareOf(a, t), shareOf(b, t)), 0);
}
export function questionOverlap(profiles: Fingerprint[]) {
  const union = new Set(profiles.flatMap(p => (p.rows || []).map(r => r.id)));
  const banks = profiles.map(p => new Set((p.rows || []).map(r => r.id)));
  const shared = banks.length ? [...banks[0]].filter(id => banks.every(bank => bank.has(id))) : [];
  return { union: union.size, shared: new Set(shared), percent: union.size ? shared.length / union.size * 100 : 0 };
}
export function bankRows(profiles: Fingerprint[], sharedOnly = false): BankRow[] {
  const merged = new Map<string, BankRow>();
  for (const p of profiles) for (const row of p.rows || []) {
    const old = merged.get(row.id);
    if (old) { old.companyNames.push(p.company); old.score = Math.max(old.score || 0, row.score || 0); }
    else merged.set(row.id, { ...row, companyNames: [p.company] });
  }
  return [...merged.values()].filter(row => !sharedOnly || row.companyNames.length === profiles.length);
}
export function collectionHistory(bundle: Bundle, company: string, window: WindowKey, tagging: Tagging) {
  const dates = [...new Set(bundle.manifest.snapshots.filter(s => s.snapshotDate && s.files[company]).map(s => s.snapshotDate!))].sort();
  return dates.map(date => ({ date, ...fingerprint(company, rowsFor(bundle, company, window, tagging, s => s.snapshotDate === date)) }));
}
export function topicGaps(profiles: Fingerprint[], order: string[]) {
  const valid = profiles.filter(p => p.rows !== null);
  return order.map(topic => {
    const values = valid.map(p => shareOf(p, topic));
    return { topic, gap: values.length >= 2 ? Math.max(...values) - Math.min(...values) : 0 };
  }).sort((a, b) => b.gap - a.gap || order.indexOf(a.topic) - order.indexOf(b.topic));
}
export function distinctiveTopic(profile: Fingerprint, average: Map<string, number>) {
  if (profile.count < 10) return null;
  return profile.shares.filter(s => s.topic !== 'Unclassified' && s.questions >= 5).sort((a, b) => (overIndex(profile, b.topic, average) || 0) - (overIndex(profile, a.topic, average) || 0))[0] || null;
}
export function dateLabel(date: string, year = false) {
  return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' });
}
