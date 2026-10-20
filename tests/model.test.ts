import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, canonicalUrl, filterRows, ranked, comparisonTopics, pieShares } from '../src/model';
import { normalizeCsv, parseCsv, jsonToCsv } from '../scripts/csv';
import type { Row } from '../src/types';
const rows:Row[]=[{id:'a',url:'',title:'A',difficulty:'Easy',topics:['Array','Hash Table'],topicSources:[],score:50},{id:'b',url:'',title:'B',difficulty:'Hard',topics:['Array'],topicSources:[],score:100},{id:'c',url:'',title:'C',difficulty:'Easy',topics:[],topicSources:[],score:null}];
test('multi-tag questions contribute one unit and shares sum to 100',()=>{const shares=aggregate(rows);assert.equal(shares.find(s=>s.topic==='Array')?.value,1.5);assert.equal(shares.find(s=>s.topic==='Unclassified')?.value,1);assert.ok(Math.abs(shares.reduce((n,s)=>n+s.percent,0)-100)<1e-10);assert.equal(aggregate([]).length,0);});
test('filters preserve full tag allocation and match any chosen topic',()=>{const filtered=filterRows(rows,'Easy',['Hash Table']);assert.equal(filtered.length,1);assert.equal(aggregate(filtered).find(s=>s.topic==='Array')?.percent,50);assert.equal(filterRows(rows,'Easy',['Unclassified'])[0].id,'c');});
test('rank scores descending, null last, and resolve ties alphabetically',()=>{assert.deepEqual(ranked(rows).map(r=>r.id),['b','a','c']);assert.equal(ranked([{...rows[0],title:'Z'}, {...rows[1],score:50,title:'A'}])[0].title,'A');});
test('paired charts use a common topic set and preserve Other allocation',()=>{const a=aggregate(rows),b=aggregate([{...rows[0],topics:['Graph']}]);const topics=comparisonTopics([a,b]);assert.ok(topics.includes('Graph'));const pie=pieShares(a,['Array']);assert.equal(pie.find(s=>s.topic==='Other')?.value,1.5);assert.equal(pie.reduce((n,s)=>n+s.value,0),3);});
test('normalize practice links and reject invalid/external schemes and paths',()=>{assert.deepEqual(canonicalUrl('https://leetcode.com/problems/two-sum?x=1'),{id:'two-sum',url:'https://leetcode.com/problems/two-sum/'});for(const url of ['http://leetcode.com/problems/two-sum','https://evil.com/problems/two-sum','https://leetcode.com/problems/two-sum/solution'])assert.throws(()=>canonicalUrl(url));});
test('parse quoted CSV fields, escaped quotes, CRLF, multiline titles, BOM',()=>{const csv='\uFEFFTitle,Topics\r\n"A, \"\"B\"\"\nC","Array, Graph"\r\n';assert.equal(parseCsv(csv)[0].Title,'A, "B"\nC');assert.throws(()=>parseCsv('A,B\nx'));assert.throws(()=>parseCsv('A\n"x'));});
test('both source formats normalize scores, topics, deduplicate canonical records',()=>{const topicCsv='Difficulty,Title,Frequency,Link,Topics\nEASY,Two Sum,100,https://leetcode.com/problems/two-sum,"Array, Graph Theory, Graphs"\nEASY,Two Sum,50,https://leetcode.com/problems/two-sum/,Array';const parsed=normalizeCsv(topicCsv,'source');assert.equal(parsed.observations.length,1);assert.deepEqual(parsed.questions[0].topics,['Array','Graph']);const ids=normalizeCsv('ID,URL,Title,Difficulty,Frequency %\n1,https://leetcode.com/problems/two-sum,Two Sum,Easy,75.0%\n2,https://leetcode.com/problems/add-two-numbers,Add Two Numbers,Medium,','source');assert.equal(ids.observations[0].score,75);assert.equal(ids.observations[1].score,null);assert.deepEqual(ids.questions[0].topics,[]);assert.throws(()=>normalizeCsv(topicCsv.replace(',100,',',101,'),'source'));});
test('JSON imports preserve titles, topics, and nullable scores through the CSV adapter',()=>{
 const csv=jsonToCsv(JSON.stringify([{title:'Two Sum, "classic"',url:'https://leetcode.com/problems/two-sum',difficulty:'Easy',topics:['Array','Hash Table'],score:null}]));
 const parsed=normalizeCsv(csv,'local');assert.equal(parsed.questions[0].title,'Two Sum, "classic"');assert.deepEqual(parsed.questions[0].topics,['Array','Hash Table']);assert.equal(parsed.observations[0].score,null);assert.throws(()=>jsonToCsv('{}'));assert.throws(()=>jsonToCsv('[{"title":"bad"}]'));
});

test('merged questions deduplicate snapshots and count independent repositories',async()=>{
 const {mergeQuestionSources}=await import('../src/model');
 const merged=mergeQuestionSources([{source:'repo-a',rows:[rows[0],rows[1]]},{source:'repo-a',rows:[rows[0]]},{source:'repo-b',rows:[rows[0],rows[2]]}]);
 assert.equal(merged.length,3);assert.equal(merged.find(r=>r.id==='a')?.score,2);assert.equal(merged.find(r=>r.id==='b')?.score,1);assert.deepEqual(merged.find(r=>r.id==='a')?.topics,['Array','Hash Table']);assert.equal(aggregate(merged).reduce((n,s)=>n+s.value,0),3);
});
