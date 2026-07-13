import React, { useState } from "react";
import { Candidate, Voter } from "../types";
import { Plus, Trash2, Award, Users, MapPin, Building, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface CandidateAdminProps {
  candidates: Candidate[];
  voters: Voter[];
  onAddCandidate: (cand: Omit<Candidate, "id">) => Promise<void>;
  onDeleteCandidate: (id: string) => Promise<void>;
  onAddVoter: (voter: Omit<Voter, "id">) => Promise<void>;
  onDeleteVoter: (id: string) => Promise<void>;
}

export default function CandidateAdmin({
  candidates,
  voters,
  onAddCandidate,
  onDeleteCandidate,
  onAddVoter,
  onDeleteVoter,
}: CandidateAdminProps) {
  const [adminTab, setAdminTab] = useState<"candidates" | "voters">("candidates");
  
  // Candidate form states
  const [candBranch, setCandBranch] = useState<1 | 2 | 3 | 4>(1);
  const [candName, setCandName] = useState("");
  const [candProvince, setCandProvince] = useState("");
  const [candDistrict, setCandDistrict] = useState("เขตตรวจราชการส่วนกลาง");
  const [candOrganization, setCandOrganization] = useState("");
  const [candError, setCandError] = useState("");
  const [candSuccess, setCandSuccess] = useState("");
  const [candSaving, setCandSaving] = useState(false);

  // Voter form states
  const [voterName, setVoterName] = useState("");
  const [voterAgency, setVoterAgency] = useState("");
  const [voterDistrict, setVoterDistrict] = useState("เขตตรวจราชการส่วนกลาง");
  const [voterError, setVoterError] = useState("");
  const [voterSuccess, setVoterSuccess] = useState("");
  const [voterSaving, setVoterSaving] = useState(false);

  const branches = [
    { code: 1, name: "สาขาปราชญ์เกษตรผู้ทรงภูมิปัญญาและมีคุณูปการต่อภาคการเกษตรไทย" },
    { code: 2, name: "สาขาปราชญ์เกษตรเศรษฐกิจพอเพียง" },
    { code: 3, name: "สาขาปราชญ์เกษตรดีเด่น" },
    { code: 4, name: "สาขาปราชญ์ผู้นำชุมชนและเครือข่าย" },
  ];

  const regions1to18 = [
    "เขตตรวจราชการส่วนกลาง",
    ...Array.from({ length: 18 }, (_, i) => `เขตตรวจราชการที่ ${i + 1}`)
  ];

  const getBranchLabel = (code: number) => {
    switch (code) {
      case 1: return "ผู้ทรงภูมิปัญญาและคุณูปการ";
      case 2: return "เศรษฐกิจพอเพียง";
      case 3: return "เกษตรดีเด่น";
      case 4: return "ผู้นำชุมชนและเครือข่าย";
      default: return "";
    }
  };

  const handleAddCandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandError("");
    setCandSuccess("");

    if (!candName.trim()) return setCandError("กรุณากรอกชื่อ-นามสกุล ปราชญ์เกษตร");
    if (!candProvince.trim()) return setCandError("กรุณากรอกจังหวัด");
    if (!candDistrict) return setCandError("กรุณาเลือกเขตตรวจราชการ");
    if (!candOrganization.trim()) return setCandError("กรุณากรอกหน่วยงาน/สังกัด/สมาคม");

    setCandSaving(true);
    try {
      await onAddCandidate({
        name: candName.trim(),
        branch: candBranch,
        province: candProvince.trim(),
        district: candDistrict,
        organization: candOrganization.trim()
      });

      setCandSuccess("เพิ่มรายชื่อผู้ได้รับการเสนอชื่อสำเร็จแล้ว!");
      setCandName("");
      setCandProvince("");
      setCandOrganization("");
    } catch (err) {
      setCandError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูล");
    } finally {
      setCandSaving(false);
    }
  };

  const handleAddVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoterError("");
    setVoterSuccess("");

    if (!voterName.trim()) return setVoterError("กรุณากรอกชื่อ-นามสกุลผู้ลงคะแนน");
    if (!voterAgency.trim()) return setVoterError("กรุณากรอกหน่วยงาน/สังกัด");
    if (!voterDistrict) return setVoterError("กรุณาเลือกเขตตรวจราชการ");

    setVoterSaving(true);
    try {
      await onAddVoter({
        name: voterName.trim(),
        agency: voterAgency.trim(),
        district: voterDistrict
      });

      setVoterSuccess("เพิ่มรายชื่อกรรมการ/ผู้มีสิทธิ์ลงคะแนนสำเร็จแล้ว!");
      setVoterName("");
      setVoterAgency("");
    } catch (err) {
      setVoterError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูล");
    } finally {
      setVoterSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Tab select between Candidates and Voters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-lg font-sans font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600 animate-pulse" />
            ระบบจัดการฐานข้อมูลปราชญ์เกษตรแผ่นดิน ปี 2570
          </h2>
          <p className="text-xs text-slate-500 mt-1">ผู้ดูแลระบบสามารถเพิ่ม/ลบ ข้อมูลผู้รับการเสนอชื่อ และผู้มีหน้าที่ลงคะแนนประจำเขต</p>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0 shadow-inner">
          <button
            id="admin_toggle_candidates"
            onClick={() => setAdminTab("candidates")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-sans font-bold transition-all cursor-pointer ${
              adminTab === "candidates"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            รายชื่อผู้ได้รับการเสนอชื่อ
          </button>
          <button
            id="admin_toggle_voters"
            onClick={() => setAdminTab("voters")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-sans font-bold transition-all cursor-pointer ${
              adminTab === "voters"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            กรรมการ/ผู้มีสิทธิ์ลงคะแนน
          </button>
        </div>
      </div>

      {adminTab === "candidates" ? (
        <div className="space-y-6">
          {/* Branch Selector for candidates */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">กรองข้อมูลรายชื่อตามสาขา</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              {branches.map((b) => (
                <button
                  id={`admin_cand_branch_${b.code}`}
                  key={b.code}
                  onClick={() => setCandBranch(b.code as 1 | 2 | 3 | 4)}
                  className={`px-4 py-2.5 rounded-2xl font-sans text-xs md:text-sm whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                    candBranch === b.code
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {getBranchLabel(b.code)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Candidate Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit space-y-4 shadow-sm">
              <div>
                <h3 className="text-md font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  เพิ่มรายชื่อผู้ได้รับการเสนอชื่อ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">ในสาขา: {getBranchLabel(candBranch)}</p>
              </div>

              <form onSubmit={handleAddCandSubmit} className="space-y-4">
                {candError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 font-bold shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{candError}</span>
                  </div>
                )}

                {candSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-sm">
                    {candSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    ชื่อ-นามสกุล ปราชญ์เกษตร
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Users className="w-4 h-4" />
                    </span>
                    <input
                      id="admin_cand_add_name"
                      type="text"
                      placeholder="เช่น นายปัญญา ทองดี"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    จังหวัด
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      id="admin_cand_add_province"
                      type="text"
                      placeholder="เช่น สระบุรี, เพชรบุรี"
                      value={candProvince}
                      onChange={(e) => setCandProvince(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    เขตตรวจราชการ
                  </label>
                  <select
                    id="admin_cand_add_district"
                    value={candDistrict}
                    onChange={(e) => setCandDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 outline-none text-xs md:text-sm font-semibold transition-all cursor-pointer"
                  >
                    {regions1to18.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                    หน่วยงานที่ส่ง / สังกัด / สมาคม
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      id="admin_cand_add_organization"
                      type="text"
                      placeholder="เช่น ศูนย์เรียนรู้เพื่อการพัฒนาที่ยั่งยืน"
                      value={candOrganization}
                      onChange={(e) => setCandOrganization(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <button
                  id="admin_cand_submit_btn"
                  type="submit"
                  disabled={candSaving}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl py-3 transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm shadow-md cursor-pointer"
                >
                  {candSaving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>บันทึกผู้สมัครเข้าระบบ</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Candidates List Display */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-md font-sans font-extrabold text-slate-900">
                  รายชื่อผู้ได้รับการเสนอชื่อในสาขานี้ ({candidates.filter(c => c.branch === candBranch).length} ราย)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">แสดงข้อมูลรายชื่อผู้เข้าสรรหาที่ได้รับการเพิ่มโดยผู้ดูแลระบบ</p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                {candidates.filter(c => c.branch === candBranch).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic font-semibold">
                    ยังไม่มีการบันทึกรายชื่อผู้สมัครในสาขานี้
                  </div>
                ) : (
                  candidates.filter(c => c.branch === candBranch).map((c) => (
                    <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-sans font-bold text-slate-900 text-sm md:text-base">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          จ.{c.province} • {c.organization}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                          ID: {c.id} • {c.district}
                        </span>
                      </div>
                      <button
                        id={`btn_delete_candidate_${c.id}`}
                        onClick={() => onDeleteCandidate(c.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition-all cursor-pointer shadow-sm"
                        title="ลบรายชื่อผู้ได้รับการเสนอชื่อ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Voter Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit space-y-4 shadow-sm">
            <div>
              <h3 className="text-md font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-emerald-600" />
                เพิ่มกรรมการผู้ลงคะแนน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">กำหนดบุคคลและหน่วยงานที่มีสิทธิ์ลงคะแนนประจำเขต</p>
            </div>

            <form onSubmit={handleAddVoterSubmit} className="space-y-4">
              {voterError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 font-bold shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{voterError}</span>
                </div>
              )}

              {voterSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-sm">
                  {voterSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                  ชื่อ-นามสกุล กรรมการ
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    id="admin_voter_add_name"
                    type="text"
                    placeholder="เช่น ดร.วิทยา รักษ์แผ่นดิน"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                  หน่วยงาน / สังกัด
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    id="admin_voter_add_agency"
                    type="text"
                    placeholder="เช่น กรมส่งเสริมการเกษตร"
                    value={voterAgency}
                    onChange={(e) => setVoterAgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 placeholder-slate-400 outline-none text-xs md:text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 ml-1">
                  เขตตรวจราชการที่รับผิดชอบ
                </label>
                <select
                  id="admin_voter_add_district"
                  value={voterDistrict}
                  onChange={(e) => setVoterDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 outline-none text-xs md:text-sm font-semibold transition-all cursor-pointer"
                >
                  {regions1to18.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="admin_voter_submit_btn"
                type="submit"
                disabled={voterSaving}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl py-3 transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm shadow-md cursor-pointer"
              >
                {voterSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>บันทึกชื่อผู้ลงคะแนน</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Voters List Display */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-md font-sans font-extrabold text-slate-900">
                รายชื่อบุคคลและหน่วยงานที่มีสิทธิ์ลงคะแนน ({voters.length} ราย)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">แบ่งตามเขตตรวจราชการที่ 1-18 (เพิ่มโดย Admin)</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {voters.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic font-semibold">
                  ยังไม่มีการเพิ่มรายชื่อผู้มีสิทธิ์ลงคะแนนในระบบ
                </div>
              ) : (
                voters.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 text-sm">{v.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                        {v.agency}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                        {v.district}
                      </span>
                    </div>
                    <button
                      id={`btn_delete_voter_${v.id}`}
                      onClick={() => onDeleteVoter(v.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="ลบผู้มีสิทธิ์ลงคะแนน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
