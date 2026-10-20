import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { curateTopic, type ReviewFile } from '../scripts/curation';
import { companies, type Manifest, type Question } from '../src/types';
const review:ReviewFile=JSON.parse(readFileSync('data/topic-reviews.json','utf8'));
const manifest:Manifest=JSON.parse(readFileSync('public/data/manifest.json','utf8'));
const catalog:Record<string,Question>=JSON.parse(readFileSync('public/data/'+manifest.catalogFile,'utf8'));
const vocabulary=new Set(Object.values(catalog).flatMap(q=>q.topics));

test('reviewed primary topics preserve source tags and permit a different existing-vocabulary learning objective',()=>{
 const q:Question={id:'two-sum',title:'Two Sum',url:'https://leetcode.com/problems/two-sum/',difficulty:'Easy',topics:['Array','Hash Table'],topicSources:['source']};
 const original=structuredClone(q),curated=curateTopic(q,review.reviews,vocabulary,review.version);
 assert.equal(curated.primaryTopic,'Hash Table');assert.equal(curated.topicReview.method,'statement-review');assert.deepEqual(q,original);
 const stock=catalog['best-time-to-buy-and-sell-stock'];assert.equal(stock.primaryTopic,'Greedy');assert.deepEqual(stock.topics,['Array','Dynamic Programming']);
});
test('array-only questions and insufficiently classified questions are not force-fit to reduce Array counts',()=>{
 assert.equal(catalog['insert-interval'].primaryTopic,'Array');
 const unknown:Question={id:'unknown-problem',title:'Find the Unknown Maximum',url:'https://leetcode.com/problems/unknown-problem/',difficulty:'Hard',topics:[],topicSources:[]};
 const result=curateTopic(unknown,{},vocabulary,review.version);assert.equal(result.primaryTopic,null);assert.equal(result.topicReview.method,'unclassified');
 const suggested=curateTopic({...unknown,topics:['Array','Dynamic Programming']},{},vocabulary,review.version);assert.equal(suggested.primaryTopic,'Dynamic Programming');assert.equal(suggested.topicReview.method,'metadata-rule');assert.equal(suggested.topicReview.confidence,'low');
 assert.throws(()=>curateTopic(unknown,{'unknown-problem':{topic:'Invented Topic',reason:'Invalid vocabulary',basis:'concept-review',confidence:'medium'}},vocabulary,review.version),/Unknown curated topic/);
});
test('focused catalog and audit cover every observation and retain separate source and study fields',()=>{
 assert.deepEqual(manifest.companies,[...companies]);
 for(const q of Object.values(catalog)) {assert.ok(!q.primaryTopic||vocabulary.has(q.primaryTopic));assert.ok(q.topicReview?.reason);}
 const ids=new Set<string>();for(const s of manifest.snapshots){assert.ok(Object.keys(s.files).every(c=>companies.includes(c as typeof companies[number])));for(const file of Object.values(s.files)){const data=JSON.parse(readFileSync('public/data/'+file,'utf8'));for(const rows of Object.values(data.windows) as {questionId:string}[][])for(const o of rows){assert.ok(catalog[o.questionId]);ids.add(o.questionId);}}}
 assert.equal(ids.size,Object.keys(catalog).length);
 const audit=JSON.parse(readFileSync('reports/tagging-audit.json','utf8'));assert.equal(audit.records.length,ids.size);assert.equal(audit.summary.questions,ids.size);assert.equal(Object.values(audit.summary.methods).reduce((n:number,v)=>n+Number(v),0),ids.size);
 assert.equal(audit.summary.methods['statement-review'],Object.values(review.reviews).filter(r=>r.basis==='statement-review').length);
 for(const record of audit.records){assert.deepEqual(record.originalTopics,catalog[record.id].topics);assert.equal(record.primaryTopic,catalog[record.id].primaryTopic);assert.ok(record.companies.every((c:string)=>manifest.companies.includes(c)));}
});
