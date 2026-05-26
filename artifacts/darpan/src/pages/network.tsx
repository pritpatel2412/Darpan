import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Users, Building, ShieldAlert, Layers, Info, Filter, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
  id: string;
  type: "contractor" | "official" | "department";
  name: string;
  designation?: string;
  flaggedValue: number;
  fraudScore: number;
  flagCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: "won_from" | "approved" | "shared_director";
  weight: number;
  tenderIds: string[];
}

export default function CorruptionNetwork() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [simulationTick, setSimulationTick] = useState(0);
  
  // Dragging states
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG dimensions
  const width = 800;
  const height = 550;

  const simNodesRef = useRef<Node[]>([]);

  useEffect(() => {
    fetch("/api/network/graph")
      .then((res) => res.json())
      .then((data) => {
        // Initialize positions in a circle around the center
        const initializedNodes = data.nodes.map((node: any, idx: number) => {
          const angle = (idx / data.nodes.length) * 2 * Math.PI;
          const radius = 150 + Math.random() * 50;
          return {
            ...node,
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
          };
        });

        simNodesRef.current = initializedNodes;
        setNodes(initializedNodes);
        setEdges(data.edges || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching network graph:", err);
        setLoading(false);
      });
  }, []);

  // Simple pure React force-directed simulation
  useEffect(() => {
    if (loading || edges.length === 0) return;

    let animFrameId: number;
    const repulsion = 800; // Repulsion constant
    const springLength = 120; // Target link length
    const springStrength = 0.05; // Attraction constant
    const damping = 0.8; // Damping constant
    const gravity = 0.03; // Attraction to center

    const runSimulationStep = () => {
      if (simNodesRef.current.length === 0) {
        animFrameId = requestAnimationFrame(runSimulationStep);
        return;
      }

      // Copy nodes from ref for force calculation
      const currentNodes = simNodesRef.current.map(node => ({ ...node }));

      // 1. Repulsion between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const u = currentNodes[i];
          const v = currentNodes[j];
          const dx = (u.x || 0) - (v.x || 0);
          const dy = (u.y || 0) - (v.y || 0);
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;

          const force = repulsion / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          u.vx = (u.vx || 0) + fx;
          u.vy = (u.vy || 0) + fy;
          v.vx = (v.vx || 0) - fx;
          v.vy = (v.vy || 0) - fy;
        }
      }

      // 2. Attraction along edges
      edges.forEach(edge => {
        const sourceNode = currentNodes.find(x => x.id === edge.source);
        const targetNode = currentNodes.find(x => x.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const dx = (sourceNode.x || 0) - (targetNode.x || 0);
        const dy = (sourceNode.y || 0) - (targetNode.y || 0);
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) dist = 1;

        const displacement = dist - springLength;
        const force = displacement * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        sourceNode.vx = (sourceNode.vx || 0) - fx;
        sourceNode.vy = (sourceNode.vy || 0) - fy;
        targetNode.vx = (targetNode.vx || 0) + fx;
        targetNode.vy = (targetNode.vy || 0) + fy;
      });

      // 3. Center gravity and update positions
      currentNodes.forEach(node => {
        if (node.id === draggedNode) return; // Keep dragged node at cursor

        const dx = width / 2 - (node.x || 0);
        const dy = height / 2 - (node.y || 0);
        node.vx = (node.vx || 0) + dx * gravity;
        node.vy = (node.vy || 0) + dy * gravity;

        node.vx *= damping;
        node.vy *= damping;

        // Speed limit
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        const maxSpeed = 8;
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }

        node.x = (node.x || 0) + node.vx;
        node.y = (node.y || 0) + node.vy;

        node.x = Math.max(40, Math.min(width - 40, node.x));
        node.y = Math.max(40, Math.min(height - 40, node.y));
      });

      simNodesRef.current = currentNodes;
      setNodes(currentNodes);
      setSimulationTick(prev => prev + 1);

      animFrameId = requestAnimationFrame(runSimulationStep);
    };

    animFrameId = requestAnimationFrame(runSimulationStep);
    return () => cancelAnimationFrame(animFrameId);
  }, [loading, edges, draggedNode]);

  // Mouse drag handlers
  const handleMouseDown = (nodeId: string) => {
    setDraggedNode(nodeId);
    const matched = nodes.find(n => n.id === nodeId);
    if (matched) setSelectedNode(matched);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * height;

    simNodesRef.current = simNodesRef.current.map(node => {
      if (node.id === draggedNode) {
        return { ...node, x: mouseX, y: mouseY, vx: 0, vy: 0 };
      }
      return node;
    });
    setNodes([...simNodesRef.current]);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleReset = () => {
    simNodesRef.current = simNodesRef.current.map((node, idx) => {
      const angle = (idx / simNodesRef.current.length) * 2 * Math.PI;
      const radius = 150 + Math.random() * 50;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    setNodes([...simNodesRef.current]);
  };

  const getFilteredNodes = () => {
    if (filterType === "all") return nodes;
    return nodes.filter(n => n.type === filterType);
  };

  // Node styles
  const getNodeColor = (node: Node) => {
    if (node.id === selectedNode?.id) return "#ff385c";
    switch (node.type) {
      case "contractor": return "#f59e0b"; // Orange/Yellow
      case "official": return "#3b82f6"; // Blue
      case "department": return "#10b981"; // Emerald
    }
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case "contractor": return <Building className="w-3.5 h-3.5 text-white" />;
      case "official": return <Users className="w-3.5 h-3.5 text-white" />;
      case "department": return <Layers className="w-3.5 h-3.5 text-white" />;
    }
  };

  return (
    <MainLayout title="Corruption Network" subtitle="Interactive multi-signal collusion graph tracking corporate & administrative overlays">
      <div className="space-y-6">
        
        {/* Top explanation panel */}
        <div className="bg-gradient-to-r from-[#18181b] to-[#27272a] text-white rounded-[14px] p-5 flex items-start gap-4 border border-[#2d2d30] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff385c]/8 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 rounded-[10px] bg-[#ff385c]/10 border border-[#ff385c]/20 flex items-center justify-center flex-shrink-0 text-[#ff385c]">
            <Share2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[14.5px] uppercase tracking-wide flex items-center gap-2">
              Collusion Network Visualizer
              <span className="text-[9px] font-black text-rose-500 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live HUD Active</span>
            </h3>
            <p className="text-[12.5px] text-[#a1a1aa] leading-relaxed">
              Procurement collusion thrives in relationships. Below is the multi-layered structural representation mapping linkages between **Contractors (Orange Circles)**, **Approving Officials (Blue Squares)**, and **Procuring Ministries (Green Hexagons)**. Drag nodes to inspect corporate alignments, director overlaps, and approval velocities.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Skeleton className="col-span-2 h-[550px] rounded-[18px]" />
            <Skeleton className="h-[550px] rounded-[18px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            
            {/* SVG Interactive Canvas */}
            <div className="xl:col-span-2 flex flex-col bg-white border border-[#ebebeb] rounded-[18px] shadow-sm overflow-hidden p-5 relative">
              {/* Floating controls */}
              <div className="absolute top-8 left-8 z-10 flex gap-2">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white/80 border border-[#ebebeb] rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-[#222222] focus:outline-none focus:border-[#ff385c] backdrop-blur-md shadow-sm cursor-pointer"
                >
                  <option value="all">Inspect All Nodes</option>
                  <option value="contractor">Contractors Only</option>
                  <option value="official">Officials Only</option>
                  <option value="department">Ministries Only</option>
                </select>

                <button 
                  onClick={handleReset}
                  className="bg-white/80 border border-[#ebebeb] rounded-[8px] p-2 hover:bg-white text-[#6a6a6a] hover:text-[#ff385c] transition-colors backdrop-blur-md shadow-sm flex items-center justify-center"
                  title="Recenter simulation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Legends overlay */}
              <div className="absolute bottom-8 left-8 z-10 bg-white/80 border border-[#ebebeb] rounded-[10px] p-3 text-[11px] font-bold space-y-1.5 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#3f3f3f]">Contractor (Bidder)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#3b82f6] rounded-[2px]" />
                  <span className="text-[#3f3f3f]">Approver (Official)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 12 14">
                    <polygon points="6,0 12,3.5 12,10.5 6,14 0,10.5 0,3.5" className="fill-[#10b981]" />
                  </svg>
                  <span className="text-[#3f3f3f] ml-1">Department (Ministry)</span>
                </div>
              </div>

              {/* Canvas SVG */}
              <div className="border border-[#ebebeb] rounded-[12px] overflow-hidden bg-[#fafafa]">
                <svg
                  ref={svgRef}
                  width="100%"
                  height={height}
                  viewBox={`0 0 ${width} ${height}`}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="select-none cursor-grab active:cursor-grabbing"
                >
                  {/* Grid background */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ebebeb" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Relationship Links */}
                  <g>
                    {edges.map((edge, idx) => {
                      const sourceNode = nodes.find(n => n.id === edge.source);
                      const targetNode = nodes.find(n => n.id === edge.target);
                      if (!sourceNode || !targetNode) return null;

                      const isSelected = selectedNode && (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);
                      
                      let strokeColor = "#dddddd";
                      let strokeWidth = 1.5;
                      let dashArray = "";

                      if (edge.type === "approved") {
                        strokeColor = "#3b82f6";
                        strokeWidth = 2;
                      } else if (edge.type === "shared_director") {
                        strokeColor = "#ff385c";
                        strokeWidth = 3.5;
                      } else {
                        dashArray = "4, 4";
                        strokeColor = "#f59e0b";
                      }

                      return (
                        <line
                          key={`edge-${idx}`}
                          x1={sourceNode.x || 0}
                          y1={sourceNode.y || 0}
                          x2={targetNode.x || 0}
                          y2={targetNode.y || 0}
                          stroke={isSelected ? "#ff385c" : strokeColor}
                          strokeWidth={isSelected ? strokeWidth * 1.5 : strokeWidth}
                          strokeDasharray={dashArray}
                          opacity={selectedNode ? (isSelected ? 1.0 : 0.2) : 0.75}
                          className="transition-all duration-300"
                        />
                      );
                    })}
                  </g>

                  {/* Node circles/shapes */}
                  <g>
                    {getFilteredNodes().map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const hasConnection = selectedNode && edges.some(e => 
                        (e.source === node.id && (e.target === selectedNode.id)) ||
                        (e.target === node.id && (e.source === selectedNode.id))
                      );
                      
                      const isDimmed = selectedNode && !isSelected && !hasConnection;
                      const size = node.type === "department" ? 22 : node.type === "official" ? 18 : 16;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x || 0}, ${node.y || 0})`}
                          onMouseDown={() => handleMouseDown(node.id)}
                          className="cursor-pointer"
                          opacity={isDimmed ? 0.35 : 1}
                        >
                          {/* Outer glowing aura */}
                          {isSelected && (
                            <circle
                              r={size + 8}
                              fill="none"
                              stroke="#ff385c"
                              strokeWidth="2.5"
                              className="animate-ping opacity-60"
                            />
                          )}

                          {/* Node Core Geometry */}
                          {node.type === "department" ? (
                            // Hexagon
                            <polygon
                              points="0,-24 20,-12 20,12 0,24 -20,12 -20,-12"
                              fill="#10b981"
                              stroke={isSelected ? "#ff385c" : "#047857"}
                              strokeWidth={isSelected ? 3 : 1.5}
                              className="transition-colors duration-200"
                            />
                          ) : node.type === "official" ? (
                            // Rounded Square
                            <rect
                              x={-size}
                              y={-size}
                              width={size * 2}
                              height={size * 2}
                              rx="6"
                              fill="#3b82f6"
                              stroke={isSelected ? "#ff385c" : "#1d4ed8"}
                              strokeWidth={isSelected ? 3 : 1.5}
                              className="transition-colors duration-200"
                            />
                          ) : (
                            // Contractor Circle
                            <circle
                              r={size}
                              fill="#f59e0b"
                              stroke={isSelected ? "#ff385c" : "#b45309"}
                              strokeWidth={isSelected ? 3 : 1.5}
                              className="transition-colors duration-200"
                            />
                          )}

                          {/* Mini icon embed */}
                          <g transform="translate(-7, -7)">
                            {getNodeIcon(node)}
                          </g>

                          {/* Hover Text Label */}
                          <text
                            y={size + 14}
                            textAnchor="middle"
                            fill="#222222"
                            className="text-[10px] font-black pointer-events-none filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                          >
                            {node.name.length > 15 ? `${node.name.slice(0, 15)}…` : node.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            {/* Collateral Side Panel */}
            <div className="flex flex-col">
              <div className="bg-white border border-[#ebebeb] rounded-[18px] p-6 shadow-sm flex flex-col justify-between h-full relative">
                <AnimatePresence mode="wait">
                  {!selectedNode ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center text-[#aaaaaa] p-6 space-y-3"
                    >
                      <Info className="w-12 h-12 text-[#dddddd]" />
                      <p className="text-[13px] font-bold">Inspect Node Linkages</p>
                      <p className="text-[12px] text-[#6a6a6a] max-w-[220px]">
                        Click on any actor inside the network graph (contractors, officials, or procuring departments) to retrieve their collusive profiling overlays.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="selected-state"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="space-y-6 flex-1"
                    >
                      {/* Node Header */}
                      <div className="border-b border-[#f7f7f7] pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedNode.type === "department" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            selectedNode.type === "official" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {selectedNode.type}
                          </span>

                          <span className="text-[12px] font-extrabold text-[#ff385c] flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {selectedNode.fraudScore} Risk Rating
                          </span>
                        </div>

                        <h3 className="font-extrabold text-[16px] text-[#222222] leading-snug">
                          {selectedNode.name}
                        </h3>

                        {selectedNode.designation && (
                          <p className="text-[12px] text-[#6a6a6a] font-mono leading-none">{selectedNode.designation}</p>
                        )}
                      </div>

                      {/* Financial Exposure details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[#f7f7f7] rounded-[10px] border border-[#ebebeb]/50">
                          <p className="text-[10px] font-extrabold text-[#8a8a8a] uppercase tracking-wide">Rigged Contracts</p>
                          <p className="text-[16px] font-extrabold text-[#ff385c] mt-1">{selectedNode.flagCount} bids</p>
                        </div>
                        <div className="p-3 bg-[#f7f7f7] rounded-[10px] border border-[#ebebeb]/50">
                          <p className="text-[10px] font-extrabold text-[#8a8a8a] uppercase tracking-wide">Exposure Value</p>
                          <p className="text-[15px] font-extrabold text-[#222222] mt-1 truncate">
                            {formatIndianCurrency(selectedNode.flaggedValue)}
                          </p>
                        </div>
                      </div>

                      {/* Connection lists */}
                      <div className="space-y-3">
                        <h4 className="text-[12px] font-black text-[#222222] uppercase tracking-wider flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5 text-[#aaaaaa]" />
                          Flagged Linkages ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                        </h4>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, idx) => {
                            const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                            const otherNode = nodes.find(n => n.id === otherId);
                            if (!otherNode) return null;

                            return (
                              <div key={idx} className="p-3 bg-[#fafafa] hover:bg-[#f7f7f7] rounded-[8px] border border-[#ebebeb] flex items-center justify-between text-[11.5px] transition-colors">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[#222222] truncate max-w-[150px]">{otherNode.name}</p>
                                  <p className="text-[10px] text-[#8a8a8a] font-mono uppercase font-bold tracking-wider">{edge.type.replace("_", " ")}</p>
                                </div>
                                <span className="font-mono text-[#ff385c] font-bold text-[10px]">{edge.tenderIds.join(", ")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommended enforcement */}
                      <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-[10px] text-[11.5px] text-rose-800 leading-relaxed flex gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#ff385c] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[9.5px] text-rose-700">Administrative Action Dispatched</span>
                          <p className="mt-0.5">
                            {selectedNode.type === "official" 
                              ? "Trigger preemptive Vigilance review regarding approvals clusters." 
                              : selectedNode.type === "contractor" 
                              ? "Auditing linked entities on MCA21 for director and registration address overlays."
                              : "Reviewing all tender bid limits and single-bidder rates under GFR Rule 173."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Reset select button */}
                {selectedNode && (
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="w-full mt-4 py-2 border border-[#ebebeb] hover:border-[#ff385c] text-[12px] font-bold rounded-[8px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
}
