import React, { useState } from "react";
import { Lock, Unlock, XCircle, User, Award, ShieldAlert, ArrowLeft, Building, Shield, CheckCircle2, Search, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Voter } from "../types";

interface LoginProps {
  onLogin: (name: string, agency: string, isAdmin: boolean, phone?: string) => void;
  voters: Voter[];
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}

const regions = [
  { name: "เขตตรวจราชการส่วนกลาง", code: "CENTRAL", provinces: "กรุงเทพมหานคร" },
  { name: "เขตตรวจราชการที่ 1", code: "REGION 1", provinces: "ชัยนาท, พระนครศรีอยุธยา, ลพบุรี, สระบุรี, สิงห์บุรี, อ่างทอง" },
  { name: "เขตตรวจราชการที่ 2", code: "REGION 2", provinces: "นนทบุรี, ปทุมธานี, นครปฐม, สมุทรปราการ" },
  { name: "เขตตรวจราชการที่ 3", code: "REGION 3", provinces: "กาญจนบุรี, ราชบุรี, สุพรรณบุรี" },
  { name: "เขตตรวจราชการที่ 4", code: "REGION 4", provinces: "ประจวบคีรีขันธ์, เพชรบุรี, สมุทรสงคราม, สมุทรสาคร" },
  { name: "เขตตรวจราชการที่ 5", code: "REGION 5", provinces: "ชุมพร, นครศรีธรรมราช, พัทลุง, สุราษฎร์ธานี, สงขลา" },
  { name: "เขตตรวจราชการที่ 6", code: "REGION 6", provinces: "กระบี่, ตรัง, พังงา, ภูเก็ต, ระนอง, สตูล" },
  { name: "เขตตรวจราชการที่ 7", code: "REGION 7", provinces: "นราธิวาส, ปัตตานี, ยะลา" },
  { name: "เขตตรวจราชการที่ 8", code: "REGION 8", provinces: "ฉะเชิงเทรา, ชลบุรี, ระยอง" },
  { name: "เขตตรวจราชการที่ 9", code: "REGION 9", provinces: "จันทบุรี, ตราด, นครนายก, ปราจีนบุรี, สระแก้ว" },
  { name: "เขตตรวจราชการที่ 10", code: "REGION 10", provinces: "บึงกาฬ, เลย, หนองคาย, หนองบัวลำภู, อุดรธานี" },
  { name: "เขตตรวจราชการที่ 11", code: "REGION 11", provinces: "นครพนม, มุกดาหาร, สกลนคร" },
  { name: "เขตตรวจราชการที่ 12", code: "REGION 12", provinces: "กาฬสินธุ์, ขอนแก่น, มหาสารคาม, ร้อยเอ็ด" },
  { name: "เขตตรวจราชการที่ 13", code: "REGION 13", provinces: "ชัยภูมิ, นครราชสีมา, บุรีรัมย์, สุรินทร์" },
  { name: "เขตตรวจราชการที่ 14", code: "REGION 14", provinces: "ยโสธร, ศรีสะเกษ, อำนาจเจริญ, อุบลราชธานี" },
  { name: "เขตตรวจราชการที่ 15", code: "REGION 15", provinces: "เชียงใหม่, แม่ฮ่องสอน, ลำปาง, ลำพูน" },
  { name: "เขตตรวจราชการที่ 16", code: "REGION 16", provinces: "เชียงราย, น่าน, พะเยา, แพร่" },
  { name: "เขตตรวจราชการที่ 17", code: "REGION 17", provinces: "ตาก, พิษณุโลก, เพชรบูรณ์, สุโขทัย, อุตรดิตถ์" },
  { name: "เขตตรวจราชการที่ 18", code: "REGION 18", provinces: "กำแพงเพชร, นครสวรรค์, พิจิตร, อุทัยธานี" },
];

