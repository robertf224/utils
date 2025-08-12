@bobbyfidz/compact-crdt

State-based CRDTs with diffs for Map/Register (with optional Counter/List later). Add-wins deletes, HLC LWW registers, CBOR encoding for wire format.

APIs are dynamic-first, with a path-based API. A schema builder can be added later.

Features

- State-based Map of CRDT nodes
- Register leaf with HLC last-writer-wins
- Add-wins remove summaries
- Diff generate/apply
- CBOR encode/decode
- Version vector derive

Quickstart

```
import { Hlc } from "@bobbyfidz/hlc";
import { createEmpty, setAtPath, makeDiff, applyDiff, deriveVersionVector } from "@bobbyfidz/compact-crdt";

const hlcA = Hlc.create("A");
const docA = createEmpty("A", Hlc.tick(hlcA));
setAtPath(docA, ["user", "name"], "Alice", Hlc.tick(hlcA));

const hlcB = Hlc.create("B");
const docB = createEmpty("B", Hlc.tick(hlcB));
const diff = makeDiff(docA, deriveVersionVector(docB));
applyDiff(docB, diff);
```

Notes on dots per node
Where multiple peers concurrently update a node, we keep multiple dots (latest HLC per actor) in node metadata. This lets us decide if a remote has seen a node's latest updates and prune subtrees from diffs. For lists/counters, similar per-actor dots are required to reason about concurrency on positions or increments; for registers/maps, per-actor maxima at each node suffice.
