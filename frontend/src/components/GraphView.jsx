import React, { useState, useMemo, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ErrorBoundary from "./ErrorBoundary";

function GraphView({
  displayGraphData,
  windowSize,
  clickedNode,
  setClickedNode,
  setSelectedPhoto,
  handleCloseOverlay,
  t,
}) {
  const fgRef = useRef();
  const shouldZoomToFit = useRef(true);
  const [hoverNode, setHoverNode] = useState(null);

  useEffect(() => {
    shouldZoomToFit.current = true;
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [displayGraphData]);

  const highlightNodes = useMemo(() => {
    const set = new Set();
    if (hoverNode) {
      const hId = String(hoverNode.id);
      set.add(hId);
      displayGraphData.links.forEach((link) => {
        const sourceId = String(
          typeof link.source === "object" ? link.source.id : link.source,
        );
        const targetId = String(
          typeof link.target === "object" ? link.target.id : link.target,
        );
        if (sourceId === hId) set.add(targetId);
        if (targetId === hId) set.add(sourceId);
      });
    }
    return set;
  }, [hoverNode, displayGraphData.links]);

  const highlightLinks = useMemo(() => {
    const set = new Set();
    if (hoverNode) {
      const hId = String(hoverNode.id);
      displayGraphData.links.forEach((link) => {
        const sourceId = String(
          typeof link.source === "object" ? link.source.id : link.source,
        );
        const targetId = String(
          typeof link.target === "object" ? link.target.id : link.target,
        );
        if (sourceId === hId || targetId === hId) {
          set.add(`${sourceId}-${targetId}`);
        }
      });
    }
    return set;
  }, [hoverNode, displayGraphData.links]);

  const sharedNodePointerAreaPaint = (node, color, ctx) => {
    const size = (node.val || 3) * (node.type === "Photo" ? 3 : 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fill();
  };

  const sharedNodeCanvasObject = (
    node,
    ctx,
    globalScale,
    activeHighlightNodes,
  ) => {
    const isDimmed =
      hoverNode &&
      activeHighlightNodes &&
      !activeHighlightNodes.has(String(node.id));
    ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

    const size = (node.val || 3) * (node.type === "Photo" ? 3 : 1);

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

    if (node.type === "Photo") {
      ctx.fillStyle = "#0284c7"; // Nice solid blue for photo nodes
      ctx.fill();
      ctx.strokeStyle = "#38bdf8"; // Glowing light-blue border
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Camera lens indicator (two concentric circles in center)
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.45, 0, 2 * Math.PI, false);
      ctx.fillStyle = "#0f172a"; // dark center
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Lens reflection highlight
      ctx.beginPath();
      ctx.arc(
        node.x - size * 0.15,
        node.y - size * 0.15,
        size * 0.1,
        0,
        2 * Math.PI,
        false,
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();
    } else {
      ctx.fillStyle = node.color || "#818cf8";
      ctx.fill();

      // Label
      const label = node.label;
      const fontSize = 10 / globalScale;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(label, node.x, node.y + size + fontSize);
    }

    ctx.globalAlpha = 1.0;
  };

  return (
    <ErrorBoundary>
      <div
        className="graph-view"
        style={{
          width: "100%",
          height: "calc(100vh - 70px)",
          background: "#020617",
        }}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={displayGraphData}
          width={windowSize.width - 240}
          height={windowSize.height - 70}
          nodeLabel="label"
          nodeAutoColorBy="type"
          linkDirectionalParticles={1}
          linkColor={(link) => {
            if (!hoverNode) return "rgba(255, 255, 255, 0.2)";
            const sourceId = String(
              typeof link.source === "object" ? link.source.id : link.source,
            );
            const targetId = String(
              typeof link.target === "object" ? link.target.id : link.target,
            );
            return highlightLinks.has(`${sourceId}-${targetId}`)
              ? "rgba(56, 189, 248, 1)"
              : "rgba(255, 255, 255, 0.05)";
          }}
          linkWidth={(link) => {
            if (!hoverNode) return 1;
            const sourceId = String(
              typeof link.source === "object" ? link.source.id : link.source,
            );
            const targetId = String(
              typeof link.target === "object" ? link.target.id : link.target,
            );
            return highlightLinks.has(`${sourceId}-${targetId}`) ? 2 : 1;
          }}
          nodePointerAreaPaint={sharedNodePointerAreaPaint}
          nodeCanvasObject={(node, ctx, globalScale) =>
            sharedNodeCanvasObject(node, ctx, globalScale, highlightNodes)
          }
          cooldownTicks={100}
          onEngineStop={() => {
            if (
              shouldZoomToFit.current &&
              fgRef.current &&
              displayGraphData?.nodes?.length > 0
            ) {
              const hasLayout = displayGraphData.nodes.some(
                (n) => n.x !== undefined,
              );
              if (hasLayout) {
                fgRef.current.zoomToFit(400, 80);
                shouldZoomToFit.current = false;
              }
            }
          }}
          onNodeClick={(node) => {
            const isSame =
              clickedNode && String(node.id) === String(clickedNode.id);
            setClickedNode(isSame ? null : node);

            if (fgRef.current) {
              setTimeout(() => {
                if (fgRef.current) fgRef.current.zoomToFit(800, 50);
              }, 500);
            }

            if (node.type === "Photo") {
              setSelectedPhoto({
                id: node.unit_id,
                cache_key: node.cache_key,
                takentime: node.takentime,
              });
            }
          }}
          onNodeHover={(node) => {
            if (hoverNode?.id !== node?.id) {
              setHoverNode(node || null);
            }
          }}
          onBackgroundClick={handleCloseOverlay}
        />
      </div>
    </ErrorBoundary>
  );
}

export default GraphView;
