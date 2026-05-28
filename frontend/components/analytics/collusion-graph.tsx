import { useEffect, useState } from "react";
import { Users, Building, ShieldAlert, Award } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "company" | "director" | "address";
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  type: "director" | "address";
}

interface CollusionGraphProps {
  nodes: Node[];
  links: Link[];
  hasCollusion: boolean;
}

export function CollusionGraph({ nodes: initialNodes, links: initialLinks, hasCollusion }: CollusionGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Run a quick, resilient force-directed layout simulation in React state
  useEffect(() => {
    const width = 600;
    const height = 400;

    // Deep clone nodes and assign initial random positions
    const tempNodes = initialNodes.map((n, i) => ({
      ...n,
      x: width / 2 + Math.cos((i / initialNodes.length) * 2 * Math.PI) * 120 + (Math.random() - 0.5) * 20,
      y: height / 2 + Math.sin((i / initialNodes.length) * 2 * Math.PI) * 120 + (Math.random() - 0.5) * 20,
    }));

    // Simulating simple attraction/repulsion forces for 50 iterations
    for (let iter = 0; iter < 60; iter++) {
      // 1. Repulsion force between all node pairs
      for (let i = 0; i < tempNodes.length; i++) {
        for (let j = i + 1; j < tempNodes.length; j++) {
          const n1 = tempNodes[i];
          const n2 = tempNodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.type === "company" ? 140 : 100;

          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.15;
            n1.x! -= dx * force;
            n1.y! -= dy * force;
            n2.x! += dx * force;
            n2.y! += dy * force;
          }
        }
      }

      // 2. Attraction force along link edges
      for (const link of initialLinks) {
        const sourceNode = tempNodes.find((n) => n.id === link.source);
        const targetNode = tempNodes.find((n) => n.id === link.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!;
          const dy = targetNode.y! - sourceNode.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const strength = 0.08;

          sourceNode.x! += dx * strength;
          sourceNode.y! += dy * strength;
          targetNode.x! -= dx * strength;
          targetNode.y! -= dy * strength;
        }
      }

      // 3. Gravity center force to keep everything inside bounds
      for (const n of tempNodes) {
        n.x! += (width / 2 - n.x!) * 0.03;
        n.y! += (height / 2 - n.y!) * 0.03;
      }
    }

    setNodes(tempNodes);
  }, [initialNodes, initialLinks]);

  const getConnectedNodeIds = (nodeId: string) => {
    const connected = new Set<string>([nodeId]);
    for (const link of initialLinks) {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    }
    return connected;
  };

  const activeConnectedIds = hoveredNode ? getConnectedNodeIds(hoveredNode) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-[#f9f9f9] border border-[#ebebeb] rounded-[10px]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${hasCollusion ? "bg-[#ff385c]/10" : "bg-[#10b981]/10"}`}>
            <ShieldAlert className={`w-5 h-5 ${hasCollusion ? "text-[#ff385c]" : "text-[#10b981]"}`} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-[#222222]">
              {hasCollusion ? "Corporate Overlay & Collusion Flags Detected" : "No Shell Overlays Found"}
            </h4>
            <p className="text-[12px] text-[#6a6a6a]">
              {hasCollusion 
                ? "Bidders exhibit high correlation via director DIN identities and registered addresses."
                : "Competitors verified against MCA21 registry with zero overlapping parameters."}
            </p>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px] border border-[#ebebeb] bg-[#fafafa] rounded-[14px] overflow-hidden flex items-center justify-center shadow-inner">
        {/* Graph Legends */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-[#ebebeb] p-3 rounded-[8px] space-y-1.5 text-[11px] shadow-sm z-10">
          <div className="flex items-center gap-2 font-bold text-[#222222] mb-1">Graph Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <span className="text-[#6a6a6a] font-medium">Bidding Company</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="text-[#6a6a6a] font-medium">Registered Director</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
            <span className="text-[#6a6a6a] font-medium">Corporate Office Address</span>
          </div>
        </div>

        <svg className="w-full h-full" viewBox="0 0 600 400">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Render links */}
          {initialLinks.map((link, idx) => {
            const sNode = nodes.find((n) => n.id === link.source);
            const tNode = nodes.find((n) => n.id === link.target);

            if (!sNode || !tNode) return null;

            const isHighlighted =
              !hoveredNode ||
              (hoveredNode && (link.source === hoveredNode || link.target === hoveredNode));

            return (
              <line
                key={idx}
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={isHighlighted ? (link.type === "director" ? "#10b981" : "#8b5cf6") : "#ebebeb"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={link.type === "address" ? "4,4" : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isDimmed = hoveredNode && !activeConnectedIds?.has(node.id);

            let color = "#3b82f6";
            let Icon = Award;
            if (node.type === "director") {
              color = "#10b981";
              Icon = Users;
            } else if (node.type === "address") {
              color = "#8b5cf6";
              Icon = Building;
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ opacity: isDimmed ? 0.35 : 1 }}
              >
                <circle
                  r={node.type === "company" ? 22 : 16}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  filter="url(#shadow)"
                  className="transition-all duration-300"
                />
                <g transform="translate(-8, -8)" className="text-white pointer-events-none">
                  <Icon className="w-4 h-4" />
                </g>
                <text
                  y={node.type === "company" ? 38 : 30}
                  textAnchor="middle"
                  fill="#222222"
                  className={`text-[9px] font-bold select-none transition-all duration-300 ${isHovered ? "fill-[#ff385c] scale-105" : ""}`}
                >
                  {node.label.length > 22 ? node.label.substring(0, 20) + "..." : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