export default function Login({ onLogin, voters, selectedRegion, onSelectRegion }: LoginProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [selectedAgencyOption, setSelectedAgencyOption] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // States for hidden admin passcode login
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Region status and Admin configuration mode
  const [regionStatuses, setRegionStatuses] = useState<Record<string, boolean>>({});
  const [isAdminConfigMode, setIsAdminConfigMode] = useState(false);
  const [regionError, setRegionError] = useState("");

  // Fetch statuses on load
  React.useEffect(() => {
    fetchRegionStatuses();
  }, []);

  const fetchRegionStatuses = async () => {
    try {
      const res = await fetch("/api/regions/status");
      if (res.ok) {
        const data = await res.json();
        setRegionStatuses(data);
      }
    } catch (err) {
      console.error("Failed to fetch region statuses", err);
    }
  };

  const handleToggleRegionStatus = async (regionCode: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/regions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionCode, active: !currentStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRegionStatuses(data.statuses);
        }
      }
    } catch (err) {
      console.error("Failed to toggle region status", err);
    }
  };

  const handleBulkUpdateRegionStatus = async (active: boolean) => {
    try {
      const res = await fetch("/api/regions/status/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRegionStatuses(data.statuses);
        }
      }
    } catch (err) {
      console.error("Failed to bulk update region statuses", err);
    }
  };

  const handleProceedToAdminDashboard = () => {
    onSelectRegion("เขตตรวจราชการส่วนกลาง");
    onLogin("ผู้ดูแลระบบ", "ส่วนกลาง", true);
  };

  // Filter voters by chosen region
  const regionVoters = voters.filter((v) => v.district === selectedRegion);

  // Distinct agencies added by Admin for this district
  const adminAgencies = Array.from(new Set(regionVoters.map((v) => v.agency).filter(Boolean)));

  // Fallback / standard agencies list
  const defaultAgencies: string[] = [];

  // Combine unique ones from Admin + defaults
  const availableAgencies = Array.from(new Set([...adminAgencies, ...defaultAgencies]));

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    if (adminPassword.trim().toUpperCase() === "ADMIN2570") {
      setIsAdminConfigMode(true);
      setShowAdminInput(false);
      setAdminPassword("");
    } else {
      setAdminError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleAgencyOptionChange = (val: string) => {
    setSelectedAgencyOption(val);
    if (val !== "custom") {
      setAgency(val);
    } else {
      setAgency(customAgency);
    }
  };

  const handleCustomAgencyChange = (val: string) => {
    setCustomAgency(val);
    setAgency(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุลของท่าน");
      return;
    }
    if (!phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์ของท่าน");
      return;
    }
    if (!agency.trim()) {
      setError("กรุณาเลือกหรือระบุหน่วยงาน/สังกัด");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "COMMITTEE", name: name.trim(), agency: agency.trim(), phone: phone.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.user.name, data.user.agency, data.user.role === "admin", phone.trim());
      } else {
        setError(data.error || "ไม่สามารถเข้าสู่ระบบได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter regions based on search
  const filteredRegions = regions.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.provinces.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(r => ({
    ...r,
    isActive: regionStatuses[r.code] !== false
  }));

  return (
    <div className="min-h-screen theme-bg flex flex-col justify-between p-4 md:p-8 selection:bg-emerald-500 selection:text-slate-900">
      
      {/* Decorative subtle floating ambient light circles */}
      <div className="fixed -top-12 -left-12 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-12 -right-12 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 text-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            <Award className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-xl md:text-2xl tracking-tight text-slate-900">
              ระบบการลงคะแนนการสรรหาปราชญ์เกษตรของแผ่นดิน ปี 2570
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-0.5">
              Ministry of Agriculture and Cooperatives
            </p>
          </div>
        </div>
        
        <div className="text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 self-start md:self-auto shadow-sm text-emerald-800">
          ระบบประเมินออนไลน์และรายงานคะแนนเรียลไทม์
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex items-center justify-center py-6 z-10">
        <AnimatePresence mode="wait">
          {!selectedRegion ? (
            /* STEP 1: Select Region 1-18 Screen */
            <motion.div
              key="region_selection"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03),0_4px_12px_-2px_rgba(0,0,0,0.02)] rounded-2xl p-5 md:p-6 space-y-5 relative text-slate-800"
            >
              {/* Subtle Admin Trigger in top-right */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {isAdminConfigMode && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 shadow-lg rounded-2xl p-1.5 text-xs animate-in fade-in zoom-in duration-200">
                    <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl uppercase font-sans shrink-0">
                      แผงควบคุมโหวต
                    </span>
                    
                    {/* Open All Votes */}
                    <button
                      id="btn_open_all_votes"
                      type="button"
                      onClick={() => handleBulkUpdateRegionStatus(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border border-emerald-500 hover:border-emerald-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 text-[11px] font-black"
                      title="เปิดโหวตทุกเขต (Open All)"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-white text-emerald-600" />
                      <span>เปิดโหวตทั้งหมด</span>
                    </button>

                    {/* Close All Votes */}
                    <button
                      id="btn_close_all_votes"
                      type="button"
                      onClick={() => handleBulkUpdateRegionStatus(false)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl border border-rose-500 hover:border-rose-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 text-[11px] font-black"
                      title="ปิดโหวตทุกเขต (Close All)"
                    >
                      <XCircle className="w-3.5 h-3.5 fill-white text-rose-600" />
                      <span>ปิดโหวตทั้งหมด</span>
                    </button>

                    {/* Enter Admin Dashboard */}
                    <button
                      id="btn_go_to_admin_dash"
                      type="button"
                      onClick={handleProceedToAdminDashboard}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl border border-blue-500 hover:border-blue-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 text-[11px] font-black"
                      title="เข้าสู่แผงจัดการผู้สมัคร/กรรมการ"
                    >
                      <Shield className="w-3.5 h-3.5 text-white" />
                      <span>ระบบหลังบ้าน</span>
                    </button>

                    {/* Exit admin config mode */}
                    <button
                      id="btn_exit_admin_config"
                      type="button"
                      onClick={() => {
                        setIsAdminConfigMode(false);
                        setShowAdminInput(false);
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-800 rounded-lg transition-all cursor-pointer"
                      title="ออกจากโหมดผู้ดูแล"
                    >
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  </div>
                )}

                {!isAdminConfigMode && (
                  <>
                    {!showAdminInput ? (
                      <button
                        id="btn_show_admin_login"
                        onClick={() => setShowAdminInput(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-xl border border-amber-200 hover:border-amber-300 shadow-sm transition-all cursor-pointer"
                        title="สำหรับผู้ดูแลระบบ (Admin)"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-bold font-sans">ผู้ดูแลระบบ (Admin)</span>
                      </button>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleAdminLoginSubmit}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-inner"
                      >
                        <input
                          id="input_admin_password"
                          type="password"
                          placeholder="รหัสผ่านผู้ดูแล"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="bg-transparent text-slate-800 outline-none px-2 text-xs w-28 placeholder-slate-400"
                        />
                        <button
                          id="btn_admin_submit"
                          type="submit"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-all"
                        >
                          ตกลง
                        </button>
                        <button
                          id="btn_admin_cancel"
                          type="button"
                          onClick={() => {
                            setShowAdminInput(false);
                            setAdminPassword("");
                            setAdminError("");
                          }}
                          className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </motion.form>
                    )}
                  </>
                )}
                {adminError && (
                  <div className="absolute top-12 right-0 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-sm">
                    {adminError}
                  </div>
                )}
              </div>

              <div className="text-center space-y-1.5 max-w-2xl mx-auto border-b border-slate-100 pb-4">
                <span className="text-[10px] font-extrabold font-mono tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg uppercase inline-block">
                  ขั้นตอนแรก / Step 1
                </span>
                <h2 className="text-xl md:text-2xl font-sans font-extrabold text-slate-900 tracking-tight">
                  กรุณาเลือกเขตตรวจราชการของท่าน
                </h2>
                <p className="text-xs text-slate-500">
                  เพื่อลงชื่อเข้าใช้งานระบบประเมินคะแนนรายบุคคลประจำเขตตรวจราชการ
                </p>

                {/* Quick Search for Regions */}
                <div className="relative max-w-sm mx-auto pt-3">
                  <span className="absolute left-3 top-[23px] -translate-y-1/2 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="search_region_input"
                    type="text"
                    placeholder="ค้นหาเขตตรวจราชการ หรือชื่อจังหวัด..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-emerald-500 rounded-xl py-1.5 pl-9.5 pr-4 text-slate-800 text-xs placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Error banner if voting is closed */}
              {regionError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-start gap-2 shadow-sm"
                >
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-600 animate-bounce" />
                  <span>{regionError}</span>
                </motion.div>
              )}

              {/* Regions Grid - Modern Bento Box Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 pt-2">
                {filteredRegions.map((r, index) => {
                  const isActive = r.isActive;
                  return (
                    <motion.div
                      id={`btn_region_select_${index + 1}`}
                      key={r.name}
                      role="button"
                      tabIndex={0}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (!isActive && !isAdminConfigMode) {
                            setRegionError(`ขออภัย เขตตรวจราชการ "${r.name}" ปิดรับการโหวตคะแนนชั่วคราว`);
                            setTimeout(() => setRegionError(""), 5000);
                            return;
                          }
                          onSelectRegion(r.name);
                        }
                      }}
                      onClick={() => {
                        if (!isActive && !isAdminConfigMode) {
                          setRegionError(`ขออภัย เขตตรวจราชการ "${r.name}" ปิดรับการโหวตคะแนนชั่วคราว`);
                          setTimeout(() => setRegionError(""), 5000);
                          return;
                        }
                        onSelectRegion(r.name);
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer group shadow-sm hover:shadow-md relative focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isActive
                          ? "bg-slate-50 hover:bg-emerald-50/50 border-slate-200/60 hover:border-emerald-500/40 text-slate-800"
                          : "bg-slate-100/50 opacity-75 border-slate-200 hover:bg-rose-50/20 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {/* Voting Status Indicator / Toggle */}
                      {isAdminConfigMode ? (
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur border border-slate-200/50 px-2 py-1 rounded-xl shadow-sm">
                          <span className={`text-[9px] font-black tracking-tight ${isActive ? "text-emerald-700" : "text-rose-600"}`}>
                            {isActive ? "เปิดโหวต" : "ปิดโหวต"}
                          </span>
                          <button
                            id={`btn_toggle_status_${r.code}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRegionStatus(r.code, isActive);
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                            title={isActive ? "คลิกเพื่อปิดโหวตในเขตนี้" : "คลิกเพื่อเปิดโหวตในเขตนี้"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur border border-slate-100 px-1.5 py-0.5 rounded-lg shadow-sm">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                          <span className={`text-[8px] font-black ${isActive ? "text-emerald-700" : "text-rose-600"}`}>
                            {isActive ? "เปิดโหวต" : "ปิดโหวต"}
                          </span>
                        </div>
                      )}

                      <span className={`text-[10px] font-mono font-black ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                        {r.code}
                      </span>
                      <span className={`text-sm font-sans font-extrabold mt-1 ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                        {r.name}
                      </span>
                      <span className={`text-[10px] mt-2 line-clamp-2 h-7.5 leading-relaxed group-hover:text-slate-600 ${isActive ? "text-slate-500" : "text-slate-400/80"}`}>
                        {r.provinces}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Login form for selected Region */
            <motion.div
              key="login_form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-5 md:p-6 relative overflow-hidden text-slate-800"
            >
              {/* Back Button */}
              <button
                id="btn_back_to_regions"
                onClick={() => onSelectRegion(null)}
                className="absolute top-4 left-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>เปลี่ยนเขต</span>
              </button>

              <div className="text-center pt-3 mb-5">
                <span className="text-[10px] font-black font-mono tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg uppercase inline-block shadow-sm">
                  {selectedRegion}
                </span>
                <h2 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 mt-2.5">
                  เข้าสู่ระบบผู้ประเมิน
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรุณากรอกชื่อและเลือกสังกัดของท่านเพื่อเข้าประเมินคะแนนปราชญ์เกษตร
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-bold shadow-sm"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Name Input */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    ชื่อ-นามสกุล
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="login_custom_name"
                      type="text"
                      placeholder="เช่น นายบุญส่ง รักทำกิน"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="login_custom_phone"
                      type="tel"
                      placeholder="เช่น 0812345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                {/* Agency Selection Dropdown */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1 flex justify-between items-center">
                    <span>หน่วยงาน / สังกัด</span>
                    {adminAgencies.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" /> กำหนดโดย Admin
                      </span>
                    )}
                  </label>
                  <select
                    id="login_agency_select"
                    value={selectedAgencyOption}
                    onChange={(e) => handleAgencyOptionChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 px-3 text-slate-800 outline-none text-xs md:text-sm font-semibold transition-all cursor-pointer"
                  >
                    <option value="">-- กรุณาเลือกหน่วยงาน / สังกัดของท่าน --</option>
                    {availableAgencies.map((agencyOpt) => (
                      <option key={agencyOpt} value={agencyOpt}>
                        {agencyOpt}
                      </option>
                    ))}
                    <option value="custom">✍️ ระบุสังกัดอื่น ๆ... (พิมพ์ระบุเอง)</option>
                  </select>
                </div>

                {/* Custom Agency Input (revealed when "custom" is selected) */}
                {selectedAgencyOption === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-1"
                  >
                    <label className="block text-slate-500 text-xs font-bold mb-1 ml-1">
                      ระบุสังกัดของท่าน (กรุณาพิมพ์ระบุ)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Building className="w-4 h-4" />
                      </span>
                      <input
                        id="login_custom_agency"
                        type="text"
                        placeholder="กรุณากรอกหน่วยงานสังกัด"
                        value={customAgency}
                        onChange={(e) => handleCustomAgencyChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                <button
                  id="btn_login_submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-50 hover:to-teal-400 text-white font-extrabold rounded-xl py-3.5 transition-all duration-300 shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 text-xs md:text-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>เข้าสู่ระบบเพื่อเริ่มประเมิน</span>
                  )}
                </button>
              </form>

              {/* Back indicator or info */}
              {regionVoters.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-2 items-start text-emerald-800 text-[11px] font-medium leading-relaxed shadow-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    ระบบตรวจพบการตั้งค่าคณะกรรมการเฉพาะในเขตนี้โดยผู้ดูแลระบบแล้ว
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-7xl mx-auto border-t border-white/10 pt-4 text-center text-[11px] text-white/90 z-10 space-y-1">
        <p>© 2026 สำนักงานปลัดกระทรวงเกษตรและสหกรณ์. สงวนลิขสิทธิ์.</p>
        <p className="text-white/70">
          ระบบผ่านการรับรองความถูกต้อง มีระบบความมั่นคงปลอดภัยไซเบอร์และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>
      </div>
    </div>
  );
}
