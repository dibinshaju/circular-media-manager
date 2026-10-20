import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, 
  Music, Film, Play, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { playlistManager } from '../../services/PlaylistManager.js';
import { MediaNode } from '../../data-structures/MediaNode.js';
import { IntegrityReport } from '../../data-structures/CircularPlaylist.js';

export const CircularListVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<MediaNode[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityReport>({
    isValid: true,
    errors: [],
    nodeCount: 0,
    expectedCount: 0,
  });

  useEffect(() => {
    const update = () => {
      const active = playlistManager.getActivePlaylist();
      if (active) {
        setNodes(active.list.getAll());
        setCurrentId(active.list.current?.id || null);
        setIntegrity(active.list.validateIntegrity());
      } else {
        setNodes([]);
        setCurrentId(null);
      }
    };

    update();
    return playlistManager.subscribe(update);
  }, []);

  const handleStepNext = () => {
    playlistManager.next();
  };

  const handleStepPrev = () => {
    playlistManager.previous();
  };

  const handleSelectNode = (id: string) => {
    playlistManager.selectItem(id);
  };

  // Limit visual nodes to 6 for the circular diagram layout, but show total count
  const displayNodes = nodes.slice(0, 6);

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-block">
          <span className="pill-mint shadow-editorial-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            CIRCULAR DOUBLY LINKED LIST
          </span>
        </div>

        <h2 className="font-orbitron text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight">
          Never hit the end of the playlist.
        </h2>

        <p className="text-charcoal-muted text-base sm:text-lg font-medium">
          Each item points to the next and previous item, creating a continuous circular path.
        </p>
      </div>

      {/* Main Visualizer Container */}
      <div className="card-editorial p-6 sm:p-10 bg-white relative overflow-hidden">
        
        {/* Top Control Bar inside Visualizer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-charcoal-light mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm font-black text-charcoal">
              CDLL
            </div>
            <div>
              <h3 className="font-extrabold text-charcoal text-base">
                Interactive Pointer Ring
              </h3>
              <p className="text-xs font-semibold text-charcoal-muted">
                {nodes.length} nodes connected • head.prev = tail • tail.next = head
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Prev */}
            <button
              onClick={handleStepPrev}
              className="btn-editorial-white text-xs px-3.5 py-1.5"
              title="Step Previous pointer (O(1))"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Prev Pointer
            </button>

            {/* Step Next */}
            <button
              onClick={handleStepNext}
              className="btn-editorial-purple text-xs px-3.5 py-1.5"
              title="Step Next pointer (O(1))"
            >
              Next Pointer
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>

            {/* Invariant Status */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold border border-charcoal-border flex items-center gap-1.5 shadow-editorial-sm ${
              integrity.isValid ? 'bg-mint text-charcoal' : 'bg-red-200 text-red-900'
            }`}>
              {integrity.isValid ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-charcoal" />
                  <span>Invariants Intact</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-800" />
                  <span>Invariant Broken</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nodes Representation in Loop */}
        {displayNodes.length === 0 ? (
          <div className="py-16 text-center text-charcoal-muted font-bold">
            No items in this playlist. Add media to inspect the circular linked list!
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Responsive Nodes Linear-Loop Strip */}
            <div className="relative">
              
              {/* Wraparound Connecting Banner at top */}
              <div className="bg-charcoal text-white rounded-2xl p-2.5 mb-6 text-center text-xs font-extrabold flex items-center justify-between border-2 border-charcoal-border shadow-editorial-sm">
                <span className="flex items-center gap-1.5 pl-2 text-yellow">
                  <RefreshCw className="w-3.5 h-3.5" />
                  TAIL.next ➔ HEAD
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-gray-300">
                  Continuous O(1) Circular Doubly Linked Traversal
                </span>
                <span className="flex items-center gap-1.5 pr-2 text-mint">
                  HEAD.prev ➔ TAIL
                  <RefreshCw className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Grid of Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
                {displayNodes.map((node, index) => {
                  const isCurrent = node.id === currentId;
                  const isHead = index === 0;
                  const isTail = index === displayNodes.length - 1;

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className={`cursor-pointer rounded-2xl p-4 border-2 border-charcoal-border transition-all duration-200 relative group ${
                        isCurrent
                          ? 'bg-yellow shadow-editorial-lg -translate-y-1.5 ring-2 ring-purple'
                          : 'bg-white shadow-editorial hover:-translate-y-1 hover:shadow-editorial-lg'
                      }`}
                    >
                      {/* Node Position Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border border-charcoal-border ${
                          isHead ? 'bg-purple text-white' : isTail ? 'bg-mint text-charcoal' : 'bg-charcoal-light text-charcoal'
                        }`}>
                          {isHead ? 'HEAD' : isTail ? 'TAIL' : `Node ${index + 1}`}
                        </span>

                        {isCurrent && (
                          <span className="pill-purple text-[9px] py-0 px-1.5 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Icon & Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-white border border-charcoal-border flex items-center justify-center shrink-0">
                          {node.type === 'video' ? (
                            <Film className="w-3.5 h-3.5 text-charcoal" />
                          ) : (
                            <Music className="w-3.5 h-3.5 text-charcoal" />
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-charcoal truncate" title={node.title}>
                          {node.title}
                        </h4>
                      </div>

                      {/* Artist */}
                      <p className="text-[11px] font-semibold text-charcoal-muted truncate mb-3">
                        {node.artist || 'Unknown'}
                      </p>

                      {/* Bidirectional Pointer Inspection */}
                      <div className="bg-cream/80 p-2 rounded-xl border border-charcoal-border/70 text-[10px] font-mono space-y-1">
                        <div className="flex justify-between text-charcoal truncate">
                          <span className="text-purple font-bold">prev:</span>
                          <span className="truncate max-w-[80px]" title={node.prev?.title}>
                            {node.prev ? node.prev.title : 'null'}
                          </span>
                        </div>
                        <div className="flex justify-between text-charcoal truncate">
                          <span className="text-purple font-bold">next:</span>
                          <span className="truncate max-w-[80px]" title={node.next?.title}>
                            {node.next ? node.next.title : 'null'}
                          </span>
                        </div>
                      </div>

                      {/* Click helper hint on hover */}
                      <div className="mt-2 text-center text-[10px] font-extrabold text-charcoal opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to Select ➔
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Educational Complexity Explainer Box */}
            <div className="bg-charcoal-light p-4 sm:p-5 rounded-2xl border-2 border-charcoal-border flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center font-bold text-xs shrink-0">
                  O(1)
                </div>
                <div className="text-xs font-medium text-charcoal">
                  <span className="font-extrabold">Instant Navigation: </span>
                  Because every node maintains direct <code className="bg-white px-1 py-0.5 rounded border border-charcoal-border font-bold">next</code> and <code className="bg-white px-1 py-0.5 rounded border border-charcoal-border font-bold">prev</code> references, moving forward or backward runs in strict <strong>O(1) constant time</strong> regardless of playlist size.
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-charcoal">
                <span className="pill-mint">Append: O(1)</span>
                <span className="pill-mint">Wraparound: O(1)</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
