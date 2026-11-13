import React, { useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FolderUp,
  MoreVertical,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  formatMonthLabel,
  getCurrentMonthKey,
  shiftMonthKey,
} from '../utils/mathAndFormat';

interface HeaderProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onExportCSV: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => void;
  onLoadDemo: () => void;
  onClearAll: () => void;
  transactionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onSelectMonth,
  onExportCSV,
  onExportBackup,
  onImportBackup,
  onLoadDemo,
  onClearAll,
  transactionCount,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMonthKey = getCurrentMonthKey();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
      setMenuOpen(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm shadow-emerald-600/20 select-none">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                GharKaHisaab
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                Paisa & Spends
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden xs:block sm:block">
              Ghar se aaya paisa + roz ke kharche ka poora hisaab
            </p>
          </div>
        </div>

        {/* Controls: Month Picker + Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/70">
            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, -1))}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                onSelectMonth(selectedMonth === 'all' ? currentMonthKey : selectedMonth)
              }
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{formatMonthLabel(selectedMonth)}</span>
            </button>

            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, 1))}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* All Time / Current Month Toggle */}
          <button
            type="button"
            onClick={() =>
              onSelectMonth(selectedMonth === 'all' ? currentMonthKey : 'all')
            }
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              selectedMonth === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {selectedMonth === 'all' ? 'This Month' : 'All Time'}
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setConfirmReset(false);
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Data & Export Options"
              title="Export, Backup & Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-40">
                  <div className="px-3.5 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Backup & Export ({transactionCount} entries)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onExportCSV();
                      setMenuOpen(false);
                    }}
                    disabled={transactionCount === 0}
                    className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Export Excel / CSV</div>
                      <div className="text-[11px] text-slate-400">Sheets ya Notion ke liye</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onExportBackup();
                      setMenuOpen(false);
                    }}
                    disabled={transactionCount === 0}
                    className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Download Backup (.json)</div>
                      <div className="text-[11px] text-slate-400">Phone/Browser change ke liye</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4 text-violet-600" />
                    <div>
                      <div className="font-medium">Restore Backup (.json)</div>
                      <div className="text-[11px] text-slate-400">Purana data wapas layein</div>
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      onLoadDemo();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Load Sample Demo Data</span>
                  </button>

                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      disabled={transactionCount === 0}
                      className="w-full px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-40 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Entries</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 bg-rose-50/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-rose-800">Sab delete karein?</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-2 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 cursor-pointer"
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClearAll();
                            setConfirmReset(false);
                            setMenuOpen(false);
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
                        >
                          Yes, Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
