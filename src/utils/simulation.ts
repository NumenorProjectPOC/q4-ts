// utils/simulation.ts
import { GraphData } from "../services/types";

type TimeUnit = "hours" | "days" | "weeks" | "months" | "years";

type Relation = {
  fromId: string;
  toId: string;
  sign: -1 | 0 | 1;
  weight: number;
  flow: number; // "time constant" in same chosen unit (acts like delay)
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const stepsPerUnit = (unit: TimeUnit) => {
  switch (unit) {
    case "years": return 12;   // monthly steps
    case "months": return 4;   // weekly steps
    case "weeks": return 7;    // daily steps
    case "days": return 24;    // hourly steps
    case "hours": return 60;   // minute steps
    default: return 12;
  }
};

// Heuristic: keep weights stable even if backend sends "10 / 100 / 1000" style weights.
const normalizeWeight = (w: number) => {
  const a = Math.abs(w);
  if (a >= 100) return w / 1000; // 100 -> 0.1
  if (a >= 10) return w / 100;   // 10  -> 0.1
  if (a > 1) return w / 10;      // 2   -> 0.2
  return w;                       // 0.5 stays 0.5
};

function buildIdResolvers(graph: GraphData) {
  const nameToId = new Map<string, string>();
  const ids = new Set<string>();

  ids.add(graph.stock.guid);
  nameToId.set(graph.stock.name, graph.stock.guid);

  graph.nodes.forEach((n) => {
    ids.add(n.id);
    nameToId.set(n.name, n.id);
  });

  const resolveId = (key?: string | null) => {
    if (!key) return undefined;
    if (ids.has(key)) return key;
    const direct = nameToId.get(key);
    if (direct) return direct;

    // case-insensitive fallback
    const lower = key.toLowerCase();
    for (const [name, id] of nameToId.entries()) {
      if (name.toLowerCase() === lower) return id;
    }
    return undefined;
  };

  return { resolveId, ids };
}

function extractRelations(graph: GraphData): Relation[] {
  const { resolveId } = buildIdResolvers(graph);
  const rels: Relation[] = [];

  (graph.edges ?? []).forEach((edge) => {
    (edge.relationshipList ?? []).forEach((r) => {
      const fromId = resolveId((r as any).fromName);
      const toId = resolveId((r as any).toName);
      if (!fromId || !toId || fromId === toId) return;

      const impact = (r as any).impact as "positive" | "negative" | "neutral" | undefined;
      const sign: -1 | 0 | 1 =
        impact === "negative" ? -1 : impact === "positive" ? 1 : 0;

      let weight = Number((r as any).weight ?? 0);
      let flow = Number((r as any).flow ?? 1);

      if (!Number.isFinite(weight)) weight = 0;
      if (!Number.isFinite(flow) || flow <= 0) flow = 1;

      weight = normalizeWeight(weight);

      rels.push({ fromId, toId, sign, weight, flow });
    });
  });

  return rels;
}

function buildBaseValues(graph: GraphData, startingValues: Record<string, number>) {
  const base: Record<string, number> = {};
  base[graph.stock.guid] = startingValues[graph.stock.guid] ?? graph.stock.value.value;

  graph.nodes.forEach((n) => {
    base[n.id] = startingValues[n.id] ?? n.value.value;
  });

  // If center node is not included inside graph.nodes (some models do this), still ensure it exists
  if (base[graph.stock.guid] == null) {
    base[graph.stock.guid] = graph.stock.value.value;
  }

  return base;
}

// Keep this helper (you already export it)
export function convertTimeToSeconds(value: number, unit: TimeUnit): number {
  switch (unit) {
    case "hours": return value * 3600;
    case "days": return value * 86400;
    case "weeks": return value * 604800;
    case "months": return value * 2629746;
    case "years": return value * 31556952;
    default: return 0;
  }
}

// ✅ Main entry used by GraphComponent
export function enhancedSimulateStockGrowth(
  graph: GraphData,
  timeValue: number,
  timeUnit: TimeUnit,
  startingValues: Record<string, number>
): Record<string, number> {
  const relations = extractRelations(graph);
  const base = buildBaseValues(graph, startingValues);

  // Start from the latest values (from startingValues)
  let current: Record<string, number> = { ...base };

  // no time => no change
  if (!timeValue || timeValue <= 0 || relations.length === 0) {
    return Object.fromEntries(Object.entries(current).map(([k, v]) => [k, Math.round(v * 100) / 100]));
  }

  const perUnit = stepsPerUnit(timeUnit);
  const stepsRaw = Math.max(1, Math.round(timeValue * perUnit));
  const steps = Math.min(240, stepsRaw); // cap for speed
  const dt = timeValue / steps; // dt in "timeUnit"

  for (let s = 0; s < steps; s++) {
    const deltas: Record<string, number> = {};

    // accumulate deltas from all edges using the CURRENT values
    for (const rel of relations) {
      if (rel.sign === 0 || rel.weight === 0) continue;

      const src = current[rel.fromId] ?? 0;
      const tgt = current[rel.toId] ?? 0;

      // rate per unit time: (weight * source) / flow
      const rate = (rel.sign * rel.weight * src) / Math.max(1e-6, rel.flow);

      // apply for dt
      let delta = rate * dt;

      // stability clamp: max 20% change per step (prevents runaway explosions)
      const maxDelta = Math.max(Math.abs(tgt) * 0.2, 1e-6);
      delta = clamp(delta, -maxDelta, maxDelta);

      deltas[rel.toId] = (deltas[rel.toId] ?? 0) + delta;
    }

    // apply deltas
    for (const [id, d] of Object.entries(deltas)) {
      const next = (current[id] ?? 0) + d;
      current[id] = next < 0 ? 0 : next;
    }
  }

  // round
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(current)) out[id] = Math.round(v * 100) / 100;
  return out;
}
