import React, { useState, useEffect } from "react";
import { Candidate, Evaluation, Voter } from "./types";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EvaluationForm from "./components/EvaluationForm";
import GoogleSheetsMap from "./components/GoogleSheetsMap";
import CandidateAdmin from "./components/CandidateAdmin";
import ModernNavigationSuite from "./components/ModernNavigationSuite";
import { motion, AnimatePresence } from "motion/react";
import { Award, TableProperties, Users, Settings2, LogOut, ChevronRight, FileSpreadsheet, CheckSquare, ShieldAlert, Key, TrendingUp } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<{ name: string; agency: string; isAdmin: boolean; phone?: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "executive_dashboard" | "google_sheets_map" | "admin_candidates" | "top_leaderboard">("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  
  // Admin password unlock dialog state
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminUnlockPassword, setAdminUnlockPassword] = useState("");
  const [adminUnlockError, setAdminUnlockError] = useState("");

  // Voting Form state
  const [votingState, setVotingState] = useState<{
    isActive: boolean;
    branchCode: 1 | 2 | 3 | 4;
    candidateId: string;
  } | null>(null);

  // Load user and region from local storage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("sage_user_session");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("sage_user_session");
      }
    }

    const savedRegion = localStorage.getItem("sage_selected_region");
    if (savedRegion) {
      setSelectedRegion(savedRegion);
    }
  }, []);

  // Fetch initial candidates, evaluations, and voters
  const fetchData = async () => {
    try {
      const candRes = await fetch("/api/candidates");
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData);
      }

      const evalRes = await fetch("/api/evaluations");
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setEvaluations(evalData);
      }

      const voterRes = await fetch("/api/voters");
      if (voterRes.ok) {
        const voterData = await voterRes.json();
        setVoters(voterData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds to support real-time committee multi-user updates!
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectRegion = (region: string | null) => {
    setSelectedRegion(region);
    if (region) {
      localStorage.setItem("sage_selected_region", region);
    } else {
      localStorage.removeItem("sage_selected_region");
    }
  };

  const handleLogin = (name: string, agency: string, isAdmin: boolean, phone?: string) => {
    const session = { name, agency, isAdmin, phone };
    setUser(session);
    localStorage.setItem("sage_user_session", JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sage_user_session");
    setVotingState(null);
    setActiveTab("dashboard");
    setShowAdminUnlock(false);
    setSelectedRegion(null);
    localStorage.removeItem("sage_selected_region");
  };

  const handleStartEvaluation = (branchCode: 1 | 2 | 3 | 4, candidateId: string) => {
    setVotingState({
      isActive: true,
      branchCode,
      candidateId
    });
  };

  const handleAddCandidate = async (newCand: Omit<Candidate, "id">) => {
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCand),
    });
    if (res.ok) {
      await fetchData();
    } else {
      throw new Error("Failed to add candidate");
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await fetchData();
    } else {
      throw new Error("Failed to delete candidate");
    }
  };

  const handleAddVoter = async (newVoter: Omit<Voter, "id">) => {
    const res = await fetch("/api/voters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVoter),
    });
    if (res.ok) {
      await fetchData();
    } else {
      throw new Error("Failed to add voter");
    }
  };

  const handleDeleteVoter = async (id: string) => {
    const res = await fetch(`/api/voters/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await fetchData();
    } else {
      throw new Error("Failed to delete voter");
    }
  };

  const handleEvaluationSuccess = async () => {
    await fetchData();
    setVotingState(null);
  };

  const handleAdminUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUnlockError("");

    if (adminUnlockPassword.trim().toUpperCase() === "ADMIN2570") {
      // Temporarily elevate current user to Admin
      if (user) {
        const updatedUser = { ...user, isAdmin: true };
        setUser(updatedUser);
        localStorage.setItem("sage_user_session", JSON.stringify(updatedUser));
      } else {
        // Log in directly as guest admin
        handleLogin("ผู้ดูแลระบบกิตติมศักดิ์", "กองอำนวยการกลาง", true);
      }
      setActiveTab("admin_candidates");
      setShowAdminUnlock(false);
      setAdminUnlockPassword("");
    } else {
      setAdminUnlockError("รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง!");
    }
  };

  if (!user || !selectedRegion) {
    return (
      <Login
        onLogin={handleLogin}
        voters={voters}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
      />
    );
  }

  return (
    <div className="min-h-screen theme-bg text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative">
      
      {/* Modern Navigation Suite (Dock, Bottom Nav, Command Palette, Radial FAB) */}
      <ModernNavigationSuite
        user={user}
        selectedRegion={selectedRegion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidates={candidates}
        evaluations={evaluations}
        onStartEvaluation={handleStartEvaluation}
        onLogout={handleLogout}
        onTriggerAdminUnlock={() => setShowAdminUnlock(true)}
        onRefreshData={fetchData}
      />
      
      {/* Subtle ambient grid overlay to add premium depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 pointer-events-none"></div>

      {/* Top Header Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03),0_4px_6px_-2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shadow-sm">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-base md:text-lg tracking-tight flex items-center gap-1.5 text-slate-900">
                ระบบการลงคะแนนการสรรหาปราชญ์เกษตรของแผ่นดิน ปี 2570
                <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-lg font-mono shadow-sm">
                  {selectedRegion}
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                Office of the Permanent Secretary Ministry of Agriculture and Cooperatives
              </p>
            </div>
          </div>

          {/* Committee Member Info & Logout */}
          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold text-slate-800">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                    {user.agency}
                  </span>
                  {user.isAdmin && (
                    <span className="text-[9px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold border border-amber-200">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Back to Region Selection button */}
              <button
                id="header_change_region_btn"
                onClick={() => handleSelectRegion(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm"
                title="เปลี่ยนเขตตรวจราชการ"
              >
                เปลี่ยนเขต
              </button>

              <button
                id="header_logout_btn"
                onClick={handleLogout}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-950 rounded-xl transition-all cursor-pointer shadow-sm"
                title="ออกจากระบบประเมิน"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-6 w-full z-10">
        <AnimatePresence mode="wait">
          {votingState && votingState.isActive ? (
            /* Active Evaluation Form View */
            <motion.div
              key="voting_form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back breadcrumb */}
              <div className="mb-4">
                <button
                  id="btn_back_to_dashboard"
                  onClick={() => setVotingState(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm hover:bg-slate-50 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  กลับสู่แดชบอร์ดหลัก
                </button>
              </div>

              <EvaluationForm
                candidates={candidates}
                activeBranch={votingState.branchCode}
                candidateId={votingState.candidateId}
                committeeName={user.name}
                committeeAgency={user.agency}
                onSuccess={handleEvaluationSuccess}
                onCancel={() => setVotingState(null)}
              />
            </motion.div>
          ) : (
            /* Tabbed Main Views Dashboard / Google Sheets Map / Admin Candidates */
            <motion.div
              key="main_tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              
              {/* Tabs Navigation Rail and Separate Admin Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-1">
                <div className="flex gap-1.5 -mb-px overflow-x-auto scrollbar-none">
                  <button
                    id="tab_nav_dashboard"
                    onClick={() => setActiveTab("dashboard")}
                    className={`pb-3 px-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "dashboard"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>บันทึกคะแนนปราชญ์เกษตร</span>
                  </button>

                  {user.isAdmin && (
                    <button
                      id="tab_nav_executive_dashboard"
                      onClick={() => setActiveTab("executive_dashboard")}
                      className={`pb-3 px-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "executive_dashboard"
                          ? "border-emerald-600 text-emerald-800"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>รายงานผลคะแนนทุกเขต</span>
                    </button>
                  )}

                  {user.isAdmin && (
                    <button
                      id="tab_nav_sheets"
                      onClick={() => setActiveTab("google_sheets_map")}
                      className={`pb-3 px-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "google_sheets_map"
                          ? "border-emerald-600 text-emerald-800"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>แมปปิ้ง Google Sheets</span>
                    </button>
                  )}

                  {user.isAdmin && (
                    <button
                      id="tab_nav_admin"
                      onClick={() => setActiveTab("admin_candidates")}
                      className={`pb-3 px-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "admin_candidates"
                          ? "border-emerald-600 text-emerald-800"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Settings2 className="w-4 h-4 text-emerald-600" />
                      <span>จัดการระบบ (Admin)</span>
                    </button>
                  )}

                  {user.isAdmin && (
                    <button
                      id="tab_nav_top_leaderboard"
                      onClick={() => setActiveTab("top_leaderboard")}
                      className={`pb-3 px-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "top_leaderboard"
                          ? "border-emerald-600 text-emerald-800"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>ท็อป 1 & 2 รายสาขา</span>
                    </button>
                  )}
                </div>

                {/* SEPARATED ADMIN ACTION BUTTON */}
                {!user.isAdmin && (
                  <button
                    id="btn_admin_unlock_trigger"
                    onClick={() => setShowAdminUnlock(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all self-start sm:self-auto"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                    <span>ปุ่มสำหรับ Admin (เพิ่มข้อมูล)</span>
                  </button>
                )}
              </div>

              {/* Unlock Admin Code Dialog Pop-up */}
              {showAdminUnlock && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-amber-200 rounded-2xl p-5 shadow-lg space-y-3.5 max-w-md text-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">ปลดล็อกสิทธิ์ผู้ดูแลระบบ (Admin Mode)</h3>
                      <p className="text-xs text-slate-500 mt-1">กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อเปิดเมนูสำหรับเพิ่มหรือแก้ไขข้อมูล</p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminUnlockSubmit} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        id="input_admin_unlock_password"
                        type="password"
                        placeholder="ป้อนรหัสผ่านผู้ดูแลระบบ"
                        value={adminUnlockPassword}
                        onChange={(e) => setAdminUnlockPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl py-2 px-3 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm"
                      />
                    </div>
                    <button
                      id="btn_admin_unlock_submit"
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs md:text-sm rounded-xl cursor-pointer transition-all shrink-0"
                    >
                      ยืนยันรหัส
                    </button>
                    <button
                      id="btn_admin_unlock_cancel"
                      type="button"
                      onClick={() => {
                        setShowAdminUnlock(false);
                        setAdminUnlockPassword("");
                        setAdminUnlockError("");
                      }}
                      className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 rounded-xl text-xs cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </form>
                  {adminUnlockError && (
                    <p className="text-xs text-red-600 font-semibold">{adminUnlockError}</p>
                  )}
                </motion.div>
              )}

              {/* Active Tab Component */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl p-4 md:p-5 text-slate-800">
                {activeTab === "dashboard" && (
                  <div className="space-y-5">
                    {/* Display voters with voting rights in this region */}
                    {user.isAdmin && (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 space-y-3 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-emerald-600" />
                              ผู้มีสิทธิ์ลงคะแนนใน {selectedRegion}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              คณะกรรมการประจำเขตที่ลงทะเบียนในระบบ และตรวจพบความถูกต้องหรือการลงชื่อซ้ำซ้อนแบบแยกเฉพาะหน่วยงาน
                            </p>
                          </div>
                          
                          {/* Summary status tag */}
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg shadow-sm">
                              เปิดใช้งานการตรวจประวัติซ้ำซ้อนแล้ว
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pt-2 border-t border-slate-200/60">
                          {(() => {
                            const regionVoters = voters.filter(v => v.district === selectedRegion);
                            
                            // Count names and agencies to detect duplicates
                            const nameCounts: Record<string, number> = {};
                            const agencyCounts: Record<string, number> = {};
                            
                            regionVoters.forEach(v => {
                              const n = v.name.trim().toLowerCase();
                              const a = v.agency.trim().toLowerCase();
                              nameCounts[n] = (nameCounts[n] || 0) + 1;
                              agencyCounts[a] = (agencyCounts[a] || 0) + 1;
                            });

                            if (regionVoters.length === 0) {
                              return <span className="text-xs text-slate-500 italic">ยังไม่ได้กำหนดรายชื่อกรรมการประจำเขตนี้</span>;
                            }

                            return regionVoters.map(v => {
                              const doneCount = evaluations.filter(e => e.committeeName === v.name).length;
                              const isNameDup = nameCounts[v.name.trim().toLowerCase()] > 1;
                              const isAgencyDup = agencyCounts[v.agency.trim().toLowerCase()] > 1;

                              return (
                                <div
                                  key={v.id}
                                  className={`text-[10px] font-sans px-3 py-1.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 transition-all ${
                                    isNameDup
                                      ? "bg-rose-50 text-rose-800 border-rose-300 shadow-sm"
                                      : isAgencyDup
                                      ? "bg-amber-50 text-amber-900 border-amber-300 shadow-sm"
                                      : doneCount > 0
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                                      : "bg-white text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold">{v.name}</span>
                                    <span className="text-slate-400">({v.agency})</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {doneCount > 0 && (
                                      <span className="bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded text-[9px]">
                                        ประเมินแล้ว {doneCount} ราย
                                      </span>
                                    )}
                                    {isNameDup && (
                                      <span className="bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded text-[8px] animate-pulse">
                                        🚨 ชื่อซ้ำซ้อน
                                      </span>
                                    )}
                                    {isAgencyDup && !isNameDup && (
                                      <span className="bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded text-[8px]">
                                        ⚠️ หน่วยงานซ้ำ ({agencyCounts[v.agency.trim().toLowerCase()]} คน)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    <Dashboard
                      candidates={candidates}
                      evaluations={evaluations}
                      onStartEvaluation={handleStartEvaluation}
                      isAdminView={false}
                      selectedRegion={selectedRegion}
                      userIsAdmin={user.isAdmin}
                    />
                  </div>
                )}

                {activeTab === "executive_dashboard" && user.isAdmin && (
                  <Dashboard
                    candidates={candidates}
                    evaluations={evaluations}
                    onStartEvaluation={handleStartEvaluation}
                    isAdminView={true}
                  />
                )}

                {activeTab === "google_sheets_map" && (
                  <GoogleSheetsMap evaluations={evaluations} />
                )}

                {activeTab === "admin_candidates" && user.isAdmin && (
                  <CandidateAdmin
                    candidates={candidates}
                    voters={voters}
                    onAddCandidate={handleAddCandidate}
                    onDeleteCandidate={handleDeleteCandidate}
                    onAddVoter={handleAddVoter}
                    onDeleteVoter={handleDeleteVoter}
                  />
                )}

                {activeTab === "top_leaderboard" && (
                  <Dashboard
                    candidates={candidates}
                    evaluations={evaluations}
                    onStartEvaluation={handleStartEvaluation}
                    isTopLeaderboardView={true}
                    selectedRegion={selectedRegion}
                    userIsAdmin={user.isAdmin}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/85 backdrop-blur-md py-6 text-center text-xs text-slate-300 z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-white drop-shadow-sm">ระบบการลงคะแนนการสรรหาปราชญ์เกษตรของแผ่นดิน ปี 2570</p>
          <p className="text-emerald-300 font-mono text-[10px] tracking-wide uppercase">
            กองนโยบายเทคโนโลยีเพื่อการเกษตรและเกษตรกรรมยั่งยืน สำนักงานปลัดกระทรวงเกษตรและสหกรณ์
          </p>
        </div>
      </footer>
    </div>
  );
}
