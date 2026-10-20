# Primary study-topic audit

Version study-topics-v1. Reviewed 2026-10-20.

This is a **first-pass study classification**, not a claim that every full question statement has been read or that the original source tags are incorrect. Source tags remain intact and available in the app.

2,566 unique questions across the five selected companies; 2,241 have a different one-topic study view. Array occurs in 1,433 original tag sets and is selected as the primary study topic for 45 questions. These counts compare source-tag presence with primary-topic assignment; they do not measure incorrect-tag removal.

## Review coverage

| Basis | Questions | Meaning |
| --- | ---: | --- |
| Public statement read | 13 | Linked statement checked in this review |
| Question-specific concept review | 266 | LLM problem recognition and source metadata; not a fresh statement read |
| Metadata suggestion | 1966 | Low-confidence deterministic preference; needs individual review |
| Single source tag retained | 270 | No independent review implied |
| Unclassified | 51 | Insufficient evidence; no forced guess |

A primary label is an editorial learning choice. Alternative solutions remain valid. In particular, supporting containers such as Array and String are deprioritized only when a more specific supported technique is available. Array-only scans are retained when appropriate. No new topic names were invented.

The rule order is checked into [scripts/curation.ts](../scripts/curation.ts); question-specific decisions and reasons are in [data/topic-reviews.json](../data/topic-reviews.json). SQL, shell, and language exercises are not silently removed. Some unclassified records are JavaScript or dataframe exercises outside this algorithm vocabulary.

## Company coverage

Counts below deduplicate every question across sources and all recency windows. The company totals overlap. Chart percentages use the app's previous equal-split accounting before and one-primary-topic accounting after.

| Company | Unique questions | Original Array tag | Primary Array topic | Previous Array chart share | New Array chart share |
| --- | ---: | ---: | ---: | ---: | ---: |
| Apple | 384 | 207 | 8 | 17.1% | 2.1% |
| Google | 2397 | 1347 | 44 | 18.2% | 1.8% |
| Meta | 1509 | 802 | 30 | 17.6% | 2.0% |
| Netflix | 36 | 20 | 2 | 16.6% | 5.6% |
| Palantir | 29 | 17 | 0 | 17.6% | 0.0% |

## Example decisions

| Question | Source tags | Primary topic | Reason |
| --- | --- | --- | --- |
| [Two Sum](https://leetcode.com/problems/two-sum/) | Array, Hash Table | Hash Table | Look up each value's complement while scanning; the array is input storage. |
| [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Array, Two Pointers, Dynamic Programming, Stack, Monotonic Stack | Two Pointers | The two-boundary solution advances the side with the smaller limiting height. A monotonic stack is a valid alternative. |
| [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Array, Depth-First Search, Breadth-First Search, Union Find, Matrix | Depth-First Search | Flood-fill each unvisited land component. BFS and Union Find are alternatives; the grid is the representation. |
| [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Array, Sorting, Quicksort | Sorting | Order intervals by start, then sweep and merge overlaps. A particular sorting implementation is not the learning objective. |
| [Insert Interval](https://leetcode.com/problems/insert-interval/) | Array | Array | The intervals are already sorted and disjoint; a linear scan inserts and merges. Retain Array rather than invent an Intervals tag. |
| [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Array, Dynamic Programming | Greedy | Maintain the minimum earlier price and best profit. This running-minimum invariant is more instructive than the input container. |
| [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/) | Array, String, Depth-First Search, Graph, Sorting, Heap (Priority Queue), Eulerian Circuit, Eulerian Path, Semi-Eulerian Graph | Eulerian Path | Every flight ticket is an edge that must be used exactly once; lexical edge ordering selects among valid Eulerian trails. |
| [Maximum Length of Repeated Subarray](https://leetcode.com/problems/maximum-length-of-repeated-subarray/) | Array, Binary Search, Dynamic Programming, Sliding Window, Rolling Hash, Hash Function | Dynamic Programming | Extend equal-ending pairs using a two-prefix recurrence for the longest common contiguous segment. |
| [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | Array, Hash Table, Union Find | Hash Table | A set supports testing sequence starts and extending consecutive runs in expected linear time. |
| [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Array, Divide and Conquer, Sorting, Heap (Priority Queue), Quickselect | Quickselect | Partition around pivots to select a rank without fully sorting; a heap is a valid alternative. |

## Primary-topic distribution

| Topic | Questions | Share |
| --- | ---: | ---: |
| Dynamic Programming | 354 | 13.8% |
| Hash Table | 162 | 6.3% |
| Greedy | 156 | 6.1% |
| Math | 143 | 5.6% |
| Binary Search | 136 | 5.3% |
| Database | 112 | 4.4% |
| Sliding Window | 105 | 4.1% |
| Tree | 101 | 3.9% |
| Two Pointers | 93 | 3.6% |
| Backtracking | 87 | 3.4% |
| Design | 87 | 3.4% |
| Prefix Sum | 87 | 3.4% |
| Heap (Priority Queue) | 74 | 2.9% |
| Bit Manipulation | 72 | 2.8% |
| Breadth-First Search | 62 | 2.4% |
| Union Find | 55 | 2.1% |
| String | 55 | 2.1% |
| Monotonic Stack | 53 | 2.1% |
| Unclassified | 51 | 2.0% |
| Array | 45 | 1.8% |
| Linked List | 44 | 1.7% |
| Stack | 43 | 1.7% |
| Simulation | 42 | 1.6% |
| Trie | 35 | 1.4% |
| Sorting | 34 | 1.3% |
| Topological Sort | 29 | 1.1% |
| Binary Search Tree | 27 | 1.1% |
| Geometry | 27 | 1.1% |
| Number Theory | 25 | 1.0% |
| Shortest Path | 24 | 0.9% |
| Matrix | 16 | 0.6% |
| Depth-First Search | 14 | 0.5% |
| Monotonic Queue | 14 | 0.5% |
| String Matching | 13 | 0.5% |
| Enumeration | 11 | 0.4% |
| Combinatorics | 10 | 0.4% |
| Graph | 9 | 0.4% |
| Segment Tree | 8 | 0.3% |
| Queue | 8 | 0.3% |
| Concurrency | 6 | 0.2% |
| Binary Indexed Tree | 6 | 0.2% |
| Counting | 5 | 0.2% |
| Minimum Spanning Tree | 4 | 0.2% |
| Recursion | 4 | 0.2% |
| Shell | 4 | 0.2% |
| Divide and Conquer | 3 | 0.1% |
| Merge Sort | 2 | 0.1% |
| Quickselect | 2 | 0.1% |
| Maximum Flow | 2 | 0.1% |
| Bucket Sort | 1 | 0.0% |
| Binary Lifting | 1 | 0.0% |
| Lowest Common Ancestor | 1 | 0.0% |
| Boyer–Moore Majority Vote Algorithm | 1 | 0.0% |
| Eulerian Path | 1 | 0.0% |

## Full audit

The adjacent [tagging-audit.json](tagging-audit.json) contains every question, companies, original tags, primary topic, tags hidden or added in the study view, method, confidence, rationale, and statement evidence where available. The app links a searchable HTML copy. Original CSV files are unchanged. Refreshes reapply the reviewed mappings; new questions receive explicitly marked suggestions until reviewed.
