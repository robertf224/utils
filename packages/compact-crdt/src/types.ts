import type { Hlc as HlcType } from "@bobbyfidz/hlc";
import type { VersionVector } from "./VersionVector.js";

export type ActorId = string;
export type Hlc = HlcType;

// Per-node metadata: latest dot per actor who updated that node
export type NodeDots = VersionVector;

export interface RegisterLeaf<T = unknown> {
    type: "register";
    value: T;
    // Metadata for this leaf node to participate in diffs
    dots: NodeDots;
}

export interface MapNode {
    type: "map";
    // Node-level dots; updated on any structural or child update
    dots: NodeDots;
    // Children entries
    entries: Record<string, MapEntry>;
    // Per-key tombstones for Add-Wins removes
    removed?: Record<string, VersionVector>;
}
export interface CounterLeaf {
    type: "counter";
    // Per-actor positive and negative contributions (PN-counter)
    p: Record<ActorId, number>;
    n: Record<ActorId, number>;
    // Latest dot per actor that last updated their contribution
    actorDots: VersionVector;
    // Node-level dots for diff pruning
    dots: NodeDots;
}

export type MapEntry = MapNode | RegisterLeaf | CounterLeaf;

export type DocumentRoot = MapNode;

export interface ClockState {
    // Actor/node id (should match HLC.nodeId)
    actorId: ActorId;
    // Current HLC state used for generating new dots
    hlc: Hlc;
}

export interface PathSegment {
    key: string;
}

export type Path = PathSegment[];

export type DiffOp =
    | {
          op: "set_register";
          path: string[]; // keys from root to leaf
          value: unknown;
          write: Hlc; // leaf write dot
          // Along the path, node dots that are not covered by the remote vv
          // are implicit by the existence of this op; receivers update node dots
      }
    | {
          op: "remove_key";
          path: string[]; // path to parent map
          key: string; // key removed
          removeVV: VersionVector; // summary at remove time
      }
    | {
          op: "counter_update";
          path: string[]; // keys from root to counter leaf
          actor: ActorId;
          p: number;
          n: number;
          dot: Hlc; // actor's latest counter dot
      };

export interface DiffEnvelope {
    // Summary of all ops, optional but helps recipients skip work
    vv: VersionVector;
    ops: DiffOp[];
}
