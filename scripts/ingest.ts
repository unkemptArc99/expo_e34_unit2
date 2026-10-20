import { readFile, writeFile, mkdir, readdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalizeCsv, jsonToCsv } from './csv';
import { companies, type Manifest, type Question, type Snapshot, type WindowKey, type CompanyData } from '../src/types';

import { curateTopic, type ReviewFile } from './curation';
import { makeTaggingReport } from './tagging-report';

interface Source { id: string; label: string; repository: string; ref: string; adapter: string; snapshotDate: string|null; dateNote: string; reuse: Snapshot['reuse'] }
interface RawMeta { source: Source; revision: string; retrievedAt: string; contentHash: string; entries: {company: string; window: WindowKey; file: string}[] }
const companyKey = (name:string) => name.toLowerCase().replace(/[^a-z0-9]/g,'');
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const args = process.argv.slice(2), rawRoot = resolve('data/raw'), output = resolve('public/data');
const windows: Record<string,WindowKey> = { 'thirty-days.csv':'30d','three-months.csv':'3m','six-months.csv':'6m','more-than-six-months.csv':'older6m','all.csv':'all','1. Thirty Days.csv':'30d','2. Three Months.csv':'3m','3. Six Months.csv':'6m','4. More Than Six Months.csv':'older6m','5. All.csv':'all' };
function download(url: string): string { return execFileSync('curl',['--fail','--silent','--show-error','--location','--retry','3','--max-time','60',url],{encoding:'utf8',maxBuffer:30*1024*1024}); }
async function exists(file: string) { try { await readFile(file); return true; } catch { return false; } }

async function fetchSource(source: Source) {
  if(/^[a-f0-9]{40}$/.test(source.ref) && await exists(join(rawRoot,`${source.id}-${source.ref.slice(0,12)}`,'meta.json'))) return;
  const tree = JSON.parse(download(`https://api.github.com/repos/${source.repository}/git/trees/${source.ref}?recursive=1`));
  if (!tree.sha || tree.truncated) throw new Error('Invalid/incomplete GitHub tree');
  const revision = tree.sha as string;
  const directory = join(rawRoot,`${source.id}-${revision.slice(0,12)}`);
  if(await exists(join(directory,'meta.json'))) return;
  const paths = (tree.tree as {path:string}[]).filter(entry => entry.path.endsWith('.csv') && entry.path.split('/').length === 2 && companies.some(c=>companyKey(c)===companyKey(entry.path.split('/')[0])) && windows[entry.path.split('/').at(-1)!]);
  if(!paths.length) throw new Error(`No company data in ${source.id}`);
  const contents: {company:string;window:WindowKey;file:string;csv:string}[] = [];
  const temporary = await mkdtemp(join(tmpdir(),'atlas-source-'));
  const archive = join(temporary,'source.tar.gz');
  execFileSync('curl',['--fail','--silent','--show-error','--location',`https://codeload.github.com/${source.repository}/tar.gz/${revision}`,'-o',archive]);
  execFileSync('tar',['-xzf',archive,'-C',temporary]);
  const archiveRoot=(await readdir(temporary)).find(name=>name!=='source.tar.gz')!;
  for (const entry of paths) {
    const company = entry.path.split('/')[0];
    const window = windows[entry.path.split('/').at(-1)!];
    const csv = await readFile(join(temporary,archiveRoot,entry.path),'utf8');
    normalizeCsv(csv,source.id); // Validate all inputs before persisting the snapshot.
    contents.push({company,window,file:`${company}-${window}.csv`,csv});
  }
  await rm(temporary,{recursive:true,force:true});
  const contentHash = hash(contents.map(c=>`${c.company}/${c.window}:${c.csv}`).sort().join('\n'));
  for(const dir of await readdir(rawRoot)) {
    if(!await exists(join(rawRoot,dir,'meta.json'))) continue;
    const prior: RawMeta = JSON.parse(await readFile(join(rawRoot,dir,'meta.json'),'utf8'));
    if(prior.source.repository === source.repository && prior.contentHash === contentHash) { console.log(`${source.id}: unchanged content; no new snapshot`); return; }
  }
  await mkdir(directory,{recursive:true});
  for(const content of contents) await writeFile(join(directory,content.file),content.csv);
  const meta: RawMeta = { source, revision, retrievedAt:new Date().toISOString(), contentHash, entries:contents.map(({csv:_,...entry})=>entry) };
  await writeFile(join(directory,'meta.json'),JSON.stringify(meta,null,2)+'\n');
  console.log(`${source.id}: imported ${contents.length} files`);
}

