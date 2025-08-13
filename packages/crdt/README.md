@bobbyfidz/compact-crdt

State-based CRDTs with diffs inspired by [Ditto](https://www.ditto.com/blog/an-inside-look-at-dittos-delta-state-crdts).

```
import { Hlc } from "@bobbyfidz/hlc";
import { Map } from "@bobbyfidz/crdt";

const hlcA = Hlc.create("A");
const docA = Map.create();
setAtPath(docA, ["user", "name"], "Alice", Hlc.tick(hlcA));

const hlcB = Hlc.create("B");
const docB = Map.create("B", Hlc.tick(hlcB));
const diffFromA = diff(docA, Map.getVersionVector(docB));
applyDiff(docB, diffFromA);
```
