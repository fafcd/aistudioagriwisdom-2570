import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Command,
  Settings2,
  LogOut,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  X,
  HelpCircle,
  Activity,
  User,
  Plus,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Sliders
} from "lucide-react";
import { Candidate, Evaluation } from "../types";

interface ModernNavigationSuiteProps {
  user: { name: string; agency: string; isAdmin: boolean } | null;
  selectedRegion: string | null;
  activeTab: string;
  setActiveTab: (tab: "dashboard" | "executive_dashboard" | "google_sheets_map" | "admin_candidates") => void;
  candidates: Candidate[];
  evaluations: Evaluation[];
  onStartEvaluation: (branchCode: 1 | 2 | 3 | 4, candidateId: string) => void;
  onLogout: () => void;
  onTriggerAdminUnlock?: () => void;
  onRefreshData?: () => void;
}

export default function ModernNavigationSuite({
  user,
  selectedRegion,
  activeTab,
  setActiveTab,
  candidates,
  evaluations,
  onStartEvaluation,
  onLogout,
  onTriggerAdminUnlock,
  onRefreshData
}: ModernNavigationSuiteProps) {
  // --- UI STATES ---
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // System statistics for widgets
  const totalCandidates = candidates.length;
  const completedEvaluations = evaluations.length;
  const uniqueEvaluatedCandidates = new Set(evaluations.map((e) => e.candidateId)).size;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === "Escape") {
        setIsRadialOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <>

      {/* 3. FLOATING DOCK NAVIGATION (Desktop) & Sleek Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
        {/* Responsive Dual Wrapper */}
        <div className="pointer-events-auto flex items-center justify-center w-full max-w-lg md:max-w-2xl">
          
          {/* DESKTOP GLASSMOPHISM FLOATING DOCK */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl px-3 py-2 shadow-[0_15px_30px_-5px_rgba(15,23,42,0.08),0_5px_15px_-2px_rgba(15,23,42,0.04)] select-none">
            
            {/* Tab: Dashboard */}
            <button
              id="dock_tab_dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`relative p-2.5 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center ${
                activeTab === "dashboard"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15"
                  : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Award className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                บันทึกคะแนนปราชญ์เกษตร
              </span>
            </button>

            {/* Tab: Executive Dashboard */}
            {user?.isAdmin && (
              <button
                id="dock_tab_executive"
                onClick={() => setActiveTab("executive_dashboard")}
                className={`relative p-2.5 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center ${
                  activeTab === "executive_dashboard"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15"
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                  รายงานผลคะแนนทุกเขต
                </span>
              </button>
            )}

            {/* Tab: Sheets Mapping */}
            {user?.isAdmin && (
              <button
                id="dock_tab_sheets"
                onClick={() => setActiveTab("google_sheets_map")}
                className={`relative p-2.5 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center ${
                  activeTab === "google_sheets_map"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15"
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                  แมปปิ้ง Google Sheets
                </span>
              </button>
            )}

            {/* Tab: Admin Panel */}
            {user?.isAdmin && (
              <button
                id="dock_tab_admin"
                onClick={() => setActiveTab("admin_candidates")}
                className={`relative p-2.5 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center ${
                  activeTab === "admin_candidates"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15"
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                <Settings2 className="w-5 h-5" />
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                  จัดการระบบรายชื่อ (Admin)
                </span>
              </button>
            )}



            {/* Quick Live Refresh */}
            <button
              id="dock_live_refresh"
              onClick={() => {
                if (onRefreshData) onRefreshData();
              }}
              className="relative p-2.5 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                ดึงข้อมูลเรียลไทม์
              </span>
            </button>

            {/* Logout dock */}
            <button
              id="dock_logout_btn"
              onClick={onLogout}
              className="relative p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center"
            >
              <LogOut className="w-5 h-5" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-rose-950 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                ออกจากระบบ
              </span>
            </button>
          </div>

          {/* MOBILE / TABLET THUMB-FRIENDLY BOTTOM NAVIGATION RAIL */}
          <div className="flex sm:hidden w-full items-center justify-around bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl py-2 px-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
            {/* Mobile Tab: Dashboard */}
            <button
              id="mob_tab_dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "dashboard" ? "text-emerald-600 font-bold" : "text-slate-400"
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[9px]">บันทึกคะแนน</span>
            </button>

            {/* Mobile Tab: Executive */}
            {user?.isAdmin && (
              <button
                id="mob_tab_executive"
                onClick={() => setActiveTab("executive_dashboard")}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === "executive_dashboard" ? "text-emerald-600 font-bold" : "text-slate-400"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-[9px]">ผลคะแนนทุกเขต</span>
              </button>
            )}

            {/* Mobile Tab: Sheets Mapping */}
            {user?.isAdmin && (
              <button
                id="mob_tab_sheets"
                onClick={() => setActiveTab("google_sheets_map")}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === "google_sheets_map" ? "text-emerald-600 font-bold" : "text-slate-400"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-[9px]">Google Sheets</span>
              </button>
            )}


          </div>

        </div>
      </div>

      {/* 4. FAB AND RADIAL MENU (Bottom Right) */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Expanded Radial Menu */}
        <AnimatePresence>
          {isRadialOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ type: "spring", damping: 15, stiffness: 220 }}
              className="pointer-events-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-4 w-64 text-slate-800 flex flex-col gap-3"
            >
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <Activity className="w-4 h-4 animate-pulse text-emerald-600" />
                  <span className="text-xs font-bold font-sans">สถานะระบบประเมินด่วน</span>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded-md font-mono font-bold animate-pulse">
                  ONLINE
                </span>
              </div>

              {/* Mini metrics inside Radial card */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">ผู้สมัครทั้งหมด</span>
                  <span className="text-sm font-black text-slate-800">{totalCandidates} ราย</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">บันทึกข้อมูลแล้ว</span>
                  <span className="text-sm font-black text-emerald-700">{completedEvaluations} ครั้ง</span>
                </div>
              </div>

              {/* Actions Grid in radial box */}
              <div className="flex flex-col gap-1.5 text-xs font-semibold pt-1">
                <button
                  id="radial_action_copy_creds"
                  onClick={() =>
                    handleCopyText(
                      `ระบบประเมินคะแนนผู้สมัครปราชญ์เกษตร ปี 2570 | เขต: ${selectedRegion || "ไม่ได้ระบุ"}`,
                      "creds"
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 rounded-xl text-slate-700 transition-all text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกรายละเอียดเขต</span>
                  </span>
                  {copiedText === "creds" ? (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">คัดลอกแล้ว!</span>
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                {user?.isAdmin && onTriggerAdminUnlock && (
                  <button
                    id="radial_action_admin_shortcut"
                    onClick={() => {
                      setIsRadialOpen(false);
                      onTriggerAdminUnlock();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-amber-700 transition-all text-left cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>เพิ่มข้อมูลผู้สมัคร (Admin)</span>
                  </button>
                )}

                <button
                  id="radial_action_refresh"
                  onClick={() => {
                    if (onRefreshData) onRefreshData();
                    setIsRadialOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-emerald-700 transition-all text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บังคับรีเฟรช / ดึงข้อมูลใหม่</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-2 text-[9px] text-slate-400 text-center font-mono">
                เขตตรวจราชการ: {selectedRegion || "ส่วนกลาง"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Trigger FAB */}
        <motion.button
          id="radial_menu_fab_trigger"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRadialOpen((prev) => !prev)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-500/50 z-50"
        >
          <motion.div
            animate={{ rotate: isRadialOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Plus className="w-6 h-6 font-bold" />
          </motion.div>
        </motion.button>

      </div>
    </>
  );
}