async function importLocal() {
  const value = (key:string) => args[args.indexOf(key)+1];
  for(const key of ['--import','--source','--company','--window']) if(!args.includes(key) || !value(key)) throw new Error(`Required: ${key}`);
  const company = value('--company'); if(!company.trim() || /[\\/]/.test(company) || company==='.' || company==='..') throw new Error('Invalid company');
  if(!companies.some(c=>companyKey(c)===companyKey(company))) throw new Error('Choose one of the five focused companies');
  const window = value('--window') as WindowKey; if(!Object.values(windows).includes(window)) throw new Error('Unsupported window');
  const file = resolve(value('--import')); const original = await readFile(file,'utf8'); const csv = file.endsWith('.json') ? jsonToCsv(original) : original; const sourceId = value('--source');
  normalizeCsv(csv,sourceId);
  const date = args.includes('--date') ? value('--date') : null;
  if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0,10)!==date)) throw new Error('Invalid ISO snapshot date');
  const contentHash = hash(`${company}/${window}:${csv}`), directory=join(rawRoot,`local-${contentHash.slice(0,16)}`);
  if(await exists(join(directory,'meta.json'))) return;
  const source:Source = {id:sourceId,label:sourceId,repository:'Local import',ref:contentHash,adapter:'local',snapshotDate:date,dateNote:'Date supplied by importer; confirm source evidence.',reuse:{status:'unverified',evidence:'Local import: publication rights not verified.'}};
  await mkdir(directory,{recursive:true}); await writeFile(join(directory,'input.csv'),csv);
  if(file.endsWith('.json')) await writeFile(join(directory,'original.json'),original);
  await writeFile(join(directory,'meta.json'),JSON.stringify({source,revision:contentHash,retrievedAt:new Date().toISOString(),contentHash,entries:[{company,window,file:'input.csv'}]},null,2));
}

