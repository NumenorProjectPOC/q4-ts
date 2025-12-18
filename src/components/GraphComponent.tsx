import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, LinkData } from '../services/types';
import { formatLargeNumber, formatStockName } from '../utils/utility';
import { Loader, RotateCcw } from 'lucide-react';
import { enhancedSimulateStockGrowth } from '../utils/simulation';

const TWC = {
  brand: {
    primary: {
      '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db',
      '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151',
      '800': '#1f2937', '900': '#111827', '950': '#0f172a'
    },
    secondary: {
      '50': '#ffffff', '100': '#fefefe', '200': '#fcfcfc', '300': '#f8f8f8',
      '400': '#f4f4f4', '500': '#f0f0f0', '600': '#e8e8e8', '700': '#d8d8d8',
      '800': '#c0c0c0', '900': '#a8a8a8', '950': '#edede9'
    },
    dark: { '950': '#250902' }
  },
  neutral: {
    '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4',
    '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040',
    '800': '#262626', '900': '#171717', '950': '#0a0a0a'
  },
  accent: {
    red: {
      '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5',
      '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c',
      '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a'
    }
  },
  success: {
    '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac',
    '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d',
    '800': '#166534', '900': '#14532d', '950': '#052e16'
  },
  warning: {
    '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
    '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
    '800': '#92400e', '900': '#78350f', '950': '#451a03'
  },
  error: {
    '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5',
    '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c',
    '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a'
  }
} as const;

type NodeTheme = {
  useGradients: boolean;
  gradients?: Array<{ start: string; end: string; accent: string; mid?: string }>;
  fills?: string[];
  centerFillSolid?: string;
  centerRingColor?: string;
  useGlow?: boolean;
  nodeBorder: (isDark: boolean) => { color: string; width: number };
  centerBorder: (isDark: boolean) => { color: string; width: number };
  ringWidth: number;
  ringOpacity: number;
  ringColors?: string[];
  valueText: (isDark: boolean) => string;
};

const NODE_THEMES: Record<string, NodeTheme> = {
  'realistic-dark': {
    useGradients: false,
    fills: ['#4DD0E1', '#26C6DA', '#00ACC1', '#0097A7', '#00838F', '#006064'],
    centerFillSolid: '#FF5722',
    centerRingColor: '#5DD5D5',
    nodeBorder: () => ({ color: '#5DD5D5', width: 2 }),
    centerBorder: () => ({ color: '#5DD5D5', width: 2.5 }),
    ringWidth: 1.2,
    ringOpacity: 0.8,
    ringColors: ['#5DD5D5', '#4DD0E1', '#26C6DA'],
    valueText: () => '#FFFFFF'
  },
  'realistic-light': {
    useGradients: false,
    fills: ['#FFF3E0', '#FFECB3', '#FFE0B2', '#FFCCBC', '#FFAB91', '#FF8A65'],
    centerFillSolid: '#C62828',
    centerRingColor: '#D32F2F',
    nodeBorder: () => ({ color: '#D32F2F', width: 2 }),
    centerBorder: () => ({ color: '#B71C1C', width: 2.5 }),
    ringWidth: 1.1,
    ringOpacity: 0.9,
    ringColors: ['#D32F2F', '#F44336', '#FF5722'],
    valueText: () => '#2E2E2E'
  },
  'brand-dark-minimal': {
    useGradients: false,
    fills: ['#374151', '#4B5563', '#6B7280', '#1F2937', '#9CA3AF', '#111827'],
    centerFillSolid: '#0F172A',
    centerRingColor: '#EF4444',
    nodeBorder: () => ({ color: '#FFFFFF', width: 2 }),
    centerBorder: () => ({ color: '#FFFFFF', width: 2.5 }),
    ringWidth: 1.1,
    ringOpacity: 0.9,
    ringColors: ['#D8D8D8', '#C0C0C0', '#F0F0F0', '#E8E8E8'],
    valueText: () => '#FFFFFF'
  },
  'brand-light-minimal': {
    useGradients: false,
    fills: ['#A8A8A8', '#C0C0C0', '#D8D8D8', '#525252', '#737373', '#E8E8E8'],
    centerFillSolid: '#EDEDE9',
    centerRingColor: '#DC2626',
    nodeBorder: () => ({ color: '#0F172A', width: 2 }),
    centerBorder: () => ({ color: '#0F172A', width: 2.5 }),
    ringWidth: 1.15,
    ringOpacity: 0.85,
    ringColors: ['#D1D5DB', '#E5E7EB', '#D4D4D4', '#9CA3AF'],
    valueText: () => '#111827'
  },
  'brand-gradient': {
    useGradients: true,
    gradients: [
      { start: '#374151', end: '#111827', accent: '#FCFCFC', mid: '#6B7280' },
      { start: '#4B5563', end: '#1F2937', accent: '#FEFEFE', mid: '#9CA3AF' },
      { start: '#6B7280', end: '#374151', accent: '#F8F8F8', mid: '#9CA3AF' },
      { start: '#1F2937', end: '#0F172A', accent: '#FCFCFC', mid: '#374151' },
      { start: '#9CA3AF', end: '#374151', accent: '#FFFFFF', mid: '#6B7280' },
      { start: '#374151', end: '#0F172A', accent: '#F8F8F8', mid: '#4B5563' }
    ],
    nodeBorder: (isDark) => ({ color: isDark ? '#FFFFFF' : '#0F172A', width: 1.5 }),
    centerBorder: (isDark) => ({ color: isDark ? '#FFFFFF' : '#0F172A', width: 2 }),
    ringWidth: 0.9,
    ringOpacity: 0.6,
    valueText: () => '#FFFFFF'
  }
};

