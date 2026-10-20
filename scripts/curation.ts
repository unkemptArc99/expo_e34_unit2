import type { Question, TopicReview } from '../src/types';

export interface TopicOverride { topic: string; reason: string; basis: 'statement-review' | 'concept-review'; confidence: 'high' | 'medium'; evidence?: string }
export interface ReviewFile { version: string; reviewedAt: string; reviews: Record<string, TopicOverride> }

// These are study-pattern preferences, not a claim that one algorithm is uniquely correct.
// A rule may only select a tag already present on this particular source record.
const preference = [
  'Database', 'Shell', 'Concurrency', 'Design',
  'Topological Sort', 'Shortest Path', 'Minimum Spanning Tree', 'Maximum Flow',
  'Trie', 'Monotonic Stack', 'Monotonic Queue', 'Sliding Window',
  'Backtracking', 'Dynamic Programming', 'Binary Search', 'Union Find',
  'Binary Search Tree', 'Linked List', 'Tree', 'Binary Tree',
  'Breadth-First Search', 'Depth-First Search', 'Graph',
  'Heap (Priority Queue)', 'Greedy', 'Two Pointers', 'Prefix Sum',
  'Stack', 'Queue', 'Bit Manipulation', 'Segment Tree', 'Binary Indexed Tree',
  'String Matching', 'Rolling Hash', 'Geometry', 'Number Theory',
  'Combinatorics', 'Math', 'Hash Table', 'Sorting', 'Divide and Conquer',
  'Counting', 'Recursion', 'Simulation', 'Enumeration', 'String', 'Matrix', 'Array',
];

export function curateTopic(question: Question, overrides: Record<string, TopicOverride>, vocabulary: Set<string>, version: string): { primaryTopic: string | null; topicReview: TopicReview } {
  const override = overrides[question.id];
  if (override) {
    if (!vocabulary.has(override.topic)) throw new Error(`Unknown curated topic ${override.topic} for ${question.id}`);
    if (!override.reason.trim()) throw new Error(`Missing review reason for ${question.id}`);
    if (override.basis === 'statement-review' && override.evidence !== `${question.url}description/`) throw new Error(`Missing statement evidence for ${question.id}`);
    return { primaryTopic: override.topic, topicReview: { method: override.basis, confidence: override.confidence, reason: override.reason, ...(override.evidence?{evidence:override.evidence}:{}), version } };
  }
  if (!question.topics.length) return { primaryTopic: null, topicReview: { method: 'unclassified', confidence: 'low', version, reason: 'No source tags or question-specific review. Left unclassified rather than guessing from the title.' } };
  if (question.topics.length === 1) return { primaryTopic: question.topics[0], topicReview: { method: 'source-single', confidence: 'medium', version, reason: 'The source supplies only this topic. Retained without claiming an independent statement review.' } };
  const primaryTopic = preference.find(t => question.topics.includes(t)) || question.topics[0];
  return { primaryTopic, topicReview: { method: 'metadata-rule', confidence: 'low', version, reason: `Suggested ${primaryTopic} from the existing tags using the published study-pattern preference. Other source tags remain available; this question has not received an individual statement review.` } };
}
