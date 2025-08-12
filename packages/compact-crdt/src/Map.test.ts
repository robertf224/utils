import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { createEmpty, setAtPath, removeAtPath, makeDiff, applyDiff, deriveVersionVector } from "./index.js";

describe("add-wins removes", () => {
    test("new add after remove is accepted", () => {
        let a = Hlc.create("A", 0);
        const b = Hlc.create("B", 0);
        const docA = createEmpty(
            "A",
            Hlc.tick(a, () => 1)
        );
        const docB = createEmpty(
            "B",
            Hlc.tick(b, () => 1)
        );

        a = Hlc.tick(a, () => 2);
        setAtPath(docA, ["user", "name"], "Alice", a);

        // B removes specific key at its current vv
        const vvB = deriveVersionVector(docB);
        removeAtPath(docB, ["user", "name"], vvB);

        // A writes later
        a = Hlc.tick(a, () => 3);
        setAtPath(docA, ["user", "name"], "Alice Cooper", a);

        applyDiff(docB, makeDiff(docA, deriveVersionVector(docB)));

        const user = docB.entries["user"] as { entries: Record<string, { value: string } | undefined> };
        const regB = user.entries["name"]!;
        expect(regB.value).toBe("Alice Cooper");
    });

    test("remove individual key propagates", () => {
        let a = Hlc.create("A", 0);
        const b = Hlc.create("B", 0);
        const docA = createEmpty(
            "A",
            Hlc.tick(a, () => 1)
        );
        const docB = createEmpty(
            "B",
            Hlc.tick(b, () => 1)
        );

        a = Hlc.tick(a, () => 2);
        setAtPath(docA, ["user", "name"], "Alice", a);
        applyDiff(docB, makeDiff(docA, deriveVersionVector(docB)));
        {
            const user = docB.entries["user"] as { entries: Record<string, { value: string } | undefined> };
            expect(user.entries["name"]!.value).toBe("Alice");
        }

        const vvB = deriveVersionVector(docB);
        removeAtPath(docB, ["user", "name"], vvB);
        applyDiff(docA, makeDiff(docB, deriveVersionVector(docA)));
        {
            const userA = docA.entries["user"] as { entries: Record<string, unknown> };
            expect(userA.entries["name"]).toBeUndefined();
        }
    });
});
