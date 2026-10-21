import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Overview, CompanyView, CompareView, TimeView } from '../src/views';
import { CompanyNavigation } from '../src/ui';
import { QuestionBank } from '../src/QuestionBank';
import { averageShares, fingerprint, globalTopicOrder, rowsFor, type Bundle } from '../src/data';
import type { CompanyData, Manifest, Question } from '../src/types';
const manifest:Manifest=JSON.parse(readFileSync('public/data/manifest.json','utf8'));
const catalog:Record<string,Question>=JSON.parse(readFileSync('public/data/'+manifest.catalogFile,'utf8'));
const data:Record<string,CompanyData>={};for(const s of manifest.snapshots)for(const [company,file] of Object.entries(s.files))data[`${s.id}/${company}`]=JSON.parse(readFileSync('public/data/'+file,'utf8'));
const bundle:Bundle={manifest,catalog,data},profiles=manifest.companies.map(company=>fingerprint(company,rowsFor(bundle,company,'all','study'))),average=averageShares(profiles),order=globalTopicOrder(profiles),noop=()=>{};

test('real-data screens render complete insights and sample sizes, including one-company and thin states',()=>{
 const common={profiles,average,order,onCompany:noop,onCompare:noop};
 const overview=renderToStaticMarkup(<Overview {...common} tray={[]} onToggleTray={noop}/>);assert.equal((overview.match(/class="matrix-cell/g)||[]).length,40);assert.ok(overview.includes('2,397 questions'));assert.ok(overview.includes('Distinctive strengths'));
 const meta=profiles.find(p=>p.company==='Meta')!;
 const company=renderToStaticMarkup(<CompanyView {...common} profile={meta} onTopic={noop} selectedTopic=""/>);assert.ok(company.includes('1,509'));assert.ok(company.includes('Topics ranked'));assert.ok(!company.includes('chart-pie'));
 const compare=renderToStaticMarkup(<CompareView selected={['Meta','Google']} allProfiles={profiles} average={average} order={order} onToggle={noop} onTopic={noop}/>);assert.ok(compare.includes('diverging-chart'));assert.ok(compare.includes('Question-bank overlap'));assert.ok(compare.includes('Shared questions'));
 const one=renderToStaticMarkup(<CompareView selected={['Meta']} allProfiles={profiles} average={average} order={order} onToggle={noop} onTopic={noop}/>);assert.ok(one.includes('Add another company to compare'));assert.ok(!one.includes('diverging-chart'));
 const three=renderToStaticMarkup(<CompareView selected={['Meta','Google','Microsoft']} allProfiles={profiles} average={average} order={order} onToggle={noop} onTopic={noop}/>);assert.ok(three.includes('aligned-table'));assert.ok(three.includes('disabled=""'));
 const empty={company:'Thin',rows:[],count:0,shares:[]};const thin=renderToStaticMarkup(<CompanyView {...common} profile={empty} onTopic={noop} selectedTopic=""/>);assert.ok(thin.includes('No questions in this window'));assert.ok(thin.includes('Not enough data'));
});
test('history renders only observed dates and bank details preserve the accepted study topics',()=>{
 const history=renderToStaticMarkup(<TimeView bundle={bundle} company="Meta" window="all" tagging="study" order={order} mode="history" onMode={noop} onTopic={noop}/>);assert.equal((history.match(/class="trend-card"/g)||[]).length,6);assert.ok(history.includes('Feb 21, 2026'));assert.ok(history.includes('Jul 12, 2026'));assert.ok(history.includes('Collection dates, not interview dates'));
 const bank=renderToStaticMarkup(<QuestionBank profiles={profiles.slice(0,2)} topic="" difficulty="All" tagging="study" visibleTopics={order.slice(0,8)} onTopic={noop} onDifficulty={noop} onQuestion={noop} comparison/>);assert.ok(bank.includes('Details for'));assert.ok(bank.includes('Shared only'));assert.ok(bank.includes('<th>Topic</th>'));assert.ok(!bank.includes('metadata-rule'));assert.ok(!bank.includes('Original source tags'));assert.ok(!bank.includes('Last asked'));
});

test('company fingerprints follow their own descending shares in every recency mode; comparisons retain shared order',()=>{
 for(const window of ['30d','6m','all'] as const){
  const current=manifest.companies.map(company=>fingerprint(company,rowsFor(bundle,company,window,'study'))),localAverage=averageShares(current),globalOrder=globalTopicOrder(current),meta=current.find(p=>p.company==='Meta')!;
  const html=renderToStaticMarkup(<CompanyView profiles={current} profile={meta} order={globalOrder} average={localAverage} onCompany={noop} onCompare={noop} onTopic={noop} selectedTopic=""/>);
  const bar=html.match(/<div class="fingerprint-bar"[^>]*>(.*?)<\/div>/s)![1];
  const labels=[...bar.matchAll(/aria-label="([^"]+)"/g)].map(m=>m[1]);
  const expected=meta.shares.slice(0,8).map(s=>`Meta, ${s.topic}: ${s.percent.toFixed(1)}%`);
  assert.deepEqual(labels.slice(0,8),expected);assert.equal(labels.length,Math.min(8,meta.shares.length)+(meta.shares.length>8?1:0));
  const compare=renderToStaticMarkup(<CompareView selected={['Meta','Google']} allProfiles={current} order={globalOrder} average={localAverage} onToggle={noop} onTopic={noop}/>);
  const bars=[...compare.matchAll(/<div class="fingerprint-bar"[^>]*>(.*?)<\/div>/gs)];
  for(const [index,company] of ['Meta','Google'].entries()){
   const p=current.find(p=>p.company===company)!;
   const orderedLabels=[...bars[index][1].matchAll(/aria-label="([^"]+)"/g)].map(m=>m[1]);
   assert.deepEqual(orderedLabels.slice(0,globalOrder.slice(0,8).filter(t=>p.shares.some(s=>s.topic===t)).length),globalOrder.slice(0,8).flatMap(topic=>{const s=p.shares.find(s=>s.topic===topic);return s?[`${company}, ${topic}: ${s.percent.toFixed(1)}%`]:[];}));
  }
 }
});

test('sidebar is alphabetic and describes unique question counts in the selected window',()=>{
 const html=renderToStaticMarkup(<CompanyNavigation profiles={profiles} window="all" onCompany={noop}/>);
 const names=[...html.matchAll(/<button[^>]*>.*?<span>([^<]+)<\/span><span class="sidebar-count"/gs)].map(m=>m[1]);
 assert.deepEqual(names,['Apple','Bloomberg','Google','Meta','Microsoft']);assert.ok(html.includes('Questions'));assert.ok(html.includes('A–Z'));assert.ok(html.includes('1,509 unique questions, All time'));
 const empty=renderToStaticMarkup(<CompanyNavigation profiles={[fingerprint('Meta',[]),fingerprint('Google',null)]} window="30d" onCompany={noop}/>);assert.ok(empty.includes('0 unique questions, Last 30 days'));assert.ok(empty.includes('aria-label="Unavailable"'));
});
