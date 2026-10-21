export const companies = ['Meta', 'Google', 'Apple', 'Microsoft', 'Bloomberg'] as const;
export type Company = string;
export type WindowKey = '30d' | '3m' | '6m' | 'older6m' | 'all';
export const windowLabels: Record<WindowKey, string> = { '30d': 'Last 30 days', '3m': 'Last 3 months', '6m': 'Last 6 months', older6m: 'More than 6 months', all: 'All time' };
export interface TopicReview { method: 'statement-review' | 'concept-review' | 'metadata-rule' | 'source-single' | 'unclassified'; confidence: 'high' | 'medium' | 'low'; reason: string; version: string; evidence?: string }
export interface Question { id: string; title: string; url: string; difficulty: string; topics: string[]; topicSources: string[]; primaryTopic?: string | null; topicReview?: TopicReview; sourceTopics?: string[] }
export interface Observation { questionId: string; score: number | null }
export interface CompanyData { company: string; windows: Partial<Record<WindowKey, Observation[]>> }
export interface Snapshot { id: string; source: string; repository: string; revision: string; snapshotDate: string | null; dateNote: string; retrievedAt: string; contentHash: string; files: Partial<Record<Company, string>>; reuse: { status: 'unverified' | 'approved'; evidence: string } }
export interface Manifest { version: string; catalogFile: string; snapshots: Snapshot[]; catalogVersion: string; companies: Company[]; taggingReport?: string }
export interface Row extends Question { score: number | null }
export interface Share { topic: string; value: number; percent: number; questions: number }
