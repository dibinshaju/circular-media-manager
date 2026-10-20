import React, { useState } from 'react';
import { 
  Cpu, Leaf, Download, Upload, Trash2, Key, CheckCircle2, 
  HelpCircle, ShieldCheck, Database, RefreshCw, Zap
} from 'lucide-react';
import { PersistenceService } from '../../services/PersistenceService.js';
import { mediaRegistry } from '../../integrations/local/mediaRegistry.js';
import { clearAllBlobs } from '../../integrations/local/indexedDbStorage.js';

export const SettingsAndDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'complexity' | 'sustainability' | 'backup'>('complexity');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJSON = () => {
    const dataStr = PersistenceService.exportAllPlaylistsJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loopify-playlists-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = PersistenceService.importPlaylistsJSON(text);
        setImportStatus(`Successfully imported ${count} playlist(s)!`);
        window.location.reload();
      } catch (err: any) {
        setImportStatus(`Error importing: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = async () => {
    if (confirm('Clear all uploaded files from IndexedDB cache and reset localStorage?')) {
      await clearAllBlobs();
      mediaRegistry.revokeAll();
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="card-editorial p-6 sm:p-8 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block mb-1">
              <span className="pill-mint shadow-editorial-sm">
                <Cpu className="w-3.5 h-3.5" />
                SYSTEM & ARCHITECTURE
              </span>
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
              Docs, Complexity & Sustainability
            </h1>
            <p className="text-sm font-semibold text-charcoal-muted mt-1">
              Detailed engineering analysis of the Circular Doubly Linked List implementation.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'complexity', label: 'Big-O Complexity', icon: Cpu },
              { id: 'sustainability', label: 'Sustainability & Memory', icon: Leaf },
              { id: 'backup', label: 'Data Backup / Export', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold border-2 border-charcoal-border transition-all ${
                    isActive
                      ? 'bg-purple text-white shadow-editorial-sm'
                      : 'bg-white text-charcoal hover:bg-cream'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab 1: Big-O Complexity */}
      {activeTab === 'complexity' && (
        <div className="space-y-6">
          <div className="card-editorial p-6 sm:p-8 bg-white">
            <h3 className="text-xl font-extrabold text-charcoal mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple" />
              Algorithmic Time & Space Complexity
            </h3>
            
            <p className="text-xs sm:text-sm font-semibold text-charcoal-muted mb-6 leading-relaxed">
              Unlike array-backed playlists that require O(n) shifts upon deletion/insertion or modulo indexing calculations on every step, our custom <strong>Circular Doubly Linked List (CDLL)</strong> achieves continuous bidirectional wraparound through pointer references with rigorous asymptotic bounds.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-2 border-charcoal-border rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-charcoal text-white text-xs font-black uppercase tracking-wider">
                    <th className="p-3.5 border-r border-charcoal-border">Operation</th>
                    <th className="p-3.5 border-r border-charcoal-border">Time Complexity</th>
                    <th className="p-3.5 border-r border-charcoal-border">Space Complexity</th>
                    <th className="p-3.5">Engineering Rationale & Pointer Mechanics</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-charcoal divide-y-2 divide-charcoal-light">
                  <tr className="bg-yellow-light/40">
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Next (<code className="bg-white px-1 rounded border">next()</code>)</td>
                    <td className="p-3.5 font-black text-purple border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 text-charcoal-muted">Updates current pointer: <code className="bg-white px-1">current = current.next</code>. Tail.next automatically points to Head.</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Previous (<code className="bg-white px-1 rounded border">previous()</code>)</td>
                    <td className="p-3.5 font-black text-purple border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 text-charcoal-muted">Updates current pointer: <code className="bg-white px-1">current = current.prev</code>. Head.prev automatically points to Tail.</td>
                  </tr>

                  <tr className="bg-yellow-light/40">
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Append (<code className="bg-white px-1 rounded border">add()</code>)</td>
                    <td className="p-3.5 font-black text-purple border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 text-charcoal-muted">Tail is directly accessed in O(1) via <code className="bg-white px-1">head.prev</code>, rewiring 4 pointers without list traversal.</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Insert After Node (<code className="bg-white px-1 rounded border">insertAfterNode()</code>)</td>
                    <td className="p-3.5 font-black text-purple border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 text-charcoal-muted">Slices newNode between known node and node.next in constant pointer assignments.</td>
                  </tr>

                  <tr className="bg-yellow-light/40">
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Remove By ID (<code className="bg-white px-1 rounded border">remove()</code>)</td>
                    <td className="p-3.5 font-black text-charcoal border-r border-charcoal-border">O(n)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(1)</td>
                    <td className="p-3.5 text-charcoal-muted">Linear scan to find node with target ID, followed by O(1) pointer unlinking.</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Search Query (<code className="bg-white px-1 rounded border">search()</code>)</td>
                    <td className="p-3.5 font-black text-charcoal border-r border-charcoal-border">O(n)</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">O(k)</td>
                    <td className="p-3.5 text-charcoal-muted">Traverses exactly count nodes. Non-mutating; does not touch current pointer.</td>
                  </tr>

                  <tr className="bg-yellow-light/40">
                    <td className="p-3.5 font-bold border-r border-charcoal-border">Overall Storage</td>
                    <td className="p-3.5 font-bold border-r border-charcoal-border">—</td>
                    <td className="p-3.5 font-black text-purple border-r border-charcoal-border">O(n)</td>
                    <td className="p-3.5 text-charcoal-muted">Linear in number of media nodes. Each node carries metadata + 2 pointer references.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sustainability & Memory */}
      {activeTab === 'sustainability' && (
        <div className="card-editorial p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint border-2 border-charcoal-border flex items-center justify-center shadow-editorial">
              <Leaf className="w-6 h-6 text-charcoal" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-charcoal">
                Software Sustainability & Computational Efficiency
              </h3>
              <p className="text-xs font-semibold text-charcoal-muted">
                Architectural design principles for lean memory footprint and zero wasted cycles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            <div className="p-4 rounded-2xl bg-cream border-2 border-charcoal-border shadow-editorial-sm space-y-2">
              <h4 className="font-black text-sm text-charcoal flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple" />
                Constant-Time Pointer Manipulation
              </h4>
              <p className="text-xs font-medium text-charcoal-muted leading-relaxed">
                Navigation (Next/Prev) and Appending run in O(1) time without allocating temporary array frames or recomputing indices. This minimizes GC pressure and eliminates unnecessary CPU cycles during continuous playback.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream border-2 border-charcoal-border shadow-editorial-sm space-y-2">
              <h4 className="font-black text-sm text-charcoal flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple" />
                Active Object URL Registry & Cleanup
              </h4>
              <p className="text-xs font-medium text-charcoal-muted leading-relaxed">
                Browser Object URLs (<code className="bg-white px-1 rounded">URL.createObjectURL</code>) hold underlying Blobs in RAM until released. Loopify enforces a centralized registry that calls <code className="bg-white px-1 rounded">URL.revokeObjectURL</code> immediately upon node deletion or session teardown.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream border-2 border-charcoal-border shadow-editorial-sm space-y-2">
              <h4 className="font-black text-sm text-charcoal flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple" />
                Zero Redundant Polling
              </h4>
              <p className="text-xs font-medium text-charcoal-muted leading-relaxed">
                State updates are strictly reactive via event-driven pub/sub subscriptions. No background polling loops or heavy interval checks consume battery or CPU when playback is idle.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream border-2 border-charcoal-border shadow-editorial-sm space-y-2">
              <h4 className="font-black text-sm text-charcoal flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple" />
                Decoupled Storage & Transient Projections
              </h4>
              <p className="text-xs font-medium text-charcoal-muted leading-relaxed">
                Large binary files are stored in browser-native IndexedDB rather than base64 strings in localStorage, preventing browser storage exhaustion and main thread blocking.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Data Backup / Restore */}
      {activeTab === 'backup' && (
        <div className="card-editorial p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial">
              <Database className="w-6 h-6 text-charcoal" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-charcoal">
                Data Persistence & Backup
              </h3>
              <p className="text-xs font-semibold text-charcoal-muted">
                Export and import your application-managed playlists without losing order or metadata.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-cream border-2 border-charcoal-border space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleExportJSON}
                className="btn-editorial-purple text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Playlists Backup (.JSON)
              </button>

              <label className="btn-editorial-white text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import Playlists Backup (.JSON)
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleClearCache}
                className="btn-editorial-white text-xs text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Reset All Local Storage
              </button>
            </div>

            {importStatus && (
              <div className="p-3 bg-white rounded-xl border border-charcoal-border text-xs font-bold text-charcoal">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
};
