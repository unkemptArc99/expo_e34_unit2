import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Overview, CompanyView, CompareView, TimeView } from '../src/views';
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
 const three=renderToStaticMarkup(<CompareView selected={['Meta','Google','Netflix']} allProfiles={profiles} average={average} order={order} onToggle={noop} onTopic={noop}/>);assert.ok(three.includes('aligned-table'));assert.ok(three.includes('disabled=""'));
 const empty={company:'Thin',rows:[],count:0,shares:[]};const thin=renderToStaticMarkup(<CompanyView {...common} profile={empty} onTopic={noop} selectedTopic=""/>);assert.ok(thin.includes('No questions in this window'));assert.ok(thin.includes('Not enough data'));
});
test('history renders only observed dates and bank details preserve the accepted study topics',()=>{
 const history=renderToStaticMarkup(<TimeView bundle={bundle} company="Meta" window="all" tagging="study" order={order} mode="history" onMode={noop} onTopic={noop}/>);assert.equal((history.match(/class="trend-card"/g)||[]).length,6);assert.ok(history.includes('Feb 21, 2026'));assert.ok(history.includes('Jul 12, 2026'));assert.ok(history.includes('Collection dates, not interview dates'));
 const bank=renderToStaticMarkup(<QuestionBank profiles={profiles.slice(0,2)} topic="" difficulty="All" tagging="study" visibleTopics={order.slice(0,8)} onTopic={noop} onDifficulty={noop} onQuestion={noop} comparison/>);assert.ok(bank.includes('Details for'));assert.ok(bank.includes('Shared only'));assert.ok(bank.includes('Study topic'));assert.ok(!bank.includes('Last asked'));
});