export async function buildData() {
  const imports: {meta:RawMeta; groups:Map<string,CompanyData>; questions:Question[]}[] = [];
  const companyNames = new Map<string,string>(companies.map(company=>[companyKey(company),company]));
  const seenHashes = new Set<string>(); const catalog = new Map<string,Question>();
  const permissions = JSON.parse(await readFile('data/permissions.json','utf8')) as Record<string,{status:'approved';evidence:string}>;
  for(const directory of (await readdir(rawRoot)).sort()) {
    if(!await exists(join(rawRoot,directory,'meta.json'))) continue;
    const meta:RawMeta = JSON.parse(await readFile(join(rawRoot,directory,'meta.json'),'utf8'));
    if(seenHashes.has(meta.contentHash)) continue; seenHashes.add(meta.contentHash);
    const groups = new Map<string,CompanyData>(), questions:Question[]=[];
    for(const entry of meta.entries) {
      const company=companyNames.get(companyKey(entry.company));
      const parsed=normalizeCsv(await readFile(join(rawRoot,directory,entry.file),'utf8'),meta.source.repository);
      questions.push(...parsed.questions);
      if(!company)continue;
      const group = groups.get(company) || {company,windows:{}};
      const observations=new Map((group.windows[entry.window]||[]).map(o=>[o.questionId,o]));
      for(const o of parsed.observations) {const old=observations.get(o.questionId);if(!old||(o.score??-1)>(old.score??-1))observations.set(o.questionId,o);}
      group.windows[entry.window]=[...observations.values()]; groups.set(company,group);
    }
    if(groups.size)imports.push({meta,groups,questions});
  }
  // A frozen catalog per published manifest gives every comparison the same taxonomy.
  for(const imported of imports.sort((a,b)=>(a.meta.source.snapshotDate||'').localeCompare(b.meta.source.snapshotDate||''))) for(const q of imported.questions) {
    const old = catalog.get(q.id);
    catalog.set(q.id,{...q,topics:q.topics.length?q.topics:(old?.topics||[]),topicSources:q.topics.length?q.topicSources:(old?.topicSources||[])});
  }
  if(!imports.length) throw new Error('No imports. Run npm run ingest -- --fetch first.');
  const focusedIds=new Set(imports.flatMap(i=>[...i.groups.values()].flatMap(g=>Object.values(g.windows).flatMap(rows=>rows.map(o=>o.questionId)))));
  for(const id of catalog.keys())if(!focusedIds.has(id))catalog.delete(id);
  const reviewFile:ReviewFile=JSON.parse(await readFile('data/topic-reviews.json','utf8'));
  const vocabulary=new Set([...catalog.values()].flatMap(q=>q.topics));
  for(const [id,question] of catalog)catalog.set(id,{...question,...curateTopic(question,reviewFile.reviews,vocabulary,reviewFile.version)});
  const audit=makeTaggingReport(catalog,imports.map(i=>i.groups),reviewFile.version,reviewFile.reviewedAt);
  const auditHash=hash(JSON.stringify(audit.report)).slice(0,16);
  const reportFile=`tagging-report-${auditHash}.html`;
  const catalogJson=JSON.stringify(Object.fromEntries([...catalog].sort(([a],[b])=>a.localeCompare(b))));
  const catalogVersion=hash(catalogJson).slice(0,16), catalogFile=`catalog-${catalogVersion}.json`;
  const staged:Record<string,string>={[catalogFile]:catalogJson,[reportFile]:audit.html,[`tagging-report-${auditHash}.json`]:JSON.stringify(audit.report,null,2)}; const snapshots:Snapshot[]=[];
  for(const {meta,groups} of imports) {
    const id=`${meta.source.id}-${meta.contentHash.slice(0,12)}`; const files:Snapshot['files']={};
    for(const [company,group] of groups) { const content=JSON.stringify(group); const file=`${id}-${company}-${hash(content).slice(0,12)}.json`; files[company]=file; staged[file]=content; }
    snapshots.push({id,source:meta.source.label,repository:meta.source.repository,revision:meta.revision,snapshotDate:meta.source.snapshotDate,dateNote:meta.source.dateNote,retrievedAt:meta.retrievedAt,contentHash:meta.contentHash,files,reuse:permissions[meta.source.repository]||meta.source.reuse});
  }
  snapshots.sort((a,b)=>(b.snapshotDate||'').localeCompare(a.snapshotDate||'')||a.id.localeCompare(b.id));
  const manifest:Manifest={version:hash(JSON.stringify({catalogVersion,snapshots})).slice(0,16),catalogFile,catalogVersion,snapshots,taggingReport:reportFile,companies:companies.filter(company=>snapshots.some(s=>s.files[company]))};
  await mkdir(output,{recursive:true});
  for(const [file,content] of Object.entries(staged)) await writeFile(join(output,file),content+'\n');
  await mkdir('reports',{recursive:true});
  await writeFile('reports/tagging-summary.md',audit.markdown);
  await writeFile('reports/tagging-audit.json',JSON.stringify(audit.report,null,2)+'\n');
  // Manifest is written last. Failures leave the previously published data usable.
  await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Built ${snapshots.length} snapshots, ${catalog.size} unique questions (catalog ${catalogVersion})`);
}

await mkdir(rawRoot,{recursive:true});
if(args.includes('--import')) await importLocal();
if(args.includes('--fetch') || args.includes('--refresh')) {
  const sources:Source[]=JSON.parse(await readFile('data/sources.json','utf8'));
  for(const source of sources) await fetchSource(source);
  if(args.includes('--refresh')) {
    // New upstream content has no verified snapshot date until its source evidence is reviewed.
    for(const source of sources.filter(s=>s.id!=='roy-feb')) await fetchSource({...source,id:source.id+'-updates',ref:source.adapter==='topics'?'main':'master',snapshotDate:null,dateNote:'New upstream content; snapshot date not yet verified. Excluded from historical comparisons.'});
  }
}
await buildData();
