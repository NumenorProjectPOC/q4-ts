/* components/InteractiveBackground.tsx */
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  targetX: number;
  targetY: number;
  size: number;
  opacity: number;
  connected: number[];
  type: 'hub' | 'node' | 'endpoint';
  wanderAngle: number;
  wanderSpeed: number;
  pulsePhase: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  opacity: number;
  size: number;
}

interface InteractiveBackgroundProps {
  nodeCount?: number;
  maxConnections?: number;
  cursorInfluence?: number;
  className?: string;
}

const InteractiveBackground = ({ 
  nodeCount = 75,
  maxConnections = 4,
  cursorInfluence = 200,
  className = ""
}: InteractiveBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationTime = useRef(0);
  
  // Mouse tracking
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 60, damping: 15 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 60, damping: 15 });

  // Initialize nodes with adjusted sizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
    
    const newNodes: Node[] = [];
    
    // Create zones for better distribution
    const zones = [
      // Center zone (40% of nodes) - most concentrated
      { weight: 0.4, centerX: 0.5, centerY: 0.5, spreadX: 0.3, spreadY: 0.25 },
      // Left zone (15% of nodes)
      { weight: 0.15, centerX: 0.2, centerY: 0.5, spreadX: 0.25, spreadY: 0.6 },
      // Right zone (15% of nodes)
      { weight: 0.15, centerX: 0.8, centerY: 0.5, spreadX: 0.25, spreadY: 0.6 },
      // Top zone (15% of nodes)
      { weight: 0.15, centerX: 0.5, centerY: 0.2, spreadX: 0.6, spreadY: 0.25 },
      // Bottom zone (15% of nodes)
      { weight: 0.15, centerX: 0.5, centerY: 0.8, spreadX: 0.6, spreadY: 0.25 }
    ];
    
    for (let i = 0; i < nodeCount; i++) {
      // Select zone based on weights
      let cumulativeWeight = 0;
      const random = Math.random();
      let selectedZone = zones[0];
      
      for (const zone of zones) {
        cumulativeWeight += zone.weight;
        if (random <= cumulativeWeight) {
          selectedZone = zone;
          break;
        }
      }
      
      // Generate position in selected zone
      let x, y;
      let attempts = 0;
      do {
        const centerX = rect.width * selectedZone.centerX;
        const centerY = rect.height * selectedZone.centerY;
        const spreadX = rect.width * selectedZone.spreadX;
        const spreadY = rect.height * selectedZone.spreadY;
        
        x = centerX + (Math.random() - 0.5) * spreadX;
        y = centerY + (Math.random() - 0.5) * spreadY;
        attempts++;
      } while (
        // Avoid login form area but be less restrictive
        attempts < 10 &&
        x > rect.width * 0.4 && x < rect.width * 0.6 &&
        y > rect.height * 0.4 && y < rect.height * 0.6
      );
      
      // Ensure nodes stay within bounds
      x = Math.max(20, Math.min(rect.width - 20, x));
      y = Math.max(20, Math.min(rect.height - 20, y));
      
      // Adjusted sizes - smaller red hubs
      const type = i < 18 ? 'hub' : i < 50 ? 'node' : 'endpoint';
      
      newNodes.push({
        id: i,
        x,
        y,
        originalX: x,
        originalY: y,
        targetX: x,
        targetY: y,
        size: type === 'hub' ? 5 : type === 'node' ? 3 : 1.8, // Reduced hub size from 7 to 5
        opacity: type === 'hub' ? 0.9 : type === 'node' ? 0.7 : 0.5,
        connected: [],
        type,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 0.1 + Math.random() * 0.25,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    // Create connections with increased range for better connectivity
    newNodes.forEach(node => {
      const candidates = newNodes
        .filter(other => other.id !== node.id && node.connected.length < maxConnections)
        .map(other => ({
          node: other,
          distance: Math.sqrt(
            Math.pow(node.originalX - other.originalX, 2) + 
            Math.pow(node.originalY - other.originalY, 2)
          )
        }))
        .filter(({ distance }) => distance < 400)
        .sort((a, b) => a.distance - b.distance);
      
      // Connect to closest available nodes
      const connections = candidates.slice(0, maxConnections);
      node.connected = connections.map(c => c.node.id);
    });
    
    setNodes(newNodes);
  }, [nodeCount, maxConnections]);

  // Generate shooting stars with larger sizes
  useEffect(() => {
    const generateShootingStar = () => {
      if (!dimensions.width || !dimensions.height) return;
      
      const isHorizontal = Math.random() > 0.5;
      let startX, startY, endX, endY;
      
      if (isHorizontal) {
        startX = Math.random() > 0.5 ? -50 : dimensions.width + 50;
        startY = Math.random() * dimensions.height;
        endX = startX < 0 ? dimensions.width + 50 : -50;
        endY = startY + (Math.random() - 0.5) * 200;
      } else {
        startX = Math.random() * dimensions.width;
        startY = Math.random() > 0.5 ? -50 : dimensions.height + 50;
        endX = startX + (Math.random() - 0.5) * 200;
        endY = startY < 0 ? dimensions.height + 50 : -50;
      }
      
      const newStar: ShootingStar = {
        id: Date.now() + Math.random(),
        startX,
        startY,
        endX,
        endY,
        progress: 0,
        speed: 0.8 + Math.random() * 0.4,
        opacity: 0.4 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 2 // Increased size from 1-2.5 to 2.5-4.5
      };
      
      setShootingStars(prev => [...prev.slice(-4), newStar]); // Keep max 5 stars
    };
    
    const interval = setInterval(generateShootingStar, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [dimensions]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Animation loop
  useAnimationFrame((time) => {
    if (!nodes.length) return;
    
    animationTime.current = time * 0.001;
    const currentMouseX = smoothMouseX.get();
    const currentMouseY = smoothMouseY.get();
    
    // Update nodes
    setNodes(prevNodes => 
      prevNodes.map(node => {
        // Wandering motion
        node.wanderAngle += (Math.random() - 0.5) * 0.05;
        const wanderRadius = node.type === 'hub' ? 18 : node.type === 'node' ? 15 : 12; // Slightly reduced for smaller hubs
        const wanderX = Math.cos(node.wanderAngle + animationTime.current * node.wanderSpeed) * wanderRadius;
        const wanderY = Math.sin(node.wanderAngle + animationTime.current * node.wanderSpeed) * wanderRadius;
        
        let baseX = node.originalX + wanderX;
        let baseY = node.originalY + wanderY;
        
        // Cursor interaction
        const distanceFromMouse = Math.sqrt(
          Math.pow(node.x - currentMouseX, 2) + Math.pow(node.y - currentMouseY, 2)
        );
        
        if (distanceFromMouse < cursorInfluence) {
          const angle = Math.atan2(node.y - currentMouseY, node.x - currentMouseX);
          const force = (cursorInfluence - distanceFromMouse) / cursorInfluence;
          const pushDistance = force * (node.type === 'hub' ? 50 : 35); // Adjusted for smaller hubs
          
          node.targetX = baseX + Math.cos(angle) * pushDistance;
          node.targetY = baseY + Math.sin(angle) * pushDistance;
        } else {
          node.targetX = baseX;
          node.targetY = baseY;
        }
        
        // Smooth movement
        const moveSpeed = node.type === 'hub' ? 0.03 : node.type === 'node' ? 0.05 : 0.07;
        node.x += (node.targetX - node.x) * moveSpeed;
        node.y += (node.targetY - node.y) * moveSpeed;
        
        // Keep within bounds
        const margin = 15;
        node.x = Math.max(margin, Math.min(dimensions.width - margin, node.x));
        node.y = Math.max(margin, Math.min(dimensions.height - margin, node.y));
        
        return { ...node };
      })
    );
    
    // Update shooting stars
    setShootingStars(prev => prev
      .map(star => ({
        ...star,
        progress: star.progress + star.speed * 0.01
      }))
      .filter(star => star.progress < 1)
    );
  });

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* Clean white background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Network visualization */}
      <svg 
        width={dimensions.width} 
        height={dimensions.height}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Dynamic connections */}
        {nodes.map(node => 
          node.connected.map(connectedId => {
            const connectedNode = nodes.find(n => n.id === connectedId);
            if (!connectedNode) return null;
            
            const distance = Math.sqrt(
              Math.pow(node.x - connectedNode.x, 2) + 
              Math.pow(node.y - connectedNode.y, 2)
            );
            
            const maxDistance = 300;
            const baseOpacity = Math.max(0, (maxDistance - distance) / maxDistance);
            const typeMultiplier = (node.type === 'hub' || connectedNode.type === 'hub') ? 0.4 : 0.2;
            const opacity = baseOpacity * typeMultiplier;
            
            if (opacity < 0.03) return null;
            
            return (
              <motion.line
                key={`${node.id}-${connectedId}`}
                x1={node.x}
                y1={node.y}
                x2={connectedNode.x}
                y2={connectedNode.y}
                stroke={node.type === 'hub' || connectedNode.type === 'hub' ? "rgb(239, 68, 68)" : "rgb(148, 163, 184)"}
                strokeWidth={node.type === 'hub' || connectedNode.type === 'hub' ? "1.5" : "0.8"}
                opacity={opacity}
                animate={{
                  x1: node.x,
                  y1: node.y,
                  x2: connectedNode.x,
                  y2: connectedNode.y,
                }}
                transition={{ duration: 0 }}
              />
            );
          })
        )}
        
        {/* Regular data flow particles - slightly larger */}
        {nodes.filter(node => node.type === 'hub').map((hubNode, index) => 
          hubNode.connected.slice(0, 2).map((connectedId, connIndex) => {
            const connectedNode = nodes.find(n => n.id === connectedId);
            if (!connectedNode) return null;
            
            return (
              <motion.circle
                key={`flow-${hubNode.id}-${connectedId}`}
                r="2" // Increased from 1.5 to 2
                fill="rgb(239, 68, 68)"
                opacity="0.6"
                animate={{
                  cx: [hubNode.x, connectedNode.x, hubNode.x],
                  cy: [hubNode.y, connectedNode.y, hubNode.y],
                }}
                transition={{
                  duration: 2.5 + connIndex * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3 + connIndex * 0.15
                }}
              />
            );
          })
        )}
        
        {/* Shooting stars as moving dots only (no trails) */}
        {shootingStars.map(star => {
          const currentX = star.startX + (star.endX - star.startX) * star.progress;
          const currentY = star.startY + (star.endY - star.startY) * star.progress;
          const fadeOpacity = star.progress < 0.1 ? star.progress * 10 : 
                             star.progress > 0.9 ? (1 - star.progress) * 10 : 1;
          
          return (
            <motion.circle
              key={star.id}
              cx={currentX}
              cy={currentY}
              r={star.size} // Now ranges from 2.5 to 4.5
              fill="rgb(176, 174, 174)"
              opacity={star.opacity * fadeOpacity}
            />
          );
        })}
        
        {/* Nodes with adjusted sizes */}
        {nodes.map(node => (
          <motion.g key={node.id}>
            {/* Hub glow - adjusted for smaller hubs */}
            {node.type === 'hub' && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size + 3} // Reduced from +4 to +3
                fill="rgb(239, 68, 68)"
                opacity={0.12}
                animate={{
                  cx: node.x,
                  cy: node.y,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  cx: { duration: 0 },
                  cy: { duration: 0 },
                  scale: { 
                    duration: 2 + Math.random() * 0.8, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            )}
            
            {/* Main node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={
                node.type === 'hub' 
                  ? "rgb(239, 68, 68)"
                  : node.type === 'node' 
                    ? "rgb(71, 85, 105)" 
                    : "rgb(148, 163, 184)"
              }
              opacity={node.opacity}
              animate={{
                cx: node.x,
                cy: node.y,
              }}
              transition={{ duration: 0 }}
            />
            
            {/* Hub center - slightly smaller */}
            {node.type === 'hub' && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="0.8" // Reduced from 1 to 0.8
                fill="white"
                opacity="0.8"
                animate={{
                  cx: node.x,
                  cy: node.y,
                }}
                transition={{ duration: 0 }}
              />
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

export default InteractiveBackground;
