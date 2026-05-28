"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Users, Building, ShieldAlert, Layers, Info, Filter, RefreshCw, ZoomIn, ZoomOut, Landmark, Loader2 } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Node {
  id: string;
  type: "contractor" | "official" | "department" | "director";
  name: string;
  designation?: string;
  cin?: string;
  din?: string;
  state?: string;
  val: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: "won_contract" | "bidder" | "director_link" | "works_in" | "approved_contract";
  weight: number;
  label?: string;
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

  const fetchGraphData = () => {
    setLoading(true);
    api.getNetworkGraph()
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
        setEdges(data.links || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching network graph:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  // Pure React force-directed simulation step
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

        node.x = (node.x || 0) + node.vx;
        node.y = (node.y || 0) + node.vy;

        // Keep inside bounds
        const padding = 20;
        if (node.x < padding) { node.x = padding; node.vx = 0; }
        if (node.x > width - padding) { node.x = width - padding; node.vx = 0; }
        if (node.y < padding) { node.y = padding; node.vy = 0; }
        if (node.y > height - padding) { node.y = height - padding; node.vy = 0; }
      });

      simNodesRef.current = currentNodes;
      setNodes(currentNodes);
      setSimulationTick(prev => prev + 1);

      animFrameId = requestAnimationFrame(runSimulationStep);
    };

    animFrameId = requestAnimationFrame(runSimulationStep);
    return () => cancelAnimationFrame(animFrameId);
  }, [loading, edges, draggedNode]);

  // Handle Dragging
  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    setDraggedNode(nodeId);
    setSelectedNode(nodes.find(n => n.id === nodeId) || null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    simNodesRef.current = simNodesRef.current.map(n => {
      if (n.id === draggedNode) {
        return { ...n, x, y, vx: 0, vy: 0 };
      }
      return n;
    });
    setNodes(simNodesRef.current);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Node styles helpers
  const getNodeColor = (type: string) => {
    if (type === "contractor") return "#ff385c"; // Hot Pink
    if (type === "official") return "#f97316"; // Orange
    if (type === "department") return "#6b7280"; // Slate Gray
    return "#3b82f6"; // Blue for directors
  };

  const getNodeIcon = (type: string) => {
    if (type === "contractor") return Building;
    if (type === "official") return Users;
    if (type === "department") return Landmark;
    return Info;
  };

  const filteredNodes = nodes.filter(n => {
    if (filterType === "all") return true;
    return n.type === filterType;
  });

  const filteredEdges = edges.filter(edge => {
    const sourceExists = filteredNodes.some(n => n.id === edge.source);
    const targetExists = filteredNodes.some(n => n.id === edge.target);
    return sourceExists && targetExists;
  });

  return (
    <MainLayout title="Corruption Collusion Network" subtitle="D3 Force-Directed Collusion Map">
      <div className="space-y-6">
        <div className="bg-white rounded-[14px] border border-[#ebebeb] p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-extrabold text-[#222222] uppercase tracking-wider">
              Interactive Collusion Map
            </h2>
            <p className="text-[12px] text-[#6a6a6a]">
              Audit relational overlaps between approving government officials, shared director MCA21 profiles, and win concentrations.
            </p>
          </div>
          <div className="flex gap-2 self-stretch lg:self-auto">
            <Button variant="outline" size="sm" onClick={fetchGraphData} className="rounded-[8px]">
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Reset Layout
            </Button>
            <div className="flex bg-[#f7f7f7] border border-[#ebebeb] p-1 rounded-[10px]">
              {[
                { type: "all", label: "All" },
                { type: "contractor", label: "Contractors" },
                { type: "official", label: "Officials" },
                { type: "department", label: "Depts" },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setFilterType(opt.type);
                    setSelectedNode(null);
                  }}
                  className={`text-[12px] font-bold px-3.5 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                    filterType === opt.type ? "bg-white shadow-sm text-[#222222]" : "text-[#aaaaaa] hover:text-[#222222]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Network Graph Area */}
          <div className="xl:col-span-2 bg-[#fdfdfd] border border-[#ebebeb] rounded-[18px] shadow-sm relative overflow-hidden h-[560px]">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff385c]" />
                <span className="text-[12px] text-[#aaaaaa] font-semibold uppercase tracking-wider">Analyzing shared directorship graphs...</span>
              </div>
            ) : (
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="select-none cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 1. Draw Links */}
                {filteredEdges.map((edge, idx) => {
                  const sNode = nodes.find(n => n.id === edge.source);
                  const tNode = nodes.find(n => n.id === edge.target);
                  if (!sNode || !tNode) return null;

                  let color = "#ebebeb";
                  if (edge.type === "approved_contract") color = "#ff385c"; // Rigged approved links
                  if (edge.type === "director_link") color = "#3b82f6"; // Shared director links

                  return (
                    <line
                      key={`edge-${idx}`}
                      x1={sNode.x}
                      y1={sNode.y}
                      x2={tNode.x}
                      y2={tNode.y}
                      stroke={color}
                      strokeWidth={edge.type === "approved_contract" ? 2.5 : 1.5}
                      strokeDasharray={edge.type === "bidder" ? "4,4" : undefined}
                    />
                  );
                })}

                {/* 2. Draw Nodes */}
                {filteredNodes.map(node => {
                  const color = getNodeColor(node.type);
                  const radius = node.type === "department" ? 18 : node.type === "official" ? 15 : 12;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x || 0}, ${node.y || 0})`}
                      onMouseDown={(e) => handleMouseDown(node.id, e)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={radius}
                        fill={color}
                        stroke={isSelected ? "#222222" : "white"}
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all hover:scale-110"
                      />
                      <text
                        y={radius + 14}
                        textAnchor="middle"
                        fill="#333333"
                        fontSize="10"
                        fontWeight="700"
                        className="pointer-events-none select-none bg-white font-sans"
                      >
                        {node.name.length > 14 ? `${node.name.substring(0, 12)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Node Dossier Sidebar */}
          <div className="bg-white border border-[#ebebeb] rounded-[18px] p-6 shadow-sm flex flex-col gap-6 h-[560px] overflow-y-auto">
            <h3 className="text-[15px] font-bold text-[#222222] border-b border-[#f7f7f7] pb-3 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff385c]" />
              Entity Investigation Dossier
            </h3>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <div className="space-y-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider ${
                        selectedNode.type === "contractor"
                          ? "bg-[#ff385c]/10 text-[#ff385c]"
                          : selectedNode.type === "official"
                            ? "bg-orange-50 text-[#f97316]"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedNode.type}
                    </span>
                    <h4 className="text-[16px] font-extrabold text-[#222222] leading-snug">{selectedNode.name}</h4>
                  </div>

                  <div className="space-y-4 flex-1">
                    {selectedNode.type === "contractor" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">MCA21 CIN</span>
                          <span className="text-[13px] font-mono font-bold text-[#222222]">
                            {selectedNode.cin || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Registry State</span>
                          <span className="text-[13px] font-bold text-[#222222]">
                            {selectedNode.state || "Active Registry Profile"}
                          </span>
                        </div>
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-[10px] space-y-1">
                          <span className="text-[10px] font-black text-[#ff385c] uppercase tracking-wider">Collusion Risk Indicator</span>
                          <p className="text-[12px] text-[#222222] font-semibold">
                            Associated with elevated win concentrations and shared directorship networks (S-06 / S-08 flags).
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === "official" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Officer Designation</span>
                          <span className="text-[13px] font-bold text-[#222222]">
                            {selectedNode.designation || "Superintending Engineer"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Office Location</span>
                          <span className="text-[13px] font-bold text-[#222222]">
                            {selectedNode.state || "Central Division"}
                          </span>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-[10px] space-y-1">
                          <span className="text-[10px] font-black text-[#d97706] uppercase tracking-wider">Vigilance Multiplier</span>
                          <p className="text-[12px] text-[#222222] font-semibold">
                            Approver signature matches rigged specification documents with 1.3x risk factor applied.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === "director" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Director DIN</span>
                          <span className="text-[13px] font-mono font-bold text-[#222222]">
                            {selectedNode.din || "N/A"}
                          </span>
                        </div>
                        <div className="p-4 bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-[10px] space-y-1">
                          <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-wider">Directorship Linkage</span>
                          <p className="text-[12px] text-[#222222] font-semibold">
                            Acts as a common node linking multiple contractors within the bidding rings.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === "department" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Procuring Entity</span>
                          <span className="text-[13px] font-bold text-[#222222]">
                            {selectedNode.name}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b border-[#f7f7f7] pb-2.5">
                          <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Jurisdiction</span>
                          <span className="text-[13px] font-bold text-[#222222]">
                            {selectedNode.state || "Central / Union Ministry"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Layers className="w-8 h-8 text-[#dddddd] mb-3" />
                  <p className="text-[12.5px] text-[#aaaaaa] font-semibold">No Entity Selected</p>
                  <p className="text-[11.5px] text-[#aaaaaa] mt-1 max-w-[200px]">
                    Click and drag any node in the collusion network graph to inspect corporate profiles and shared directors.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
