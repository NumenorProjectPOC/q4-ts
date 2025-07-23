import { GraphData } from "../services/types";

export function simulateStockGrowth(
  graph: GraphData,
  durationInSeconds: number,
  startingValues: Record<string, number>
): Record<string, number> {
  const result = { ...startingValues };

  const targets = graph.nodes;

  for (const target of targets) {
    const rel = target.relationship;
    if (!rel) continue;

    const flow = rel.flow;
    const weight = rel.weight;
    const impactMultiplier = rel.impact === "positive" ? 1 : -1;

    const operations = durationInSeconds / flow;
    const delta = operations * weight * impactMultiplier;

    const current = result[target.id] ?? target.value.value;
    result[target.id] = current + delta;
  }

  return result;
}
