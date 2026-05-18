import ELK from "elkjs";
import type { Edge, Node } from "@xyflow/react";
import type { Person } from "../services/personService";
import type { Relationship } from "../services/graphService";

const elk = new ELK();

export const PERSON_WIDTH = 150;
export const PERSON_HEIGHT = 56;
export const UNION_SIZE = 10;
const COUPLE_GAP = 40; // horizontal gap between the two spouse cards

export const getUnionId = (aId: string, bId: string) =>
  `union-${[aId, bId].sort().join("-")}`;

// A Unit is either a solo person (members.length === 1) or a couple (members.length === 2)
interface Unit {
  elkId: string;
  members: string[];
  width: number;
}

/**
 * This function groups spouses together
 */
function buildUnits(persons: Person[], relationships: Relationship[]): Unit[] {
  // Find spouse relatinships
  const spouseOf = new Map<string, string>();
  for (const r of relationships) {
    if (r.type !== "SPOUSE") continue;
    spouseOf.set(r.personAId, r.personBId);
    spouseOf.set(r.personBId, r.personAId);
  }

  const units: Unit[] = [];
  const assigned = new Set<string>();

  for (const p of persons) {
    if (assigned.has(p.id)) continue;
    const sp = spouseOf.get(p.id);

    // If person has spouse:
    if (sp && !assigned.has(sp)) {
      units.push({
        elkId: getUnionId(p.id, sp),
        members: [p.id, sp],
        width: PERSON_WIDTH * 2 + COUPLE_GAP,
      });
      assigned.add(p.id);
      assigned.add(sp);
    } else {
      units.push({ elkId: p.id, members: [p.id], width: PERSON_WIDTH });
      assigned.add(p.id);
    }
  }

  return units;
}

// Core pipeline
export async function layoutTree(
  persons: Person[],
  relationships: Relationship[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (!persons.length) return { nodes: [], edges: [] };

  // Fast person lookup
  const personById = new Map(persons.map((p) => [p.id, p]));
  // Helper for full names
  const fullName = (id: string) => {
    const p = personById.get(id)!;
    return `${p.firstName} ${p.lastName}`;
  };

  const parentRels = relationships.filter((r) => r.type === "PARENT");

  // childId → Set<parentId>
  const parentsOf = new Map<string, Set<string>>();
  for (const r of parentRels) {
    if (!parentsOf.has(r.personBId)) parentsOf.set(r.personBId, new Set());
    parentsOf.get(r.personBId)!.add(r.personAId);
  }

  const units = buildUnits(persons, relationships);
  const unitOfPerson = new Map<string, Unit>();
  for (const u of units) u.members.forEach((m) => unitOfPerson.set(m, u));

  // Deduplicated unit-level parent→child links, with which actual parents are involved
  interface UnitLink {
    parentUnit: Unit;
    childUnit: Unit;
    actualParentIds: string[];
  }
  const addedKey = new Set<string>();
  const unitLinks: UnitLink[] = [];

  for (const r of parentRels) {
    const pu = unitOfPerson.get(r.personAId);
    const cu = unitOfPerson.get(r.personBId);
    if (!pu || !cu || pu === cu) continue;

    const key = `${pu.elkId}→${cu.elkId}`;
    if (!addedKey.has(key)) {
      addedKey.add(key);
      const actualParents = pu.members.filter((m) =>
        cu.members.some((c) => parentsOf.get(c)?.has(m)),
      );
      unitLinks.push({
        parentUnit: pu,
        childUnit: cu,
        actualParentIds: actualParents,
      });
    }
  }

  //   ELK: one node per unit, one edge per unit-link
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    },
    children: units.map((u) => ({
      id: u.elkId,
      width: u.width,
      height: PERSON_HEIGHT,
    })),
    edges: unitLinks.map(({ parentUnit, childUnit }) => ({
      id: `${parentUnit.elkId}→${childUnit.elkId}`,
      sources: [parentUnit.elkId],
      targets: [childUnit.elkId],
    })),
  };

  const layout = await elk.layout(graph);

  // ELK returns top-left corner for each node
  const pos = new Map<string, { x: number; y: number }>();
  for (const n of layout.children ?? [])
    pos.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });

  // Expand units into ReactFlow nodes & edges
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  for (const unit of units) {
    const { x, y } = pos.get(unit.elkId) ?? { x: 0, y: 0 };

    if (unit.members.length === 2) {
      const [aId, bId] = unit.members;
      const unionId = getUnionId(aId, bId);
      const dotX = x + PERSON_WIDTH + COUPLE_GAP / 2 - UNION_SIZE / 2;
      const dotY = y + PERSON_HEIGHT / 2 - UNION_SIZE / 2;

      // Left spouse
      rfNodes.push({
        id: aId,
        type: "person",
        position: { x, y },
        data: { fullName: fullName(aId) },
        draggable: false,
        selectable: true,
      });

      // Right spouse - starts immediately after the union gap
      rfNodes.push({
        id: bId,
        type: "person",
        position: { x: x + PERSON_WIDTH + COUPLE_GAP, y },
        data: { fullName: fullName(bId) },
        draggable: false,
        selectable: true,
      });

      // Union dot - centred between the two spouses at the same y
      rfNodes.push({
        id: unionId,
        type: "union",
        position: { x: dotX, y: dotY },
        data: {},
        draggable: false,
        selectable: false,
      });

      // Spouse lines: personA.right → union.l  and  union.r → personB.left
      rfEdges.push({
        id: `${unionId}-a`,
        source: aId,
        target: unionId,
        sourceHandle: "right",
        targetHandle: "l",
        type: "straight",
        style: { stroke: "#aaa", strokeWidth: 1.5 },
        selectable: false,
      });
      rfEdges.push({
        id: `${unionId}-b`,
        source: unionId,
        target: bId,
        sourceHandle: "r",
        targetHandle: "left",
        type: "straight",
        style: { stroke: "#aaa", strokeWidth: 1.5 },
        selectable: false,
      });
    } else {
      const [pid] = unit.members;
      rfNodes.push({
        id: pid,
        type: "person",
        position: { x, y },
        data: { fullName: fullName(pid) },
        draggable: false,
        selectable: true,
      });
    }
  }

  //   Parent-child edges
  for (const { parentUnit, childUnit, actualParentIds } of unitLinks) {
    // Source: union dot when both spouses are parents. specific person otherwise
    const sourceId =
      parentUnit.members.length === 2 && actualParentIds.length === 2
        ? getUnionId(parentUnit.members[0], parentUnit.members[1])
        : (actualParentIds[0] ?? parentUnit.members[0]);

    // Target: the specific person in the child unit who is actually recorded
    // as a child of one of the parents - never the union dot.
    const targetId =
      childUnit.members.find((m) =>
        actualParentIds.some((pid) => parentsOf.get(m)?.has(pid)),
      ) ?? childUnit.members[0];

    rfEdges.push({
      id: `pc-${parentUnit.elkId}-${childUnit.elkId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "smoothstep",
      style: { stroke: "#555", strokeWidth: 1.5 },
      selectable: false,
    });
  }

  return { nodes: rfNodes, edges: rfEdges };
}