type NodeColorThemeName =
  | 'realistic-dark'
  | 'realistic-light'
  | 'brand-auto'
  | 'brand-dark-minimal'
  | 'brand-light-minimal'
  | 'brand-gradient';

interface GraphComponentProps {
  graphData: GraphData | null;
  selectedElement: NodeData | LinkData | null;
  setSelectedElement: (element: NodeData | LinkData | null) => void;
  sidebarWidth: number;
  nodeValueChangeCallback: (nodeId: string, newValue: number) => void;
  simulationSettings: { value: number; timeUnit: string };
  simulationValue: number;
  runSimulation: boolean;
  isLoading: boolean;
  isDarkMode?: boolean;
  nodeTheme?: NodeColorThemeName;
  onSimulationComplete?: (values: Record<string, number>) => void;
}

const NODE_POSITIONS_KEY = 'nodePositions';
const USER_PINNED_KEY = 'userPinnedNodes';
const ZOOM_KEY = 'zoomTransform';

const loadPositions = (): Record<string, { x: number; y: number }> => {
  try { return JSON.parse(localStorage.getItem(NODE_POSITIONS_KEY) || '{}'); } catch { return {}; }
};
const savePositions = (map: Record<string, { x: number; y: number }>) => {
  localStorage.setItem(NODE_POSITIONS_KEY, JSON.stringify(map));
};
const loadUserPinned = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(USER_PINNED_KEY) || '{}'); } catch { return {}; }
};
const saveUserPinned = (map: Record<string, boolean>) => {
  localStorage.setItem(USER_PINNED_KEY, JSON.stringify(map));
};

