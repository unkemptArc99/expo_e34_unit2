import type { Row, Share } from './types';
export const normalizeTopic = (topic: string) => ({'Graph Theory': 'Graph', 'Graphs': 'Graph', 'Sort': 'Sorting', 'Arrays': 'Array', 'Strings': 'String', 'Union-Find': 'Union Find'}[topic.trim()] || topic.trim());
export function canonicalUrl(input: string) {
  const url = new URL(input);
  if (url.hostname !== 'leetcode.com' || url.protocol !== 'https:') throw new Error('Expected an HTTPS LeetCode practice link');
  const match = url.pathname.match(/^\/problems\/([a-z0-9-]+)\/?$/);
  if (!match) throw new Error('Invalid practice problem URL');
  return { id: match[1], url: `https://leetcode.com/problems/${match[1]}/` };
}
export function filterRows(rows: Row[], difficulty = 'All', topics: string[] = []) {
  return rows.filter(row => (difficulty === 'All' || row.difficulty === difficulty) && (!topics.length || topics.some(t => (row.topics.length ? row.topics : ['Unclassified']).includes(t))));
}
export function aggregate(rows: Row[]): Share[] {
  const map = new Map<string, {value: number; questions: number}>();
  for (const row of rows) {
    const tags = [...new Set(row.topics.length ? row.topics : ['Unclassified'])];
    for (const topic of tags) {
      const item = map.get(topic) || { value: 0, questions: 0 };
      item.value += 1 / tags.length; item.questions++; map.set(topic, item);
    }
  }
  return [...map].map(([topic, item]) => ({topic, ...item, percent: rows.length ? item.value / rows.length * 100 : 0})).sort((a,b) => b.value - a.value || a.topic.localeCompare(b.topic));
}
export function ranked(rows: Row[]) { return [...rows].sort((a,b) => (b.score ?? -1) - (a.score ?? -1) || a.title.localeCompare(b.title)); }
export function comparisonTopics(series: Share[][]) {
  const totals = new Map<string, number>();
  for (const shares of series) for (const share of shares) totals.set(share.topic, (totals.get(share.topic) || 0) + share.percent);
  return [...totals].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,6).map(([topic]) => topic);
}
export function pieShares(shares: Share[], topics: string[]) {
  const head = topics.map(topic => shares.find(s => s.topic === topic) || { topic, value: 0, percent: 0, questions: 0 });
  const tail = shares.filter(s => !topics.includes(s.topic));
  return [...head, ...(tail.length ? [{topic: 'Other', value: tail.reduce((n,s)=>n+s.value,0), percent: tail.reduce((n,s)=>n+s.percent,0), questions: 0}] : [])];
}

/** One practice question per URL; repeated snapshots of one repository count once. */
export function mergeQuestionSources(groups: {source: string; rows: Row[]}[]): Row[] {
  const questions = new Map<string, {row: Row; sources: Set<string>}>();
  for (const group of groups) for (const row of group.rows) {
    const existing = questions.get(row.id);
    if (existing) existing.sources.add(group.source);
    else questions.set(row.id, {row, sources: new Set([group.source])});
  }
  return [...questions.values()].map(({row, sources}) => ({...row, score: sources.size}));
}
