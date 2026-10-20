import type { CSSProperties } from 'react';
import { dateLabel, overIndex, questionsWith, shareOf, type Fingerprint } from './data';

export function topicColor(topic: string) {
  const colors: Record<string, string> = {
    'Dynamic Programming': '#6e77c5', 'Hash Table': '#32978e', 'Greedy': '#cc9751',
    'Binary Search': '#538bb9', 'Math': '#bc7889', 'Tree': '#70a18a', 'Database': '#9c8bba',
    'Sliding Window': '#4a9fa9', 'Backtracking': '#b47e5a', 'Two Pointers': '#829b56',
    'Prefix Sum': '#6c88a3', 'Heap (Priority Queue)': '#b88e52', 'Graph': '#8972ad',
    'Design': '#bf7d6c', 'Array': '#7a92a6', 'Unclassified': '#b0b7c0', 'Other': '#dde2e8',
  };
  if (colors[topic]) return colors[topic];
  let code = 0; for (const char of topic) code = (code * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${code % 360} 27% 53%)`;
}
export function TopicDot({ topic }: { topic: string }) {
  return <i className="topic-dot" style={{ background: topicColor(topic) }} aria-hidden="true" />;
}
export function FingerprintBar({ profile, topics, onSelect }: { profile: Fingerprint; topics: string[]; onSelect?: (topic: string) => void }) {
  if (!profile.count) return <div className="fingerprint-empty">{profile.rows === null ? 'Unavailable' : 'No questions in this window'}</div>;
  const tail = profile.shares.filter(s => !topics.includes(s.topic)).reduce((n, s) => n + s.percent, 0);
  const segments = [...topics.map(topic => ({ topic, percent: shareOf(profile, topic) })), ...(tail > .001 ? [{ topic: 'Other', percent: tail }] : [])];
  return <div className="fingerprint-bar" aria-label={`${profile.company} topic fingerprint`}>{segments.filter(s => s.percent > 0).map(s => <button key={s.topic} style={{ width: `${s.percent}%`, background: topicColor(s.topic) }} onClick={() => onSelect?.(s.topic)} title={`${s.topic}: ${s.percent.toFixed(1)}%`} aria-label={`${profile.company}, ${s.topic}: ${s.percent.toFixed(1)}%`} />)}</div>;
}
export function TopicBars({ profile, topics, average, selected, onSelect }: { profile: Fingerprint; topics: string[]; average: Map<string, number>; selected?: string; onSelect: (topic: string) => void }) {
  const max = Math.max(5, ...topics.map(topic => shareOf(profile, topic))) * 1.1;
  return <div className="topic-bars"><div className="topic-bars-header"><span>Topic</span><span>Share</span><span>vs avg.</span></div>{topics.map((topic, index) => {
    const share = shareOf(profile, topic), ratio = overIndex(profile, topic, average), count = questionsWith(profile, topic);
    return <button className={`topic-bar-row ${selected === topic ? 'selected' : ''}`} key={topic} onClick={() => onSelect(topic)} aria-label={`${topic}, ${share.toFixed(1)}% share, ${count} questions`}>
      <span className="topic-bar-name"><small>{String(index + 1).padStart(2, '0')}</small><TopicDot topic={topic} />{topic}<span className="row-arrow" aria-hidden="true">↗</span></span>
      <span className="topic-bar-visual"><span className="topic-bar-track"><i style={{ width: `${share / max * 100}%`, background: topicColor(topic) }} /></span><strong>{share.toFixed(1)}%</strong></span>
      <span className={`ratio ${ratio && ratio >= 1.25 ? 'above' : ''}`} title={`${count} questions; compared with the equal-company average`}>{ratio === null ? '—' : `${ratio.toFixed(1)}×`}</span>
    </button>;
  })}</div>;
}
export function TrendCard({ topic, points, max, onSelect }: { topic: string; points: { date: string; profile: Fingerprint }[]; max: number; onSelect: () => void }) {
  const width = 340, height = 105, left = 8, right = 8, top = 10, bottom = 10;
  const firstDate = new Date(points[0]?.date || 0).getTime(), lastDate = new Date(points.at(-1)?.date || 0).getTime();
  const plotted = points.map(point => ({ ...point, share: shareOf(point.profile, topic), x: left + (new Date(point.date).getTime() - firstDate) / (lastDate - firstDate || 1) * (width - left - right), y: top + (1 - shareOf(point.profile, topic) / max) * (height - top - bottom) }));
  const first = plotted[0], last = plotted.at(-1), delta = first?.profile.count && last?.profile.count ? last.share - first.share : null;
  return <button className="trend-card" onClick={onSelect} aria-label={`Explore ${topic} questions`}><div className="trend-card-title"><TopicDot topic={topic} /><h3>{topic}</h3><span>↗</span></div><div className="trend-card-value"><strong>{last?.profile.count ? `${last.share.toFixed(1)}%` : '—'}</strong><span className={delta !== null && delta > 0 ? 'change-up' : 'change-flat'}>{delta === null ? 'Unavailable' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pp`}</span></div><div className="trend-plot"><div className="trend-y-labels"><span>{max}%</span><span>0%</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${topic}: ${plotted.map(p => `${dateLabel(p.date, true)} ${p.profile.count ? `${p.share.toFixed(1)}% (n=${p.profile.count})` : 'unavailable'}`).join('; ')}`}>
    {[0, max / 2, max].map(value => <g key={value}><line x1={left} x2={width - right} y1={top + (1 - value / max) * (height - top - bottom)} y2={top + (1 - value / max) * (height - top - bottom)} stroke="#e9edf1" strokeDasharray="3 4" /></g>)}
    {plotted.map((p, i) => <g key={p.date}>{i > 0 && p.profile.count > 0 && plotted[i - 1].profile.count > 0 && <line x1={plotted[i - 1].x} y1={plotted[i - 1].y} x2={p.x} y2={p.y} stroke={topicColor(topic)} strokeWidth="2.5" />}{p.profile.count > 0 && <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={topicColor(topic)} strokeWidth="2" />}</g>)}
  </svg></div><div className="trend-date-labels"><span>{first?dateLabel(first.date):'—'}</span><span>{last?dateLabel(last.date):'—'}</span></div></button>;
}
export function MatrixCell({ profile, topic, average, metric, onSelect }: { profile: Fingerprint; topic: string; average: Map<string, number>; metric: 'share' | 'index'; onSelect: () => void }) {
  const share = shareOf(profile, topic), ratio = overIndex(profile, topic, average), count = questionsWith(profile, topic), thin = count > 0 && count < 10;
  const intensity = metric === 'index' ? Math.min(1, (ratio || 0) / 2.5) : Math.min(1, share / 30);
  const level=Math.min(4,Math.floor(intensity*5));
  const style = { '--intensity': intensity, backgroundColor: ['#f1f6f3','#e1ede6','#c9dfd2','#9cbfac','#397660'][level], color: level===4?'#fff':'#284e3e' } as CSSProperties;
  return <button className={`matrix-cell ${thin ? 'thin' : ''}`} style={profile.count ? style : undefined} onClick={onSelect} disabled={profile.rows === null} title={`${profile.company} · ${topic}: ${share.toFixed(1)}% share, ${ratio === null ? 'no baseline' : `${ratio.toFixed(2)}× average`}, ${count} tagged questions / ${profile.count} total${thin ? ' · Low data: fewer than 10 tagged questions' : ''}`} aria-label={`${profile.company}, ${topic}: ${profile.rows === null ? 'unavailable' : `${share.toFixed(1)}% share, ${ratio?.toFixed(2) || '0'} times average, ${count} questions${thin ? ', low data' : ''}`}`}>
    <strong>{!profile.count ? '—' : metric === 'index' ? `${(ratio || 0).toFixed(1)}×` : `${share.toFixed(1)}%`}</strong>{thin && <span aria-hidden="true">·</span>}
  </button>;
}