const GraphComponent: React.FC<GraphComponentProps> = ({
  isLoading,
  graphData,
  selectedElement,
  setSelectedElement,
  sidebarWidth,
  nodeValueChangeCallback,
  simulationSettings,
  simulationValue,
  runSimulation,
  isDarkMode = false,
  onSimulationComplete,
  nodeTheme = 'realistic-dark'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomStateRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const committedRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [initialRender, setInitialRender] = useState(true);

  const animatedValuesRef = useRef(animatedValues);

  const [positionsStable, setPositionsStable] = useState(false);
  const [userPinned, setUserPinned] = useState<Record<string, boolean>>(() => loadUserPinned());

  const resolvedNodeTheme: Exclude<NodeColorThemeName, 'brand-auto'> =
    (nodeTheme === 'brand-auto'
      ? (isDarkMode ? 'realistic-dark' : 'realistic-light')
      : nodeTheme) as Exclude<NodeColorThemeName, 'brand-auto'>;

  const activeTheme: NodeTheme = useMemo(
    () => NODE_THEMES[resolvedNodeTheme],
    [resolvedNodeTheme]
  );

  const calculateStablePositions = useCallback((nodes: NodeData[], width: number, height: number) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const nonCenterNodes = nodes.filter((n: any) => !(n as any).isCenter);
    const angleStep = (2 * Math.PI) / Math.max(nonCenterNodes.length, 1);
    const radius = Math.min(width, height) * 0.3;

    nodes.forEach((node) => {
      const isCenter = (node as any).isCenter;
      if (isCenter) {
        positions[node.id] = { x: width / 2, y: height / 2 };
      } else {
        const idx = nonCenterNodes.indexOf(node);
        const angle = idx * angleStep;
        positions[node.id] = {
          x: (width / 2) + Math.cos(angle) * radius,
          y: (height / 2) + Math.sin(angle) * radius
        };
      }
    });
    return positions;
  }, []);

  useEffect(() => {
    animatedValuesRef.current = animatedValues;
  }, [animatedValues]);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => { try { ro.disconnect(); } catch { } };
  }, []);

  const nodes: NodeData[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.map(n => ({ ...n, isCenter: n.id === graphData.stock.guid })) as any[];
  }, [graphData]);

  const links = useMemo(() => {
    if (!graphData?.edges || !graphData?.nodes) return [];
    const nameToId = new Map<string, string>();
    graphData.nodes.forEach((n) => nameToId.set(n.name, n.id));
    const d3Links = graphData.edges.map((edge) => {
      if (!edge.relationshipList?.length) return null;
      const first = edge.relationshipList[0];
      const s = nameToId.get(first.fromName);
      const t = nameToId.get(first.toName);
      if (!s || !t) return null;
      return { ...edge, source: s, target: t };
    });
    return d3Links.filter(Boolean) as (LinkData & { source: string; target: string })[];
  }, [graphData]);

  useEffect(() => {
  if (!graphData) return;

  // Don't override the animation while simulation is running
  if (isAnimatingRef.current) return;

  const values: Record<string, number> = {};
  graphData.nodes.forEach((n) => {
    values[n.id] = n.value.value;
  });
  values[graphData.stock.guid] = graphData.stock.value.value;

  setAnimatedValues(values);
}, [graphData]);


  useEffect(() => {
    if (!graphData || !containerDimensions.width) return;
    const storedPositionsRaw = localStorage.getItem(NODE_POSITIONS_KEY);

    if (!storedPositionsRaw && nodes.length > 0) {
      const positions = calculateStablePositions(nodes, containerDimensions.width, containerDimensions.height);
      savePositions(positions);
      setPositionsStable(true);
    } else if (storedPositionsRaw) {
      try {
        const positions = JSON.parse(storedPositionsRaw);
        const ok = nodes.every(n => positions[n.id]);
        setPositionsStable(ok);
        if (!ok) {
          const p = calculateStablePositions(nodes, containerDimensions.width, containerDimensions.height);
          savePositions(p);
          setPositionsStable(true);
        }
      } catch {
        const p = calculateStablePositions(nodes, containerDimensions.width, containerDimensions.height);
        savePositions(p);
        setPositionsStable(true);
      }
    }
    setUserPinned(loadUserPinned());
  }, [graphData, nodes, containerDimensions, calculateStablePositions]);

  useEffect(() => {
    if (!graphData || !nodes.length) return;
    const map: Record<string, string> = {};
    nodes.forEach((node, index) => {
      if (activeTheme.useGradients) {
        map[node.id] = (node as any).isCenter ? 'url(#centerGradient)' : `url(#nodeGradient${index % (activeTheme.gradients?.length || 1)})`;
      } else {
        const list = activeTheme.fills || ['#94a3b8'];
        const fi = index % list.length;
        map[node.id] = (node as any).isCenter ? (activeTheme.centerFillSolid || list[0]) : list[fi];
      }
    });
    setNodeColors(map);
    localStorage.setItem('nodeColors', JSON.stringify(map));
  }, [nodes, graphData, activeTheme]);

  function getFontSize(text: string, radius: number, maxFont: number, minFont: number) {
    const size = Math.floor((radius * 2) / Math.max(text.length, 1) * 1.2) + 5;
    return `${Math.max(minFont, Math.min(maxFont, size))}px`;
  }

  useEffect(() => {
    if (!graphData || !svgRef.current || containerDimensions.width === 0 || links.length === 0) return;

    const width = containerDimensions.width;
    const height = containerDimensions.height;
    const nodeRadius = 35;
    const centerNodeRadius = 45;
    const dragThresholdPx = 5;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        zoomStateRef.current = event.transform;
        g.attr('transform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
        localStorage.setItem(ZOOM_KEY, JSON.stringify({ x: event.transform.x, y: event.transform.y, k: event.transform.k }));
      });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom as any);

    const savedZoomRaw = localStorage.getItem(ZOOM_KEY);
    if (savedZoomRaw) {
      try {
        const t = JSON.parse(savedZoomRaw);
        const transform = d3.zoomIdentity.translate(t.x, t.y).scale(t.k);
        zoomStateRef.current = transform;
        g.attr('transform', `translate(${t.x},${t.y}) scale(${t.k})`);
        svg.call(zoom.transform as any, transform);
      } catch { /* ignore */ }
    }

    const edgeColor = d3.scaleOrdinal<string>()
      .domain(['positive', 'negative', 'neutral'])
      .range(isDarkMode ? [TWC.success['400'], TWC.error['400'], TWC.neutral['400']]
        : [TWC.success['600'], TWC.error['600'], TWC.neutral['500']]);

    const defs = svg.append('defs');

    if (activeTheme.useGradients) {
      const centerGradient = defs.append('radialGradient')
        .attr('id', 'centerGradient').attr('cx', '40%').attr('cy', '30%').attr('r', '80%');
      centerGradient.append('stop').attr('offset', '0%').attr('stop-color', TWC.accent.red['100']).attr('stop-opacity', 0.9);
      centerGradient.append('stop').attr('offset', '40%').attr('stop-color', TWC.accent.red['500']).attr('stop-opacity', 1);
      centerGradient.append('stop').attr('offset', '100%').attr('stop-color', TWC.accent.red['700']).attr('stop-opacity', 1);

      (activeTheme.gradients || []).forEach((grad, index) => {
        const nodeGradient = defs.append('radialGradient')
          .attr('id', `nodeGradient${index}`).attr('cx', '40%').attr('cy', '30%').attr('r', '80%');
        nodeGradient.append('stop').attr('offset', '0%').attr('stop-color', grad.accent).attr('stop-opacity', 0.8);
        nodeGradient.append('stop').attr('offset', '50%').attr('stop-color', grad.mid || grad.end).attr('stop-opacity', 1);
        nodeGradient.append('stop').attr('offset', '100%').attr('stop-color', grad.start).attr('stop-opacity', 1);
      });
    }

    ['positive', 'negative', 'neutral'].forEach((impact) => {
      const color = edgeColor(impact);
      defs.append('marker')
        .attr('id', `arrowhead-${impact}`)
        .attr('viewBox', '-2 -8 12 16')
        .attr('refX', 8).attr('refY', 0).attr('orient', 'auto')
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('markerUnits', 'strokeWidth')
        .append('path').attr('d', 'M 0,-6 L 10,0 L 0,6 Z')
        .attr('fill', color).attr('stroke', color).attr('stroke-width', 1);

      defs.append('marker')
        .attr('id', `arrowhead-start-${impact}`)
        .attr('viewBox', '-2 -8 12 16')
        .attr('refX', 2).attr('refY', 0).attr('orient', 'auto')
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('markerUnits', 'strokeWidth')
        .append('path').attr('d', 'M 10,-6 L 0,0 L 10,6 Z')
        .attr('fill', color).attr('stroke', color).attr('stroke-width', 1);
    });

    const dropShadow = defs.append('filter')
      .attr('id', 'drop-shadow').attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    dropShadow.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3);
    dropShadow.append('feOffset').attr('dx', 0).attr('dy', 2).attr('result', 'offsetblur');
    const feComponentTransfer = dropShadow.append('feComponentTransfer');
    feComponentTransfer.append('feFuncA').attr('type', 'linear').attr('slope', 0.25);
    const dsMerge = dropShadow.append('feMerge');
    dsMerge.append('feMergeNode');
    dsMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const glow = defs.append('filter')
      .attr('id', 'glow-filter').attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const stored = loadPositions();
    (nodes as any[]).forEach(n => {
      const sp = stored[n.id];
      if (sp) {
        n.x = sp.x; n.y = sp.y; n.fx = sp.x; n.fy = sp.y;
      } else {
        if ((n as any).isCenter) {
          n.x = width / 2; n.y = height / 2; n.fx = n.x; n.fy = n.y;
        } else {
          const nonCenter = nodes.filter((m: any) => !m.isCenter);
          const idx = nonCenter.indexOf(n);
          const angle = (2 * Math.PI) * (idx / Math.max(nonCenter.length, 1));
          const r = Math.min(width, height) * 0.3;
          const x = width / 2 + Math.cos(angle) * r;
          const y = height / 2 + Math.sin(angle) * r;
          n.x = x; n.y = y; n.fx = x; n.fy = y;
        }
      }
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(120).strength(0.1))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.06))
      .force('collision', d3.forceCollide((d: any) => (d.isCenter ? centerNodeRadius : nodeRadius) + 15))
      .alphaDecay(0.1)
      .velocityDecay(0.8);

    const boundsForce = (() => {
      let local: any[] = [];
      const pad = 60;
      function force(alpha: number) {
        const minX = pad, minY = pad;
        const maxX = width - pad, maxY = height - pad;
        for (const n of local) {
          if (n.x < minX) n.vx += (minX - n.x) * 0.1 * alpha;
          if (n.x > maxX) n.vx += (maxX - n.x) * 0.1 * alpha;
          if (n.y < minY) n.vy += (minY - n.y) * 0.1 * alpha;
          if (n.y > maxY) n.vy += (maxY - n.y) * 0.1 * alpha;
        }
      }
      (force as any).initialize = (nl: any[]) => { local = nl; };
      return force as d3.Force<NodeData, any>;
    })();
    simulation.force('bounds', boundsForce);

    let currentDraggingId: string | null = null;
    const enforcePinned = (() => {
      let local: any[] = [];
      function force() {
        for (const n of local) {
          const pos = loadPositions()[n.id];
          if (userPinned[n.id] && n.id !== currentDraggingId && pos) {
            n.fx = pos.x; n.fy = pos.y;
            n.x = pos.x; n.y = pos.y;
          }
        }
      }
      (force as any).initialize = (nl: any[]) => { local = nl; };
      return force as d3.Force<NodeData, any>;
    })();
    simulation.force('enforcePinned', enforcePinned);

    simulationRef.current = simulation;

    if (positionsStable) {
      simulation.alpha(0);
      setTimeout(() => simulation.stop(), 50);
    } else {
      simulation.on('end', () => {
        const positions: Record<string, { x: number; y: number }> = {};
        (nodes as any[]).forEach(n => {
          if (n.x != null && n.y != null) {
            positions[n.id] = { x: n.x, y: n.y };
            n.fx = n.x; n.fy = n.y;
          }
        });
        savePositions(positions);
        setPositionsStable(true);
      });
      setTimeout(() => {
        if (simulation.alpha() > 0) {
          const positions: Record<string, { x: number; y: number }> = {};
          (nodes as any[]).forEach(n => {
            if (n.x != null && n.y != null) {
              positions[n.id] = { x: n.x, y: n.y };
              n.fx = n.x; n.fy = n.y;
            }
          });
          savePositions(positions);
          simulation.stop();
          setPositionsStable(true);
        }
      }, 2000);
    }

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => edgeColor(d.relationshipList?.[0]?.impact))
      .attr('stroke-width', 2)
      .attr('opacity', isDarkMode ? 0.8 : 0.7)
      .attr('class', 'link')
      .style('cursor', 'pointer')
      .attr('marker-end', (d: any) => `url(#arrowhead-${d.relationshipList?.[0]?.impact || 'neutral'})`)
      .attr('marker-start', (d: any) => d.isBidirectional
        ? `url(#arrowhead-start-${d.relationshipList?.[1]?.impact || d.relationshipList?.[0]?.impact || 'neutral'})`
        : null as any)
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        setSelectedElement({ ...d, relationshipList: d.relationshipList ?? [], isBidirectional: d.isBidirectional ?? false });
      });

    const nodeBorder = activeTheme.nodeBorder(!!isDarkMode);
    const centerBorder = activeTheme.centerBorder(!!isDarkMode);
    const nodeFilterStyle = activeTheme.useGlow ? 'url(#glow-filter)' : 'url(#drop-shadow)';

    const centerGroup = g.append('g')
      .selectAll('g')
      .data(nodes.filter((d: any) => d.isCenter))
      .join('g')
      .style('cursor', 'pointer');

    centerGroup.append('circle')
      .attr('r', centerNodeRadius)
      .attr('fill', (d: any) => nodeColors[d.id])
      .attr('stroke', centerBorder.color)
      .attr('stroke-width', centerBorder.width)
      .style('filter', nodeFilterStyle)
      .attr('opacity', 1);

    centerGroup.append('circle')
      .attr('r', centerNodeRadius + 1)
      .attr('fill', 'none')
      .attr('stroke', activeTheme.centerRingColor ?? TWC.accent.red['500'])
      .attr('stroke-width', 1)
      .attr('opacity', 0.4);

    centerGroup.append('circle')
      .attr('r', centerNodeRadius)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        const currentVal = animatedValuesRef.current[d.id] ?? d.value.value;
        setSelectedElement({ ...d, value: { ...d.value, value: currentVal } });
      });

    const nodeGroups = g.append('g')
      .selectAll('g')
      .data(nodes.filter((d: any) => !d.isCenter))
      .join('g')
      .style('cursor', 'pointer');

    nodeGroups.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d: any) => nodeColors[d.id])
      .attr('stroke', nodeBorder.color)
      .attr('stroke-width', nodeBorder.width)
      .style('filter', nodeFilterStyle)
      .attr('opacity', 1);

    nodeGroups.append('circle')
      .attr('r', nodeRadius + 0.5)
      .attr('fill', 'none')
      .attr('stroke', (d: any, i: number) => {
        if (activeTheme.useGradients && activeTheme.gradients?.length) {
          const gi = i % activeTheme.gradients.length;
          return activeTheme.gradients[gi].accent;
        }
        if (activeTheme.ringColors?.length) {
          return activeTheme.ringColors[i % activeTheme.ringColors.length];
        }
        return isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
      })
      .attr('stroke-width', activeTheme.ringWidth)
      .attr('opacity', activeTheme.ringOpacity);

    nodeGroups.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        const currentVal = animatedValuesRef.current[d.id] ?? d.value.value;
        setSelectedElement({ ...d, value: { ...d.value, value: currentVal } });
      });

    const labelColor = isDarkMode ? TWC.brand.secondary['50'] : TWC.brand.primary['900'];

    const getValueSize = (text: string, r: number) => getFontSize(text, r - 6, 13, 8);
    const getCenterValueSize = (text: string, r: number) => getFontSize(text, r - 8, 15, 10);

    centerGroup.each(function (d: any) {
      const group = d3.select(this);
      const name = formatStockName(d.name);
      const valueText = formatLargeNumber(animatedValues[d.id] ?? d.value.value, 2);

      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('class', 'node-value')
        .style('fontFamily', 'Inter, system-ui, -apple-system, sans-serif')
        .style('fill', activeTheme.valueText(!!isDarkMode))
        .style('font-weight', '800')
        .style('font-size', getCenterValueSize(valueText, centerNodeRadius))
        .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)')
        .text(valueText)
        .append('title').text(`${valueText} ${d.value.unit}`);

      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', centerNodeRadius + 16)
        .attr('class', 'node-name')
        .style('fontFamily', 'Inter, system-ui, -apple-system, sans-serif')
        .style('fill', labelColor)
        .style('font-weight', '700')
        .style('font-size', '13px')
        .style('text-shadow', `1px 1px 3px ${isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`)
        .text(name);
    });

    nodeGroups.each(function (d: any) {
      const group = d3.select(this);
      const name = formatStockName(d.name);
      const valueText = formatLargeNumber(animatedValues[d.id] ?? d.value.value, 2);

      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('class', 'node-value')
        .style('fontFamily', 'Inter, system-ui, -apple-system, sans-serif')
        .style('fill', activeTheme.valueText(!!isDarkMode))
        .style('font-weight', '800')
        .style('font-size', getValueSize(valueText, nodeRadius))
        .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)')
        .text(valueText)
        .append('title').text(`${valueText} ${d.value.unit}`);

      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', nodeRadius + 14)
        .attr('class', 'node-name')
        .style('fontFamily', 'Inter, system-ui, -apple-system, sans-serif')
        .style('fill', labelColor)
        .style('font-weight', '600')
        .style('font-size', '11px')
        .style('text-shadow', `1px 1px 3px ${isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`)
        .text(name);
    });

    nodeGroups.on('mouseenter', function () {
      d3.select(this).select('circle:first-child')
        .transition().duration(200)
        .attr('stroke-width', nodeBorder.width + 0.5)
        .attr('r', nodeRadius + 2)
        .style('filter', 'url(#glow-filter)');
    }).on('mouseleave', function () {
      d3.select(this).select('circle:first-child')
        .transition().duration(200)
        .attr('stroke-width', nodeBorder.width)
        .attr('r', nodeRadius)
        .style('filter', nodeFilterStyle);
    });

    centerGroup.on('mouseenter', function () {
      d3.select(this).select('circle:first-child')
        .transition().duration(200)
        .attr('stroke-width', centerBorder.width + 1)
        .attr('r', centerNodeRadius + 2)
        .style('filter', 'url(#glow-filter)');
    }).on('mouseleave', function () {
      d3.select(this).select('circle:first-child')
        .transition().duration(200)
        .attr('stroke-width', centerBorder.width)
        .attr('r', centerNodeRadius)
        .style('filter', nodeFilterStyle);
    });

    const dragPoint = { x: 0, y: 0 };
    const dragRepel = (() => {
      let locals: any[] = [];
      const radius = 150;
      const base = 2.0;
      function force(alpha: number) {
        if (!currentDraggingId) return;
        for (const n of locals) {
          if ((n as any).isCenter || n.id === currentDraggingId) continue;
          if (userPinned[n.id]) continue;
          const dx = n.x - dragPoint.x;
          const dy = n.y - dragPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          if (dist < radius) {
            const t = 1 - dist / radius;
            const k = base * t * alpha;
            n.vx += (dx / dist) * k;
            n.vy += (dy / dist) * k;
          }
        }
      }
      (force as any).initialize = (nl: any[]) => { locals = nl; };
      return force as d3.Force<NodeData, any>;
    })();

    // The ideal link distance, consistent with the main link force, acting as a "leash".
    const initialLinkDistance = 120;
    const leashForce = ((alpha: number) => {
      if (!currentDraggingId) return;
      const draggedNode = (nodes as any[]).find(n => n.id === currentDraggingId);
      if (!draggedNode) return;

      for (const link of links as any[]) {
        const isSourceDragged = link.source.id === currentDraggingId;
        const isTargetDragged = link.target.id === currentDraggingId;

        if (!isSourceDragged && !isTargetDragged) continue;

        const otherNode = isSourceDragged ? link.target : link.source;

        // This is the core logic:
        // If the other node is pinned by the user, do nothing. This allows the edge to stretch.
        // If the other node is NOT pinned, apply a strong "spring" force to drag it along.
        if (userPinned[otherNode.id]) {
          continue;
        }

        const dx = otherNode.x - draggedNode.x;
        const dy = otherNode.y - draggedNode.y;
        const distance = Math.hypot(dx, dy) || 1e-6; // Use 1e-6 to prevent division by zero

        // This force tries to restore the link to its initial distance, making the unpinned cluster
        // move along with the dragged node.
        const difference = distance - initialLinkDistance;

        // The strength of the pull/push is proportional to the difference.
        // A strength of 0.8 makes it a very strong, rigid connection during the drag.
        const pullFactor = (difference / distance) * alpha * 0.8;

        // Apply the corrective force to the other node's velocity.
        otherNode.vx -= dx * pullFactor;
        otherNode.vy -= dy * pullFactor;
      }
    }) as d3.Force<NodeData, any>;

    const toGraphCoords = (ev: any) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const p = d3.pointer(ev, svgRef.current);
      const t = zoomStateRef.current || d3.zoomIdentity;
      return { x: (p[0] - t.x) / t.k, y: (p[1] - t.y) / t.k };
    };

    const beginGroupDrag = (draggedId: string) => {
      (nodes as any[]).forEach((n: any) => {
        if (n.id !== draggedId && !userPinned[n.id]) {
          n.fx = null;
          n.fy = null;
        }
      });
      simulation.force('dragRepel', dragRepel);
      simulation.force('leash', leashForce);
      simulation.force('center', null);
      simulation.force('charge', d3.forceManyBody().strength(-110));
      simulation.alphaTarget(0.3).restart();
    };

    const persistAfterDrop = (draggedId: string) => {
      const positions = loadPositions();
      (nodes as any[]).forEach((n: any) => {
        n.fx = n.x;
        n.fy = n.y;
        positions[n.id] = { x: n.x, y: n.y };
      });
      const up = { ...loadUserPinned(), [draggedId]: true };
      saveUserPinned(up);
      setUserPinned(up);
      savePositions(positions);

      simulation.force('dragRepel', null);
      simulation.force('leash', null);
      simulation.force('center', d3.forceCenter(width / 2, height / 2).strength(0.06));
      simulation.force('charge', d3.forceManyBody().strength(-300));
      simulation.alphaTarget(0).stop();
    };

    const cancelDragNoMove = () => {
      simulation.alphaTarget(0);
    };

    const drag = d3.drag<any, any>()
      .filter((event: any) => !event.button && !event.ctrlKey && !event.metaKey && !event.altKey)
      .on('start', (event: any, d: any) => {
        currentDraggingId = d.id;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;

        const pt = toGraphCoords(event.sourceEvent || event);
        (d as any).__dragStart__ = { x: pt.x, y: pt.y };
        (d as any).__groupDragActive__ = false;
      })
      .on('drag', (event: any, d: any) => {
        const pt = toGraphCoords(event.sourceEvent || event);

        if (!(d as any).__groupDragActive__) {
          const s = (d as any).__dragStart__;
          const dx = pt.x - s.x;
          const dy = pt.y - s.y;
          if (Math.hypot(dx, dy) >= dragThresholdPx) {
            (d as any).__groupDragActive__ = true;
            beginGroupDrag(d.id);
          }
        }

        d.fx = pt.x;
        d.fy = pt.y;
        dragPoint.x = pt.x;
        dragPoint.y = pt.y;
      })
      .on('end', (event: any, d: any) => {
        currentDraggingId = null;
        if (!event.active) simulation.alphaTarget(0);

        const moved = !!(d as any).__groupDragActive__;
        if (moved) {
          persistAfterDrop(d.id);
        } else {
          d.fx = null;
          d.fy = null;
          cancelDragNoMove();
        }
        delete (d as any).__dragStart__;
        delete (d as any).__groupDragActive__;
      });

    nodeGroups.call(drag as any);
    centerGroup.call(drag as any);

    const safe = (v: any, fallback: number) => (Number.isFinite(v) ? v : fallback);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => {
          const sx = safe(d.source.x, width / 2), sy = safe(d.source.y, height / 2);
          const tx = safe(d.target.x, width / 2), ty = safe(d.target.y, height / 2);
          const dx = tx - sx, dy = ty - sy;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const r = d.source.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
          return sx + (dx / dist) * r;
        })
        .attr('y1', (d: any) => {
          const sx = safe(d.source.x, width / 2), sy = safe(d.source.y, height / 2);
          const tx = safe(d.target.x, width / 2), ty = safe(d.target.y, height / 2);
          const dx = tx - sx, dy = ty - sy;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const r = d.source.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
          return sy + (dy / dist) * r;
        })
        .attr('x2', (d: any) => {
          const sx = safe(d.source.x, width / 2), sy = safe(d.source.y, height / 2);
          const tx = safe(d.target.x, width / 2), ty = safe(d.target.y, height / 2);
          const dx = tx - sx, dy = ty - sy;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const r = d.target.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
          return tx - (dx / dist) * r;
        })
        .attr('y2', (d: any) => {
          const sx = safe(d.source.x, width / 2), sy = safe(d.source.y, height / 2);
          const tx = safe(d.target.x, width / 2), ty = safe(d.target.y, height / 2);
          const dx = tx - sx, dy = ty - sy;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const r = d.target.isCenter ? centerNodeRadius + 2 : nodeRadius + 2;
          return ty - (dy / dist) * r;
        });

      nodeGroups.attr('transform', (d: any) => `translate(${safe(d.x, width / 2)},${safe(d.y, height / 2)})`);
      centerGroup.attr('transform', (d: any) => `translate(${safe(d.x, width / 2)},${safe(d.y, height / 2)})`);
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, nodes, links, containerDimensions, isDarkMode, activeTheme, positionsStable, userPinned, setSelectedElement]);

  // --- Simulation & Animation Logic ---
  useEffect(() => {
    if (initialRender) { setInitialRender(false); return; }
    if (!graphData || !runSimulation) return;

    isAnimatingRef.current = true;
    committedRef.current = false;

    const startValues = nodes.reduce((acc, node) => {
      acc[node.id] = (node as any).value.value;
      return acc;
    }, {} as Record<string, number>);

    // ensure center exists
    if (startValues[graphData.stock.guid] == null) {
      startValues[graphData.stock.guid] = graphData.stock.value.value;
    }

    const runCalculation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));

      const simulationResults = enhancedSimulateStockGrowth(
        graphData,
        simulationValue,
        simulationSettings.timeUnit as any,
        startValues
      );

      const startTime = performance.now();
      const duration = 2000;

      const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = ease(progress);

        const newValues = nodes.reduce((acc, node) => {
          const start = startValues[node.id] ?? 0;
          const target = simulationResults[node.id] ?? start;
          acc[node.id] = start + (target - start) * eased;
          return acc;
        }, {} as Record<string, number>);

        // include center too
        if (newValues[graphData.stock.guid] == null) {
          const start = startValues[graphData.stock.guid] ?? 0;
          const target = simulationResults[graphData.stock.guid] ?? start;
          newValues[graphData.stock.guid] = start + (target - start) * eased;
        }

        setAnimatedValues(newValues);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // ✅ persist results back to parent
          if (!committedRef.current) {
            committedRef.current = true;
            isAnimatingRef.current = false;
            onSimulationComplete?.(simulationResults);
          }
        }
      };

      requestAnimationFrame(animate);
    };

    runCalculation();
  }, [runSimulation, simulationValue, simulationSettings, graphData, nodes, onSimulationComplete]);



  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll('.node-value')
      .each(function (d: any) {
        const el = d3.select(this);
        // Get current value
        const v = animatedValues[d.id];
        const finalVal = v !== undefined ? Number(v) : Number(d.value.value);
        const formattedVal = formatLargeNumber(finalVal, 2);

        // 1. Update the visible text number
        el.text(formattedVal);

        // 2. Update the Tooltip (Title) to show Value + Unit
        // We remove the old title and append a new one to ensure it updates
        el.select('title').remove();
        el.append('title').text(`${formattedVal} ${d.value.unit}`);
      });
  }, [animatedValues]);

  const resetNodePositions = useCallback(() => {
    localStorage.removeItem(NODE_POSITIONS_KEY);
    localStorage.removeItem(USER_PINNED_KEY);
    localStorage.removeItem(ZOOM_KEY);
    setUserPinned({});
    setPositionsStable(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
        : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
        }`}
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <Loader className={`w-10 h-10 animate-spin ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`font-bold animate-pulse ${isDarkMode ? 'text-white80' : 'text-neutral-600'}`}>
            Loading Visualization...
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          <button
            onClick={resetNodePositions}
            className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            style={{ display: 'none' }}
          >
            Reset Layout
          </button>

          <div className="absolute inset-0">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ cursor: 'grab' }}
            />
          </div>

          <div className="absolute top-6 right-6 z-10">
            <button
              onClick={() => {
                if (zoomBehaviorRef.current && svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  svg.transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
                  zoomStateRef.current = d3.zoomIdentity;
                  localStorage.removeItem(ZOOM_KEY);
                }
              }}
              className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg group border backdrop-blur-sm ${isDarkMode
                ? 'bg-slate-800/90 border-slate-700/50 text-white/80 hover:bg-slate-700/90 hover:text-white'
                : 'bg-white/90 border-neutral-200/60 text-neutral-600 hover:bg-white hover:text-neutral-900'
                }`}
              title="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(GraphComponent);