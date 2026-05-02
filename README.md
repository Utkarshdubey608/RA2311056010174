# Notification System Design — Priority Inbox

## Goal
Introduce a Priority Inbox that always displays the top `n` most important unread notifications first. Priority is a combination of type weight (Placement > Result > Event) and recency.

## Implementation (included files)
- `notification_priority.js` — Node.js script that reads `notification_app_fe/notifications_sample.json` and computes top `n` notifications using a min-heap.
- `notification_app_fe/notifications_sample.json` — sample notifications to demonstrate algorithm.
- `top10_output.txt` — generated output when running the script (created by running the script locally).

## Priority function
- Each notification receives a numeric weight based on Type:
  - Placement: 3
  - Result: 2
  - Event: 1
- Recency is measured by the timestamp (milliseconds since epoch).

We use a lexicographic ordering where higher weight is more important; within same weight, more recent timestamp is higher priority.

Effective score is represented as tuple: (weight, timestamp).

## Algorithm
To maintain top `n` efficiently as notifications stream in, we use a min-heap of size `n`:
- For each incoming notification, compute (weight, timestamp).
- Insert onto min-heap.
- If heap size > n, pop the smallest element.

At any point, the heap contains the current top `n`. This is O(log n) per insertion and O(n) memory.

This approach is efficient when new notifications continuously arrive. It scales well:
- Insertion complexity: O(log n) per notification
- Memory: O(n) for the heap
- Retrieval of sorted top `n`: O(n log n) (or O(n) if using appropriate extraction)

## Why min-heap?
- We only need to keep `n` best items. A min-heap of size `n` ensures the smallest of those is at the root; easy to evict when a higher-priority item arrives.
- It’s better than sorting all items every time when the stream is large.

## Handling updates and deletions
- If notifications can be updated (e.g., change in read/unread state or priority), maintain an auxiliary map from id -> heap entry and support lazy deletion or rebuild the heap periodically if updates are frequent.

## Scaling notes
- For very large volumes, partition by user and keep per-user heap in memory or using a fast in-memory database (Redis sorted sets are a good fit: ZADD with score = weight*1e12 + timestamp).

## Running the demo
1. cd into repo `question1`
2. node notification_priority.js 10

This will produce `top10_output.txt` with the top 10 notifications.

## Screenshot upload
- The assignment asks for screenshots; after running the script locally and viewing the terminal output, capture a screenshot and add it to the repo (e.g., `screenshots/top10.png`).

## Extensions
- Allow users to choose `n` (10, 15, 20) and the relative weighting (e.g., make weights configurable).
- Persist top-n per user to Redis and update incrementally as new notifications arrive.
- Provide an API endpoint to fetch top-n computed server-side; the frontend would then display this Priority Inbox.

## Frontend Next.js App

I added a production-ready React/Next frontend under `notification_next_app` which implements:
- `/` All Notifications (filter, pagination, viewed-state persisted in localStorage)
- `/priority` Priority Inbox (top-N, type filter)

Run it on port 3000:

```bash
cd notification_next_app
npm install
npm run dev
```

The app proxies requests to the evaluation API via `/api/notifications` to avoid CORS.


