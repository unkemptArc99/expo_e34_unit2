import { readFile } from 'node:fs/promises';
import type { Manifest } from '../src/types';
const manifest: Manifest = JSON.parse(await readFile('public/data/manifest.json','utf8'));
const unapproved = manifest.snapshots.filter(s => s.reuse.status !== 'approved' || !s.reuse.evidence.trim());
if(unapproved.length) { console.error('Publication stopped: dataset reuse review is incomplete for '+[...new Set(unapproved.map(s=>s.repository))].join(', ')+'. Record verified evidence in data/permissions.json, then rebuild data.'); process.exitCode=1; }
else console.log('Dataset publication evidence is recorded for every snapshot.');
