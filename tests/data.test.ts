import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageShares, bankRows, collectionHistory, fingerprint, globalTopicOrder, overIndex, questionOverlap, rowsFor, shareOf, topicGaps, topicSimilarity, type Bundle } from '../src/data';
import type { Row, Snapshot } from '../src/types';
const row=(id:string,topic:string):Row=>({id,title:id,url:`https://leetcode.com/problems/${id}/`,difficulty:'Medium',topics:[topic],primaryTopic:topic,topicSources:[],score:1});
const a=row('a','Dynamic Programming'),b=row('b','Hash Table'),c=row('c','Greedy');
const snapshot=(id:string,date:string|null,repository='repo-a'):Snapshot=>({id,source:id,repository,revision:id,snapshotDate:date,dateNote:'',retrievedAt:'',contentHash:id,files:{Meta:id+'.json',Google:id+'-google.json'},reuse:{status:'unverified',evidence:''}});
const bundle:Bundle={manifest:{version:'v1',catalogFile:'catalog.json',catalogVersion:'c1',companies:['Meta','Google'],snapshots:[snapshot('feb','2026-02-21'),snapshot('jul','2026-07-12'),snapshot('undated',null,'repo-b')]},catalog:{a:{...a,topics:['Array','Dynamic Programming']},b,c},data:{'feb/Meta':{company:'Meta',windows:{'30d':[{questionId:'a',score:90}],all:[{questionId:'a',score:90},{questionId:'b',score:50}]}},'jul/Meta':{company:'Meta',windows:{'30d':[{questionId:'a',score:80},{questionId:'b',score:20}],all:[{questionId:'a',score:80},{questionId:'b',score:20}]}},'undated/Meta':{company:'Meta',windows:{'30d':[{questionId:'c',score:100},{questionId:'a',score:100}],all:[{questionId:'c',score:100},{questionId:'a',score:100}]}}}};
test('shared analytics distinguish URL overlap from topic-distribution similarity',()=>{
 const meta=fingerprint('Meta',[a,b]),google=fingerprint('Google',[{...a,id:'another-a'},c]);
 assert.equal(topicSimilarity(meta,meta),100);assert.equal(topicSimilarity(meta,google),50);assert.equal(topicSimilarity(google,meta),50);assert.equal(topicSimilarity(meta,fingerprint('X',[c])),0);assert.equal(topicSimilarity(meta,fingerprint('X',null)),null);
 const pair=[meta,fingerprint('Google',[a,c])],overlap=questionOverlap(pair);assert.equal(overlap.shared.size,1);assert.equal(overlap.union,3);assert.ok(Math.abs(overlap.percent-100/3)<1e-10);
 assert.deepEqual(bankRows(pair,true).map(r=>r.id),['a']);assert.deepEqual(bankRows(pair).find(r=>r.id==='a')?.companyNames,['Meta','Google']);assert.equal(bankRows(pair).find(r=>r.id==='a')?.score,1);
});
test('equal-company baseline is not dominated by the larger question bank and gaps share one topic order',()=>{
 const small=fingerprint('Small',[a,b]),large=fingerprint('Large',Array.from({length:100},(_,i)=>({...a,id:String(i)}))),missing=fingerprint('Missing',null),average=averageShares([small,large,missing]);
 assert.equal(average.get('Dynamic Programming'),75);assert.equal(average.get('Hash Table'),25);assert.equal(overIndex(small,'Hash Table',average),2);assert.equal(overIndex(missing,'Hash Table',average),null);assert.equal(shareOf(small,'Greedy'),0);
 const order=globalTopicOrder([small,large]);assert.deepEqual(order,['Dynamic Programming','Hash Table']);assert.equal(topicGaps([small,large],order)[0].gap,50);
});
test('history uses exact dated collections, excludes undated records, and preserves the frozen taxonomy',()=>{
 const points=collectionHistory(bundle,'Meta','30d','study');assert.deepEqual(points.map(p=>p.date),['2026-02-21','2026-07-12']);assert.deepEqual(points.map(p=>p.count),[1,2]);assert.equal(shareOf(points[0],'Dynamic Programming'),100);assert.equal(shareOf(points[1],'Dynamic Programming'),50);assert.ok(points.every(p=>!p.rows?.some(r=>r.id==='c')));
 const merged=rowsFor(bundle,'Meta','all','study')!;assert.equal(merged.length,3);assert.equal(merged.find(r=>r.id==='a')?.score,2);assert.deepEqual(merged.find(r=>r.id==='a')?.topics,['Dynamic Programming']);assert.deepEqual(merged.find(r=>r.id==='a')?.sourceTopics,['Array','Dynamic Programming']);
 assert.deepEqual(rowsFor(bundle,'Meta','all','source')!.find(r=>r.id==='a')?.topics,['Array','Dynamic Programming']);assert.equal(rowsFor(bundle,'Unlisted','30d','study'),null);assert.equal(rowsFor(bundle,'Meta','6m','study'),null);
});
