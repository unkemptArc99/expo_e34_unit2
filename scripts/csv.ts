import { canonicalUrl, normalizeTopic } from '../src/model';
import type { Question, Observation } from '../src/types';
export function jsonToCsv(input: string): string {
  const rows:unknown = JSON.parse(input);
  if(!Array.isArray(rows)) throw new Error('JSON import must be an array of question records');
  const quote=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
  return ['Title,Difficulty,URL,Topics,Frequency',...rows.map(row=>{
    if(!row || typeof row !== 'object' || typeof row.title !== 'string' || typeof row.url !== 'string' || typeof row.difficulty !== 'string') throw new Error('JSON question requires title, url, and difficulty strings');
    if(row.topics!==undefined && (!Array.isArray(row.topics)||!row.topics.every((t:unknown)=>typeof t==='string'))) throw new Error('JSON topics must be an array of strings');
    if(row.score!==undefined && row.score!==null && typeof row.score!=='number') throw new Error('JSON score must be a number or null');
    return [row.title,row.difficulty,row.url,(row.topics||[]).join(', '),row.score].map(quote).join(',');
  })].join('\n');
}
export function parseCsv(input: string, onHeaders?: (headers: string[])=>void): Record<string,string>[] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  input = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') { if (quoted && input[i+1] === '"') { field += '"'; i++; } else { quoted = !quoted; } }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if(c === '\r' && input[i+1] === '\n') i++; row.push(field); if(row.some(Boolean)) rows.push(row); row=[]; field=''; }
    else field += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  row.push(field); if(row.some(Boolean)) rows.push(row);
  const headers = rows.shift(); if (!headers) throw new Error('Empty CSV');
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV headers');
  onHeaders?.(headers.map(h=>h.trim()));
  return rows.map((values, index) => { if(values.length !== headers.length) throw new Error(`Invalid column count on row ${index+2}`); return Object.fromEntries(headers.map((h,i)=>[h.trim(),values[i].trim()])); });
}
export function normalizeCsv(input: string, source: string): { questions: Question[]; observations: Observation[] } {
  const rows = parseCsv(input, headers=>{
    if(!headers.includes('Title') || !headers.includes('Difficulty') || !(headers.includes('URL')||headers.includes('Link'))) throw new Error('Missing title, difficulty, or practice-link columns');
  }); const questions: Question[] = []; const observations: Observation[] = []; const seen = new Set<string>();
  for (const row of rows) {
    if (!row.Title || !(row.URL || row.Link)) throw new Error('Missing title/link columns');
    const canonical = canonicalUrl(row.URL || row.Link);
    if(seen.has(canonical.id)) continue; seen.add(canonical.id);
    const difficulty = row.Difficulty?.toLowerCase();
    if (!['easy','medium','hard'].includes(difficulty)) throw new Error(`Invalid difficulty: ${difficulty}`);
    const rawScore = row['Frequency %'] ?? row.Frequency;
    const score = rawScore?.trim() ? Number(rawScore.replace('%','')) : null;
    if(score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) throw new Error('Invalid frequency score');
    const topics = [...new Set((row.Topics || '').split(',').map(normalizeTopic).filter(Boolean))];
    questions.push({ ...canonical, title: row.Title, difficulty: difficulty[0].toUpperCase()+difficulty.slice(1), topics, topicSources: topics.length ? [source] : [] });
    observations.push({questionId: canonical.id, score});
  }
  return { questions, observations };
}
