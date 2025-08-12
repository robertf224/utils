import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { applyDiff, makeDiff } from "./diff.js";
import { Map } from "./Map.js";

describe("add-wins removes", () => {
    test("new add after remove is accepted", () => {
        let a = Hlc.create("A");
        const b = Hlc.create("B");
        const docA = Map.create(
            "A",
            Hlc.tick(a, () => 1)
        );
        const docB = Map.create(
            "B",
            Hlc.tick(b, () => 1)
        );

        a = Hlc.tick(a, () => 2);
        Map.setAtPath(docA, ["user", "name"], "Alice", a);

        // B removes specific key at its current vv
        const vvB = Map.getVersionVector(docB);
        Map.removeAtPath(docB, ["user", "name"], vvB);

        // A writes later
        a = Hlc.tick(a, () => 3);
        Map.setAtPath(docA, ["user", "name"], "Alice Cooper", a);

        applyDiff(docB, makeDiff(docA, Map.getVersionVector(docB)));

        const user = docB.entries["user"] as { entries: Record<string, { value: string } | undefined> };
        const regB = user.entries["name"]!;
        expect(regB.value).toBe("Alice Cooper");
    });

    test("remove individual key propagates", () => {
        let a = Hlc.create("A", 0);
        const b = Hlc.create("B", 0);
        const docA = Map.create(
            "A",
            Hlc.tick(a, () => 1)
        );
        const docB = Map.create(
            "B",
            Hlc.tick(b, () => 1)
        );

        a = Hlc.tick(a, () => 2);
        Map.setAtPath(docA, ["user", "name"], "Alice", a);
        applyDiff(docB, makeDiff(docA, Map.getVersionVector(docB)));
        {
            const user = docB.entries["user"] as { entries: Record<string, { value: string } | undefined> };
            expect(user.entries["name"]!.value).toBe("Alice");
        }

        const vvB = Map.getVersionVector(docB);
        Map.removeAtPath(docB, ["user", "name"], vvB);
        applyDiff(docA, makeDiff(docB, Map.getVersionVector(docA)));
        {
            const userA = docA.entries["user"] as { entries: Record<string, unknown> };
            expect(userA.entries["name"]).toBeUndefined();
        }
    });
});
