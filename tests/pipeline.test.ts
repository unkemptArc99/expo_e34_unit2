import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve('.');
function run(cwd:string,script='scripts/ingest.ts'){return spawnSync(process.execPath,['--import',join(root,'node_modules/tsx/dist/loader.mjs'),join(root,script)],{cwd,encoding:'utf8'});}
test('pipeline enriches topics, deduplicates mirrors, preserves dates, and fails without replacing manifest',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'atlas-pipeline-'));
 try{
  await mkdir(join(directory,'data/raw'),{recursive:true});await writeFile(join(directory,'data/permissions.json'),'{}');await writeFile(join(directory,'data/topic-reviews.json'),JSON.stringify({version:'test-study-v1',reviewedAt:'2026-10-20',reviews:{'two-sum':{topic:'Array',basis:'concept-review',confidence:'medium',reason:'Test preservation of original tags alongside a reviewed study label.'}}}));
  for(const [id,hash,date,topic] of [['older','hash1','2025-01-01','Array'],['newer','hash2','2026-01-01',''],['mirror','hash1','2025-01-01','Array']]){
   const raw=join(directory,'data/raw',id);await mkdir(raw);
   const csv=`Title,Difficulty,Link,Topics,Frequency\nTwo Sum,Easy,https://leetcode.com/problems/two-sum,${topic},50`;
   await writeFile(join(raw,'input.csv'),csv);
   await writeFile(join(raw,'meta.json'),JSON.stringify({source:{id,label:id,repository:id,ref:id,snapshotDate:date,dateNote:'test',reuse:{status:'unverified',evidence:'test'}},revision:id,retrievedAt:'2026-10-11T00:00:00Z',contentHash:hash,entries:[{company:'Meta',window:'30d',file:'input.csv'},{company:'META',window:'30d',file:'input.csv'},{company:'Google',window:'30d',file:'input.csv'},{company:'goo-gle',window:'30d',file:'input.csv'}]}));
  }
  const successful=run(directory);assert.equal(successful.status,0,successful.stderr);const manifestPath=join(directory,'public/data/manifest.json');const before=await readFile(manifestPath,'utf8');const manifest=JSON.parse(before);assert.equal(manifest.snapshots.length,2);assert.deepEqual(manifest.companies,['Meta','Google']);const companyData=JSON.parse(await readFile(join(directory,'public/data',manifest.snapshots[0].files['Google']),'utf8'));assert.equal(companyData.windows['30d'].length,1);assert.equal(manifest.snapshots[0].snapshotDate,'2026-01-01');const catalog=JSON.parse(await readFile(join(directory,'public/data',manifest.catalogFile),'utf8'));assert.deepEqual(catalog['two-sum'].topics,['Array']);assert.equal(catalog['two-sum'].primaryTopic,'Array');assert.equal(catalog['two-sum'].topicReview.method,'concept-review');assert.ok(manifest.taggingReport.endsWith('.html'));const report=JSON.parse(await readFile(join(directory,'reports/tagging-audit.json'),'utf8'));assert.equal(report.records.length,1);assert.deepEqual(report.records[0].originalTopics,['Array']);
  const again=run(directory);assert.equal(again.status,0);assert.equal(await readFile(manifestPath,'utf8'),before);
  assert.equal(run(directory,'scripts/check-publish.ts').status,1);
  await writeFile(join(directory,'data/raw/newer/input.csv'),'bad csv');assert.notEqual(run(directory).status,0);assert.equal(await readFile(manifestPath,'utf8'),before);
 } finally {await rm(directory,{recursive:true,force:true});}
});
