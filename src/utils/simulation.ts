// Enhanced simulation.ts - matches Java simulation logic
import { GraphData, NodeData } from "../services/types";

interface SimulationNode {
  id: string;
  name: string;
  value: number;
  unit: string;
}

interface SimulationEffect {
  nodeId: string;
  nodeName: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
}

interface SimulationProcess {
  name: string;
  flow: number; // duration of one full cycle in seconds
  effects: SimulationEffect[];
}

export function simulateStockGrowth(
  graph: GraphData,
  durationInSeconds: number,
  startingValues: Record<string, number>
): Record<string, number> {
  console.log("Starting enhanced simulation...");
  console.log("Duration:", durationInSeconds, "seconds");
  console.log("Starting values:", startingValues);

  // Convert GraphData to simulation format
  const nodes: SimulationNode[] = [];
  
  // Add main stock
  nodes.push({
    id: graph.stock.guid,
    name: graph.stock.name || "main_stock",
    value: startingValues[graph.stock.guid] || graph.stock.value.value,
    unit: graph.stock.value.unit
  });

  // Add related nodes
  graph.nodes.forEach(node => {
    nodes.push({
      id: node.id,
      name: node.name,
      value: startingValues[node.id] || node.value.value,
      unit: node.value.unit
    });
  });

  // Create processes from relationships
  const processes: SimulationProcess[] = [];
  
  // Process relationships from edges
  if (graph.edges && graph.edges.length > 0) {
    graph.edges.forEach((edge, index) => {
      if (edge.relationshipList && edge.relationshipList.length > 0) {
        edge.relationshipList.forEach((rel, relIndex) => {
          const processName = `Process_${index}_${relIndex}`;
          const flow = rel.flow || 12.0; // default flow time
          
          const process: SimulationProcess = {
            name: processName,
            flow: flow,
            effects: []
          };

          // From node (source) - negative effect (consumption)
          if (rel.fromName) {
            const fromNode = nodes.find(n => n.name === rel.fromName || n.id === rel.fromName);
            if (fromNode) {
              process.effects.push({
                nodeId: fromNode.id,
                nodeName: fromNode.name,
                impact: "negative",
                weight: rel.weight || 1.0
              });
            }
          }

          // To node (target) - positive effect (production)
          if (rel.toName) {
            const toNode = nodes.find(n => n.name === rel.toName || n.id === rel.toName);
            if (toNode) {
              process.effects.push({
                nodeId: toNode.id,
                nodeName: toNode.name,
                impact: rel.impact === "negative" ? "negative" : "positive",
                weight: rel.weight || 1.0
              });
            }
          }

          if (process.effects.length > 0) {
            processes.push(process);
          }
        });
      }
    });
  }

  // If no processes from edges, create from node relationships (fallback)
  if (processes.length === 0) {
    graph.nodes.forEach(node => {
      if (node.relationship) {
        const rel = node.relationship;
        const process: SimulationProcess = {
          name: `${node.name}_process`,
          flow: rel.flow || 12.0,
          effects: [{
            nodeId: node.id,
            nodeName: node.name,
            impact: rel.impact,
            weight: rel.weight
          }]
        };
        processes.push(process);
      }
    });
  }

  console.log("Created processes:", processes);

  // Run simulation using the same logic as Java
  return runSimulation(nodes, processes, durationInSeconds);
}

function runSimulation(
  nodes: SimulationNode[],
  processes: SimulationProcess[],
  totalTime: number
): Record<string, number> {
  console.log("Running simulation with processes:", processes.length);
  
  const timeStep = 1.0; // 1 second steps
  const nodeMap = new Map<string, SimulationNode>();
  
  // Initialize node map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Main simulation loop
  for (let currentTime = 0; currentTime < totalTime; currentTime += timeStep) {
    const deltas = new Map<string, number>();
    
    // Initialize deltas
    nodes.forEach(node => {
      deltas.set(node.id, 0);
    });

    // Process each process
    processes.forEach(process => {
      let maxPossibleRate = 1.0;

      // Check resource constraints for negative effects (consumption)
      for (const effect of process.effects) {
        if (effect.impact === "negative") {
          const node = nodeMap.get(effect.nodeId);
          if (!node) continue;

          const amountNeededPerSec = effect.weight / process.flow;

          // If we need resources but have none, rate is 0
          if (amountNeededPerSec > 0 && node.value <= 0) {
            maxPossibleRate = 0;
            break;
          }

          // If we don't have enough resources for full time step
          if (amountNeededPerSec > 0) {
            const secondsOfResource = node.value / amountNeededPerSec;
            if (secondsOfResource < timeStep) {
              maxPossibleRate = Math.min(maxPossibleRate, secondsOfResource / timeStep);
            }
          }
        }
      }

      // If no resources available, skip this process
      if (maxPossibleRate <= 0) {
        return;
      }

      // Apply effects
      process.effects.forEach(effect => {
        const changePerSec = effect.weight / process.flow;
        const changeThisStep = changePerSec * timeStep * maxPossibleRate;
        const currentDelta = deltas.get(effect.nodeId) || 0;

        if (effect.impact === "negative") {
          deltas.set(effect.nodeId, currentDelta - changeThisStep);
        } else if (effect.impact === "positive") {
          deltas.set(effect.nodeId, currentDelta + changeThisStep);
        }
      });
    });

    // Apply deltas to nodes
    nodes.forEach(node => {
      const delta = deltas.get(node.id) || 0;
      const nodeRef = nodeMap.get(node.id);
      if (nodeRef) {
        nodeRef.value += delta;
        // Prevent negative values
        if (nodeRef.value < 0) {
          nodeRef.value = 0;
        }
      }
    });
  }

  // Convert back to result format
  const result: Record<string, number> = {};
  nodeMap.forEach((node, id) => {
    result[id] = Math.max(0, Math.round(node.value * 100) / 100); // Round to 2 decimals
  });

  console.log("Simulation completed. Final values:", result);
  return result;
}

// Helper function to convert time units to seconds
export function convertTimeToSeconds(value: number, unit: "hours" | "days" | "weeks" | "months" | "years"): number {
  switch (unit) {
    case "hours": return value * 3600;
    case "days": return value * 86400;
    case "weeks": return value * 604800;
    case "months": return value * 2629746; // average seconds in a month
    case "years": return value * 31556952; // average seconds in a year
    default: return 0;
  }
}

// Enhanced version that matches your front-end usage
export function enhancedSimulateStockGrowth(
  graph: GraphData,
  timeValue: number,
  timeUnit: "hours" | "days" | "weeks" | "months" | "years",
  startingValues: Record<string, number>
): Record<string, number> {
  const durationInSeconds = convertTimeToSeconds(timeValue, timeUnit);
  return simulateStockGrowth(graph, durationInSeconds, startingValues);
}