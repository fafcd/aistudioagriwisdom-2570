import React, { useState, useEffect } from "react";
import { Candidate, Evaluation, CandidateStats } from "../types";
import { Award, TrendingUp, Users, ClipboardCheck, Search, CheckCircle2, ChevronRight, AlertTriangle, Check, RefreshCw, MoreVertical, Copy, ExternalLink, FileText, Info, X, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const regionsDetailed = [
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

interface DashboardProps {
  candidates: Candidate[];
  evaluations: Evaluation[];
  onStartEvaluation: (branchCode: 1 | 2 | 3 | 4, candidateId: string) => void;
  isAdminView?: boolean;
  selectedRegion?: string | null;
  userIsAdmin?: boolean;
  isTopLeaderboardView?: boolean;
}

export default function Dashboard({ candidates, evaluations, onStartEvaluation, isAdminView = false, selectedRegion = null, userIsAdmin = false, isTopLeaderboardView = false }: DashboardProps) {
  const [activeBranch, setActiveBranch] = useState<1 | 2 | 3 | 4>(1);
  const [topTabBranch, setTopTabBranch] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<CandidateStats[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentVoterRegion, setCurrentVoterRegion] = useState<string | null>(selectedRegion);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // Region status state and functions
  const [regionStatuses, setRegionStatuses] = useState<Record<string, boolean>>({});

  const fetchRegionStatuses = async () => {
    try {
      const res = await fetch("/api/regions/status");
      if (res.ok) {
        const data = await res.json();
        setRegionStatuses(data);
      }
    } catch (err) {
      console.error("Failed to fetch region statuses in dashboard:", err);
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
      console.error("Failed to toggle region status in dashboard:", err);
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
      console.error("Failed to bulk update region statuses in dashboard", err);
    }
  };

  const getRegionCodeByName = (name: string | null | undefined): string => {
    if (!name) return "CENTRAL";
    if (name.includes("ส่วนกลาง")) return "CENTRAL";
    const match = name.match(/\d+/);
    if (match) return `REGION ${match[0]}`;
    return "CENTRAL";
  };

  const isRegionActive = (regionName: string | null | undefined) => {
    const code = getRegionCodeByName(regionName);
    return regionStatuses[code] !== false;
  };

  // Contextual Menu & Detail Drawer States
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    candidateId: string;
  } | null>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [selectedDetailCandidate, setSelectedDetailCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    setCurrentVoterRegion(selectedRegion);
    if (selectedRegion) {
      setSelectedDistrict(selectedRegion);
    } else {
      setSelectedDistrict("ทั้งหมด");
    }
  }, [selectedRegion]);

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      await fetchRegionStatuses();
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [evaluations, candidates]);

  const branches = [
    { code: 1, name: "สาขาปราชญ์เกษตรผู้ทรงภูมิปัญญาและมีคุณูปการต่อภาคการเกษตรไทย" },
    { code: 2, name: "สาขาปราชญ์เกษตรเศรษฐกิจพอเพียง" },
    { code: 3, name: "สาขาปราชญ์เกษตรดีเด่น" },
    { code: 4, name: "สาขาปราชญ์ผู้นำชุมชนและเครือข่าย" },
  ];

  const matchDistricts = (d1: string | null | undefined, d2: string | null | undefined) => {
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    
    const getNum = (s: string) => {
      const match = s.match(/\d+/);
      if (match) return parseInt(match[0], 10);
      if (s.includes("ส่วนกลาง") || s.toLowerCase().includes("central")) return "CENTRAL";
      return s.trim();
    };
    
    return getNum(d1) === getNum(d2);
  };

  const regions = [
    "ทั้งหมด",
    "เขตตรวจราชการส่วนกลาง",
    ...Array.from({ length: 18 }, (_, i) => `เขตตรวจราชการที่ ${i + 1}`)
  ];

  // Helper calculations filtered by district
  const candidatesFilteredByDistrict = selectedDistrict === "ทั้งหมด"
    ? candidates
    : candidates.filter(c => matchDistricts(c.district, selectedDistrict));

  const totalNomineesInDistrict = candidatesFilteredByDistrict.length;

  const branch1Count = candidatesFilteredByDistrict.filter(c => c.branch === 1).length;
  const branch2Count = candidatesFilteredByDistrict.filter(c => c.branch === 2).length;
  const branch3Count = candidatesFilteredByDistrict.filter(c => c.branch === 3).length;
  const branch4Count = candidatesFilteredByDistrict.filter(c => c.branch === 4).length;

  const evaluatedCandidatesList = candidatesFilteredByDistrict.filter(cand => 
    evaluations.some(ev => ev.candidateId === cand.id)
  );
  const evaluatedCount = evaluatedCandidatesList.length;
  const completionPercentage = totalNomineesInDistrict > 0 
    ? Math.round((evaluatedCount / totalNomineesInDistrict) * 100) 
    : 0;

  // Filter stats by selected district
  const statsInDistrict = selectedDistrict === "ทั้งหมด"
    ? stats
    : stats.filter(s => matchDistricts(s.district, selectedDistrict));

  // Calculate overall top candidates with joint ranks in the district
  const rankedOverallStats: (CandidateStats & { rank: number })[] = [];
  const evaluatedInDistrict = statsInDistrict.filter(s => s.voteCount > 0);
  const sortedOverallInDistrict = [...evaluatedInDistrict].sort((a, b) => b.averageScore - a.averageScore);

  let currentOverallRank = 1;
  let prevOverallScore: number | null = null;

  sortedOverallInDistrict.forEach((s, idx) => {
    if (prevOverallScore === null) {
      rankedOverallStats.push({ ...s, rank: 1 });
      prevOverallScore = s.averageScore;
    } else {
      const rank = s.averageScore === prevOverallScore ? currentOverallRank : (rankedOverallStats[rankedOverallStats.length - 1].rank + 1);
      currentOverallRank = rank;
      rankedOverallStats.push({ ...s, rank: currentOverallRank });
      prevOverallScore = s.averageScore;
    }
  });

  const topOverallCandidates = rankedOverallStats.filter(s => s.rank <= 2);

  // Calculate top candidates with joint ranks for each branch specifically in the district
  const getTopCandidatesForBranch = (bCode: number) => {
    const statsInBranch = statsInDistrict.filter(s => s.branch === bCode && s.voteCount > 0);
    const sorted = [...statsInBranch].sort((a, b) => b.averageScore - a.averageScore);
    const ranked: (CandidateStats & { rank: number })[] = [];
    let currentRank = 1;
    let prevScore: number | null = null;
    sorted.forEach((s) => {
      if (prevScore === null) {
        ranked.push({ ...s, rank: 1 });
        prevScore = s.averageScore;
      } else {
        const rank = s.averageScore === prevScore ? currentRank : (ranked[ranked.length - 1].rank + 1);
        currentRank = rank;
        ranked.push({ ...s, rank: currentRank });
        prevScore = s.averageScore;
      }
    });
    return ranked.filter(s => s.rank <= 2);
  };

  const topCandidatesForSelectedBranch = getTopCandidatesForBranch(topTabBranch);

  // Filter candidates of active branch
  const filteredStats = statsInDistrict
    .filter(s => s.branch === activeBranch)
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.province.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.averageScore - a.averageScore);

  // Assign joint ranks for the leaderboard
  const rankedFilteredStats: (CandidateStats & { rank: number })[] = [];
  let currentRankFiltered = 1;
  let prevScoreFiltered: number | null = null;

  filteredStats.forEach((s, idx) => {
    if (prevScoreFiltered === null) {
      rankedFilteredStats.push({ ...s, rank: 1 });
      prevScoreFiltered = s.averageScore;
    } else {
      const rank = s.averageScore === prevScoreFiltered ? currentRankFiltered : (rankedFilteredStats[rankedFilteredStats.length - 1].rank + 1);
      currentRankFiltered = rank;
      rankedFilteredStats.push({ ...s, rank: currentRankFiltered });
      prevScoreFiltered = s.averageScore;
    }
  });

  const activeBranchCandidates = candidates
    .filter(c => c.branch === activeBranch)
    .filter(c => {
      if (isAdminView) return true;
      if (showAllRegions && userIsAdmin) return true;
      if (!currentVoterRegion) return false;
      return matchDistricts(c.district, currentVoterRegion);
    });

  const getBranchLabel = (code: number) => {
    switch (code) {
      case 1: return "ผู้ทรงภูมิปัญญาและคุณูปการ";
      case 2: return "เศรษฐกิจพอเพียง";
      case 3: return "เกษตรดีเด่น";
      case 4: return "ผู้นำชุมชนและเครือข่าย";
      default: return "";
    }
  };

  // Get question label for details
  const getQuestionText = (key: string, branchCode: number) => {
    const questions: Record<string, string> = {
      honesty_ethics: "1.1 ความซื่อสัตย์ สุจริต คุณธรรม และจริยธรรม (5 คะแนน)",
      sacrifice_social: "1.2 การอุทิศตน เสียสละ และบำเพ็ญประโยชน์ (5 คะแนน)",
      perseverance: "1.3 ความวิริยะ อุตสาหะ ในอาชีพ (5 คะแนน)",
      role_model: "1.4 การเป็นแบบอย่างที่ดีในการดำรงชีวิต (5 คะแนน)",
      
      wisdom_creation: "2.1 เป็นเจ้าของ/ผู้รวบรวมพัฒนาภูมิปัญญา (10 คะแนน)",
      wisdom_system: "2.2 ความเป็นระบบขององค์ความรู้หรือภูมิปัญญา (10 คะแนน)",
      wisdom_initiative: "2.3 ความคิดริเริ่มสร้างสรรค์และการพัฒนา (10 คะแนน)",
      wisdom_acceptance: "3.1 การได้รับการยอมรับในผลงานและภูมิปัญญา (10 คะแนน)",
      wisdom_contribution: "3.2 ผลงานที่สร้างคุณประโยชน์ต่อภาคการเกษตร (10 คะแนน)",
      wisdom_learning_center: "3.3 การเป็นศูนย์เรียนรู้หรือแหล่งถ่ายทอด (10 คะแนน)",
      wisdom_dissemination: "4.1 กิจกรรมการขยายผลหรือถ่ายทอดความรู้ (10 คะแนน)",
      wisdom_dissemination_impact: "4.2 ผลสัมฤทธิ์ของผู้ที่นำไปปฏิบัติตาม (10 คะแนน)",

      moderation: "2.1 ความพอประมาณในการประกอบอาชีพและชีวิต (10 คะแนน)",
      reasonableness: "2.2 ความมีเหตุผลและการบริหารจัดการความเสี่ยง (10 คะแนน)",
      immunity_finance: "2.3 การมีภูมิคุ้มกันและจัดการรายได้/รายจ่าย (10 คะแนน)",
      model_family: "3.1 เป็นต้นแบบครอบครัว/ชุมชนพอเพียง (10 คะแนน)",
      leadership_network: "3.2 การเป็นผู้นำสร้างและพัฒนาเครือข่าย (10 คะแนน)",
      spreading_dedication: "3.3 การอุทิศตนเพื่อเผยแพร่แนวคิดพอเพียง (10 คะแนน)",
      network_size_success: "4.1 จำนวนสมาชิกและผลสัมฤทธิ์ของเครือข่าย (10 คะแนน)",
      network_cooperation: "4.2 ผลการดำเนินกิจกรรมของเครือข่ายร่วมกัน (10 คะแนน)",

      initiative_tech: "2.1 ความคิดริเริ่มและการนำเทคโนโลยีมาพัฒนา (10 คะแนน)",
      productivity_income: "2.2 ผลผลิตและรายได้จากการทำการเกษตร (10 คะแนน)",
      eco_friendly: "2.3 ความเป็นมิตรต่อสิ่งแวดล้อมและยั่งยืน (10 คะแนน)",
      awards_recognition: "3.1 การได้รับรางวัลและการยอมรับในระดับสากล (10 คะแนน)",
      speaker_trainer: "3.2 การเป็นวิทยากรและผู้ถ่ายทอดความรู้ (10 คะแนน)",
      learning_center: "3.3 การจัดตั้งศูนย์เรียนรู้ด้านเกษตรกรรมดีเด่น (10 คะแนน)",
      benefit_activities: "4.1 กิจกรรมบำเพ็ญประโยชน์เพื่อเกษตรกร/สังคม (10 คะแนน)",
      community_problem_solving: "4.2 ผลงานแก้ปัญหาและยกระดับคุณภาพชีวิต (10 คะแนน)",

      leader_establishment: "2.1 บทบาทจัดตั้งกลุ่มหรือองค์กรในชุมชน (10 คะแนน)",
      community_management: "2.2 การบริหารจัดการและแก้ไขปัญหาชุมชน (10 คะแนน)",
      leader_communication: "2.3 การสื่อสารและการใช้เทคโนโลยีในเครือข่าย (10 คะแนน)",
      network_strength: "3.1 ความเข้มแข็งและขนาดเชื่อมโยงเครือข่าย (10 คะแนน)",
      network_activities: "3.2 การทำกิจกรรมของเครือข่ายต่อเนื่อง (10 คะแนน)",
      network_collaboration: "3.3 ผลการทำงานร่วมกันเป็นประโยชน์วงกว้าง (10 คะแนน)",
      member_impact: "4.1 ผลกระทบเชิงบวกต่อรายได้และความเป็นอยู่ (10 คะแนน)",
      network_sustainability: "4.2 ความยั่งยืนของเครือข่ายและระบบงาน (10 คะแนน)"
    };

    const simplifiedKey = key.replace(/^b\d_q\d_\d_/, "").replace(/^b\d_/, "");
    return questions[simplifiedKey] || key;
  };

  const selectedStats = stats.find(s => s.candidateId === selectedCandidateId);
  const selectedCandidateEvaluations = evaluations.filter(e => e.candidateId === selectedCandidateId);

  // --- COMMITTEE AUDIT & DUPLICATE DETECTION LOGIC ---
  // Parse all unique evaluations to find who has submitted scores
  const getCommitteeAuditData = () => {
    // 1. Group evaluations by (Name + Agency) to determine unique active committee evaluators
    const committeeMap = new Map<string, { name: string; agency: string; district: string; evalCount: number; lastActive: string }>();

    evaluations.forEach((ev) => {
      const key = `${ev.committeeName.trim().toLowerCase()}::${ev.committeeAgency.trim().toLowerCase()}`;
      const existing = committeeMap.get(key);
      if (existing) {
        existing.evalCount += 1;
        if (new Date(ev.timestamp).getTime() > new Date(existing.lastActive).getTime()) {
          existing.lastActive = ev.timestamp;
        }
      } else {
        committeeMap.set(key, {
          name: ev.committeeName.trim(),
          agency: ev.committeeAgency.trim(),
          district: ev.candidateDistrict || "ส่วนกลาง",
          evalCount: 1,
          lastActive: ev.timestamp
        });
      }
    });

    const activeCommittees = Array.from(committeeMap.values());

    // 2. Count names in the same agency to detect multiple different committee members in the same agency
    const agencyCount: Record<string, number> = {};
    activeCommittees.forEach((c) => {
      const agencyKey = c.agency.toLowerCase().trim();
      agencyCount[agencyKey] = (agencyCount[agencyKey] || 0) + 1;
    });

    // 3. Count exact name frequency overall to detect duplicate name registrations in same/different agencies
    const nameCount: Record<string, number> = {};
    activeCommittees.forEach((c) => {
      const nameKey = c.name.toLowerCase().trim();
      nameCount[nameKey] = (nameCount[nameKey] || 0) + 1;
    });

    return activeCommittees.map((committee) => {
      const agencyKey = committee.agency.toLowerCase().trim();
      const nameKey = committee.name.toLowerCase().trim();

      // Check for Case A: Multiple different committee members in the same agency ("หน่วยงานนี้ซ้ำ")
      const isAgencyDuplicated = agencyCount[agencyKey] > 1;

      // Check for Case B: Duplicate login/registration with the exact same name under the same agency
      // In a strict duplicate check, we also search if another distinct row has the same name in the same agency, 
      // or if there are duplicate evaluations with minor spelling differences.
      const isNameDuplicated = nameCount[nameKey] > 1;

      return {
        ...committee,
        isAgencyDuplicated,
        isNameDuplicated,
        agencyVotersCount: agencyCount[agencyKey]
      };
    });
  };

  const auditData = getCommitteeAuditData();

  if (isTopLeaderboardView) {
    return (
      <div className="space-y-6 animate-fade-in text-slate-800">
        {/* District Selector & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-50 text-amber-750 border border-amber-200">
                รายงานผลคะแนนสูงสุด (Leaderboard)
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <h2 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 mt-1">
              ผู้ได้รับคะแนนสูงสุด อันดับ 1 & 2 รายสาขา
            </h2>
            <p className="text-xs text-slate-500">
              📍 แสดงผลคะแนนแยกสาขาประเมินปราชญ์เกษตรของแผ่นดิน ปี 2570
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-500 shrink-0 font-sans">เขตตรวจราชการ:</span>
            <select
              id="top_leaderboard_district_select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-amber-500 hover:bg-slate-100 text-slate-800 rounded-2xl py-2 px-3 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  📍 {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((bCode) => {
            const branchTopCands = getTopCandidatesForBranch(bCode);
            const branchName = branches.find(b => b.code === bCode)?.name || "";

            return (
              <div key={bCode} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/20 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-mono text-[10px] font-black">
                      สาขาที่ {bCode}
                    </span>
                    <span className="text-[9px] font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ท็อป 1 & 2
                    </span>
                  </div>
                  <h3 className="text-xs md:text-sm font-black text-slate-800 leading-snug mb-4">
                    {branchName}
                  </h3>
                </div>

                {/* Top candidates list */}
                <div className="space-y-2.5 mt-2 flex-1 flex flex-col justify-center min-h-[120px]">
                  {branchTopCands.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                      ยังไม่มีคะแนนการประเมินในสาขานี้
                    </p>
                  ) : (
                    branchTopCands.map((c) => {
                      const fullInfo = candidates.find(cand => cand.id === c.candidateId);
                      return (
                        <div
                          key={c.candidateId}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                              c.rank === 1
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-200 text-slate-800 border border-slate-300"
                            }`}>
                              #{c.rank}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                จ.{c.province} • {fullInfo?.organization || "ไม่มีสังกัด"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className="text-xs text-slate-400 block font-mono">คะแนนเฉลี่ย</span>
                            <span className="text-sm md:text-base font-black text-emerald-600 font-mono">
                              {c.averageScore.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* ----------------- ADMIN VIEW / EXECUTIVE DASHBOARD ----------------- */}
      {isAdminView ? (
        <div className="space-y-8">
          
          {/* Header row with District Selection & Refresh control */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ระบบรายงานนำเสนอผู้บริหาร
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h2 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 mt-1">
                รายงานผลคะแนนตามสาขาที่เลือก เขตตรวจราชการส่วนกลาง และเขตตรวจราชการที่ 1-18
              </h2>
              <p className="text-xs text-slate-500">
                📍 กำลังแสดง: {selectedDistrict === "ทั้งหมด" ? "ทุกเขตตรวจราชการ" : selectedDistrict}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Region Selector */}
              <div className="relative">
                <select
                  id="executive_district_select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-emerald-500 hover:bg-slate-100 text-slate-800 rounded-2xl py-2 pl-3 pr-8 text-xs font-bold transition-all cursor-pointer outline-none appearance-none min-w-[200px]"
                >
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>
                      📍 {reg}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              <button
                onClick={fetchStats}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "กำลังรีเฟรช..." : "อัปเดตข้อมูลสด"}</span>
              </button>
            </div>
          </div>

          {/* 📍 REGION VOTING CONTROL PANEL */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-sans font-extrabold text-slate-950 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600 animate-pulse" />
                  แผงควบคุมการเปิด-ปิดโหวต และสถานะรายเขตตรวจราชการ
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  คลิกปุ่มสวิตช์ (Toggle) สีเขียว/แดงไว้ที่มุมขวาบนของแต่ละการ์ดเขตเพื่อเปิด-ปิดการโหวตแบบเรียลไทม์ หรือคลิกเลือกเขตการ์ดเพื่อกรองข้อมูลสถิติด้านล่าง
                </p>
              </div>
              
              {/* Bulk actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-inner">
                <button
                  id="dash_btn_open_all"
                  onClick={() => handleBulkUpdateRegionStatus(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                  title="เปิดโหวตทุกเขตตรวจ"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 fill-white text-emerald-600" />
                  <span>เปิดโหวตทั้งหมด</span>
                </button>
                <button
                  id="dash_btn_close_all"
                  onClick={() => handleBulkUpdateRegionStatus(false)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                  title="ปิดโหวตทุกเขตตรวจ"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ปิดโหวตทั้งหมด</span>
                </button>
              </div>
            </div>

            {/* Grid of region cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
              {regionsDetailed.map((r, index) => {
                const isActive = regionStatuses[r.code] !== false;
                const isSelected = selectedDistrict === r.name;
                return (
                  <div
                    key={r.code}
                    onClick={() => setSelectedDistrict(r.name)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between h-28 select-none ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/10 shadow-md animate-fade-in"
                        : isActive
                        ? "bg-slate-50/80 hover:bg-emerald-50/20 border-slate-200/60 hover:border-emerald-500/30 shadow-sm"
                        : "bg-slate-150/40 opacity-70 border-slate-200 hover:bg-rose-50/10 text-slate-400"
                    }`}
                  >
                    {/* Switch Toggle in top-right */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`dash_btn_toggle_status_${r.code}`}
                        type="button"
                        onClick={() => handleToggleRegionStatus(r.code, isActive)}
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

                    <div className="flex flex-col">
                      <span className={`text-[9px] font-mono font-black tracking-wider uppercase ${isActive ? "text-emerald-700" : "text-rose-600"}`}>
                        {r.code}
                      </span>
                      <span className={`text-xs font-sans font-extrabold mt-1 leading-snug truncate ${isActive ? "text-slate-900" : "text-slate-450"}`}>
                        {r.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40">
                      <span className={`text-[8px] font-black uppercase ${isActive ? "text-emerald-700 bg-emerald-100/40 border border-emerald-200/40" : "text-rose-600 bg-rose-100/40 border border-rose-200/40"} px-1.5 py-0.5 rounded-md`}>
                        {isActive ? "เปิดโหวต" : "ปิดโหวต"}
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium truncate max-w-[80px]" title={r.provinces}>
                        {r.provinces}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Reset Filter Button */}
            {selectedDistrict !== "ทั้งหมด" && (
              <div className="flex justify-end pt-1">
                <button
                  id="dash_btn_reset_district_filter"
                  onClick={() => setSelectedDistrict("ทั้งหมด")}
                  className="text-xs text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  📍 แสดงทุกเขตตรวจราชการทั้งหมด (Reset Filter)
                </button>
              </div>
            )}
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            
            {/* CARD 1: Candidates Count & Branch Breakdown */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Users className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    รวม 4 สาขา
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ผู้ได้รับการเสนอชื่อทั้งหมดประจำเขต
                </h3>
                <p className="text-3xl font-sans font-extrabold text-slate-900 mt-1">
                  {totalNomineesInDistrict} <span className="text-sm font-normal text-slate-500">ราย</span>
                </p>
              </div>

              {/* Branch Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 truncate" title="สาขา 1 ผู้ทรงภูมิปัญญา">
                    สาขา 1 (ผู้ทรงภูมิปัญญา)
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {branch1Count} <span className="text-[10px] font-normal text-slate-500">คน</span>
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 truncate" title="สาขา 2 เศรษฐกิจพอเพียง">
                    สาขา 2 (เศรษฐกิจพอเพียง)
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {branch2Count} <span className="text-[10px] font-normal text-slate-500">คน</span>
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 truncate" title="สาขา 3 เกษตรดีเด่น">
                    สาขา 3 (เกษตรดีเด่น)
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {branch3Count} <span className="text-[10px] font-normal text-slate-500">คน</span>
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 truncate" title="สาขา 4 ผู้นำชุมชน">
                    สาขา 4 (ผู้นำชุมชน)
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {branch4Count} <span className="text-[10px] font-normal text-slate-500">คน</span>
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 3: Progress & Completion Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between animate-fade-in">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="p-2.5 bg-white/15 text-white rounded-xl border border-white/10">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono font-black text-emerald-100 bg-white/20 border border-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    สรุปภาพรวม
                  </span>
                </div>
                <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  ความสำเร็จการประเมิน
                </h3>
                <p className="text-3xl font-sans font-extrabold text-white mt-1">
                  {completionPercentage}% <span className="text-xs font-bold text-emerald-100">สำเร็จ</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-100">
                  <span>ผู้ได้รับการประเมินแล้ว</span>
                  <span className="text-white font-mono font-black">{evaluatedCount} / {totalNomineesInDistrict} ราย</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-emerald-400 rounded-full animate-pulse" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <p className="text-[10px] text-emerald-100/90 leading-relaxed pt-1">
                  สัดส่วนคะแนนสะสมที่ได้รับจากกรรมการ
                </p>
              </div>
            </div>

          </div>

          {/* Main Content: Leaderboard & Live ticker */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Columns: Rankings and Leaderboards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      สรุปอันดับผลคะแนนประเมินเรียลไทม์
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      จัดอันดับคะแนนเฉลี่ยสูงสุดเพื่อพิจารณาสรรหาปราชญ์เกษตรของแผ่นดิน ปี 2570
                    </p>
                  </div>

                  {/* Search filter */}
                  <div className="relative max-w-xs w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="dashboard_admin_search"
                      type="text"
                      placeholder="ค้นหารายชื่อ / จังหวัด..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-4 text-slate-800 text-sm placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Branch selector tabs */}
                <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none flex-nowrap snap-x touch-pan-x scroll-smooth">
                  {branches.map((b) => (
                    <button
                      id={`admin_tab_branch_${b.code}`}
                      key={b.code}
                      onClick={() => {
                        setActiveBranch(b.code as 1 | 2 | 3 | 4);
                        setSelectedCandidateId(null);
                      }}
                      className={`px-4 py-2.5 rounded-2xl font-sans text-xs md:text-sm whitespace-nowrap transition-all cursor-pointer border shrink-0 snap-start ${
                        activeBranch === b.code
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {getBranchLabel(b.code)}
                    </button>
                  ))}
                </div>

                {/* Branch Full Name Display */}
                <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-700 font-semibold">
                  <span className="text-emerald-700 font-bold font-mono text-[10px] uppercase tracking-wider block mb-0.5">สาขาการประเมินที่กำลังตรวจสอบ</span>
                  {branches.find(b => b.code === activeBranch)?.name}
                </div>

                {/* Leaderboard Table */}
                {filteredStats.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold">ไม่พบข้อมูลรายชื่อหรือยังไม่มีการประเมินในสาขานี้</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankedFilteredStats.map((candidateStat) => {
                      const isSelected = selectedCandidateId === candidateStat.candidateId;
                      const rank = candidateStat.rank;
                      const fullInfo = candidates.find(c => c.id === candidateStat.candidateId);

                      return (
                        <div
                          id={`admin_cand_row_${candidateStat.candidateId}`}
                          key={candidateStat.candidateId}
                          onClick={() => setSelectedCandidateId(isSelected ? null : candidateStat.candidateId)}
                          className={`p-4 border rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isSelected
                              ? "bg-emerald-50/50 border-emerald-500 shadow-sm"
                              : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/60"
                          }`}
                        >
                          {/* Rank & Name */}
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-sm font-bold ${
                              rank === 1 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                              rank === 2 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                              rank === 3 ? "bg-orange-100 text-orange-800 border border-orange-300" :
                              "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {rank}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-sans font-bold text-slate-900 text-sm md:text-base">
                                  {candidateStat.name}
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                                  จ.{candidateStat.province}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {fullInfo?.organization || "ไม่มีสังกัด"} • เขตตรวจ: {candidateStat.district}
                              </p>
                            </div>
                          </div>

                          {/* Evaluators & Score */}
                          <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">จำนวนกรรมการประเมิน</p>
                              <p className="text-xs font-bold text-slate-700">
                                {candidateStat.voteCount} บัตรคะแนน
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-mono">คะแนนเฉลี่ย</p>
                                <p className="text-lg font-sans font-black text-emerald-600">
                                  {candidateStat.voteCount > 0 ? candidateStat.averageScore.toFixed(2) : "0.00"}
                                  <span className="text-xs text-slate-500 font-normal"> /100</span>
                                </p>
                              </div>
                              
                              {/* Circle indicator */}
                              <div className="relative w-10 h-10 shrink-0">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#059669"
                                    strokeWidth="2.5"
                                    strokeDasharray="100 100"
                                    strokeDashoffset={100 - (candidateStat.voteCount > 0 ? candidateStat.averageScore : 0)}
                                    strokeLinecap="round"
                                    transform="rotate(-90 18 18)"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Detailed Breakdown OR Live Activity Feed */}
            <div className="space-y-6">
              {selectedStats ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-mono uppercase tracking-wider font-bold">รายละเอียดคะแนนเฉลยละเอียด</span>
                      <h3 className="text-lg font-sans font-bold text-slate-900 mt-0.5">{selectedStats.name}</h3>
                      <p className="text-xs text-slate-500">จ.{selectedStats.province} • {selectedStats.district}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCandidateId(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      ปิด
                    </button>
                  </div>

                  {/* Average Circular Progress */}
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#059669"
                          strokeWidth="3"
                          strokeDasharray="100 100"
                          strokeDashoffset={100 - selectedStats.averageScore}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-extrabold text-slate-900">{selectedStats.averageScore.toFixed(1)}</span>
                        <span className="text-[8px] text-slate-500 font-bold">เฉลี่ย</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 font-bold">ผลรวมคะแนนสรุป</p>
                      <p className="text-xs text-slate-500 mt-0.5">ได้รับแล้วทั้งหมด {selectedStats.voteCount} แผ่นประเมิน</p>
                    </div>
                  </div>

                  {/* Sub-criteria Scores */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700">เกณฑ์คะแนนเฉลี่ยแยกข้อ:</p>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {Object.entries(selectedStats.scoresBreakdown).map(([key, score]) => {
                        const isGeneral = key.includes("_q1_");
                        const maxScore = isGeneral ? 5 : 10;
                        const percent = ((score as number) / maxScore) * 100;

                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium">
                              <span className="text-slate-600 line-clamp-1" title={getQuestionText(key, activeBranch)}>
                                {getQuestionText(key, activeBranch)}
                              </span>
                              <span className="text-emerald-700 font-bold shrink-0">{(score as number).toFixed(1)}/{maxScore}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2 border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold text-slate-700">ความคิดเห็นเพิ่มเติมคณะกรรมการ:</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {selectedCandidateEvaluations.filter(e => e.comments).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">ไม่มีข้อคิดเห็นเพิ่มเติมบันทึกไว้</p>
                      ) : (
                        selectedCandidateEvaluations
                          .filter(e => e.comments)
                          .map((evalItem) => (
                            <div key={evalItem.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                              <p className="text-slate-700 leading-relaxed italic">"{evalItem.comments}"</p>
                              <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500 border-t border-slate-200 pt-1">
                                <span className="font-bold text-slate-600">{evalItem.committeeName}</span>
                                <span>{evalItem.committeeAgency}</span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                
                /* Live Ticker Feed (Moved to Admin Presentation Tab) */
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                      รายงานการประเมินสด (Live Ticker)
                    </h3>
                    <p className="text-xs text-slate-500">ความเคลื่อนไหวการบันทึกคะแนนจากระบบล่าสุด</p>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {evaluations.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        ยังไม่มีกิจกรรมการส่งแผ่นประเมินเข้ามา
                      </div>
                    ) : (
                      evaluations
                        .slice()
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((evalItem) => (
                          <div key={evalItem.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/60 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                                {getBranchLabel(evalItem.branch)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(evalItem.timestamp).toLocaleTimeString("th-TH")}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 leading-snug font-bold">
                              บันทึกคะแนนเรียบร้อยแล้ว
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/40 pt-1">
                              <span className="truncate max-w-[120px]">{evalItem.committeeAgency}</span>
                              <span className="font-black text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                                {evalItem.totalScore} คะแนน
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New Voter Registrations & Duplicate Check Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                สถานะคณะกรรมการและรายงานตรวจสอบรายชื่อซ้ำซ้อน
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                รายชื่อคณะกรรมการที่ลงทะเบียนและลงคะแนนในระบบ ตรวจจับความถูกต้องเพื่อป้องกันการลงชื่อซ้ำซ้อน
              </p>
            </div>

            {auditData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-2xl">
                ยังไม่มีการลงคะแนนจากกรรมการใดๆ ในระบบขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-3 px-4">ชื่อคณะกรรมการ</th>
                      <th className="py-3 px-4">หน่วยงาน / สังกัด</th>
                      <th className="py-3 px-4">เขตตรวจฯ</th>
                      <th className="py-3 px-4 text-center">ประเมินแล้ว (ราย)</th>
                      <th className="py-3 px-4">กิจกรรมล่าสุด</th>
                      <th className="py-3 px-4 text-center">สถานะการตรวจสอบความซ้ำซ้อน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.map((committee, i) => {
                      const hasDuplicate = committee.isNameDuplicated || committee.isAgencyDuplicated;

                      return (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-all text-slate-700">
                          <td className="py-3 px-4 font-bold text-slate-900">{committee.name}</td>
                          <td className="py-3 px-4">{committee.agency}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">{committee.district}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-emerald-700">{committee.evalCount}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                            {new Date(committee.lastActive).toLocaleString("th-TH")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {hasDuplicate ? (
                              <div className="flex flex-col gap-1 items-center justify-center">
                                {committee.isNameDuplicated && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    🚨 ชื่อลงทะเบียนซ้ำซ้อน
                                  </span>
                                )}
                                {committee.isAgencyDuplicated && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    ⚠️ สังกัดซ้ำในเขต ({committee.agencyVotersCount} ท่าน)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        
        // ----------------- VOTER / COMMITTEE SCORING RIGHTS VIEW -----------------
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            
            {/* Header section with specific instruction for voters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-sans font-extrabold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5.5 h-5.5 text-emerald-600" />
                  รายชื่อผู้รอรับการประเมินปราชญ์เกษตรของแผ่นดิน
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรุณาเลือกปุ่ม "ลงคะแนน" เพื่อเข้าหน้าทำแบบประเมินรายบุคคล
                </p>
              </div>

              {/* Quick Branch selector in Header */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none flex-nowrap snap-x touch-pan-x scroll-smooth">
                {branches.map((b) => (
                  <button
                    id={`committee_branch_pill_${b.code}`}
                    key={b.code}
                    onClick={() => setActiveBranch(b.code as 1 | 2 | 3 | 4)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all shrink-0 snap-start ${
                      activeBranch === b.code
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {getBranchLabel(b.code)}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch title banner and Admin Region Selector */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-700 font-bold mb-6">
              <div>
                <span className="text-emerald-700 font-mono text-[10px] uppercase tracking-wider block mb-0.5">สาขาเกษตรกรรมการประเมินที่เลือก</span>
                {branches.find(b => b.code === activeBranch)?.name}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 shrink-0">
                {!isAdminView && userIsAdmin && (
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm cursor-pointer hover:bg-slate-100 transition-all select-none">
                    <input
                      id="checkbox_show_all_regions"
                      type="checkbox"
                      checked={showAllRegions}
                      onChange={(e) => setShowAllRegions(e.target.checked)}
                      className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>แสดงผู้สมัครทุกเขตตรวจราชการ</span>
                  </label>
                )}

                {userIsAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 shrink-0">กรองตามเขตตรวจราชการ:</span>
                    <select
                      id="admin_voter_region_filter"
                      value={currentVoterRegion || ""}
                      onChange={(e) => setCurrentVoterRegion(e.target.value || null)}
                      className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="">-- แสดงทุกเขตตรวจ --</option>
                      {regions.filter(r => r !== "ทั้งหมด").map((regionName) => (
                        <option key={regionName} value={regionName}>
                          {regionName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* List of Nominated Candidates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBranchCandidates.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                  <span className="italic">ไม่มีรายชื่อผู้ได้รับการเสนอชื่อในสาขานี้สำหรับกลุ่มตรวจนี้ ({currentVoterRegion})</span>
                  {userIsAdmin && (
                    <button
                      id="btn_toggle_show_all_regions_empty"
                      onClick={() => setShowAllRegions(true)}
                      className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                    >
                      🔍 แสดงรายชื่อผู้ได้รับการเสนอชื่อของทุกเขตตรวจราชการ ({candidates.filter(c => c.branch === activeBranch).length} ราย)
                    </button>
                  )}
                </div>
              ) : (
                activeBranchCandidates.map((c) => {
                  const hasVoted = evaluations.some(e => e.candidateId === c.id);
                  const candidateVotesCount = evaluations.filter(e => e.candidateId === c.id).length;
                  const active = isRegionActive(c.district);
                  const isEvalDisabled = !active && !userIsAdmin;

                  return (
                    <div
                      id={`voter_cand_card_${c.id}`}
                      key={c.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (isEvalDisabled) return;
                        setContextMenu({
                          visible: true,
                          x: e.clientX,
                          y: e.clientY,
                          candidateId: c.id
                        });
                      }}
                      className={`p-5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm group relative ${
                        isEvalDisabled
                          ? "bg-slate-100/50 opacity-75 border-slate-200"
                          : "bg-slate-50/70 border-slate-200/80 hover:border-emerald-500/30 hover:bg-white cursor-context-menu"
                      }`}
                      title={isEvalDisabled ? "เขตตรวจราชการนี้ปิดรับการลงคะแนนชั่วคราว" : "คลิกขวาเพื่อเปิดเมนูคำสั่งด่วน / Right click for context menu"}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-base font-bold break-words leading-snug ${isEvalDisabled ? "text-slate-400" : "text-slate-900 group-hover:text-emerald-950 transition-colors"}`}>{c.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border ${isEvalDisabled ? "border-slate-200 text-slate-400" : "border-slate-200 text-slate-600"} shrink-0`}>
                            จ.{c.province}
                          </span>
                        </div>
                        <p className={`text-xs break-words leading-relaxed ${isEvalDisabled ? "text-slate-400/80" : "text-slate-600"}`}>สังกัด/หน่วยงาน: {c.organization}</p>
                        <p className="text-[10px] font-mono flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={isEvalDisabled ? "text-slate-400/60" : "text-slate-450"}>เขตตรวจราชการ: {c.district}</span>
                          {candidateVotesCount > 0 && (
                            <span className={`border px-1.5 py-0.5 rounded font-bold font-sans shrink-0 ${isEvalDisabled ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}>
                              ได้รับคะแนนแล้ว {candidateVotesCount} กรรมการ
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 mt-2 sm:mt-0">
                        <button
                          id={`btn_voter_eval_${c.id}`}
                          onClick={() => {
                            if (isEvalDisabled || hasVoted) return;
                            onStartEvaluation(activeBranch, c.id);
                          }}
                          disabled={isEvalDisabled || hasVoted}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
                            isEvalDisabled
                              ? "bg-slate-200 text-slate-450 border border-slate-300 cursor-not-allowed opacity-75"
                              : hasVoted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                          }`}
                        >
                          {isEvalDisabled ? "ปิดโหวตชั่วคราว" : hasVoted ? "✓ ลงคะแนนแล้ว" : "ลงคะแนน"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- FLOATING CONTEXTUAL MENU COMPONENT --- */}
      <AnimatePresence>
        {contextMenu && contextMenu.visible && (() => {
          const matchedCand = candidates.find(cand => cand.id === contextMenu.candidateId);
          if (!matchedCand) return null;
          const candidateEvaluations = evaluations.filter(ev => ev.candidateId === matchedCand.id);

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "absolute",
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
              }}
              className="z-[99] min-w-52 bg-white border border-slate-200/80 rounded-2xl shadow-[0_12px_24px_-4px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.06)] p-1.5 flex flex-col text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 font-mono tracking-wider truncate max-w-[200px]">
                {matchedCand.name}
              </div>

              {/* Action: Evaluate */}
              <button
                id="context_action_eval"
                onClick={() => {
                  onStartEvaluation(matchedCand.branch, matchedCand.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition-all text-left cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <span>ลงคะแนน / แก้ไขคะแนน</span>
              </button>

              {/* Action: View details modal */}
              <button
                id="context_action_detail"
                onClick={() => {
                  setSelectedDetailCandidate(matchedCand);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer"
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>ดูข้อมูลผู้สมัครโดยละเอียด</span>
              </button>

              {/* Action: Copy Details */}
              <button
                id="context_action_copy"
                onClick={() => {
                  const text = `ปราชญ์เกษตรของแผ่นดิน ปี 2570: ${matchedCand.name} สังกัด ${matchedCand.organization} จังหวัด ${matchedCand.province} สาขาที่ ${matchedCand.branch}`;
                  navigator.clipboard.writeText(text);
                  setCopiedCandidateId(matchedCand.id);
                  setTimeout(() => setCopiedCandidateId(null), 1500);
                  setTimeout(() => setContextMenu(null), 800);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>คัดลอกข้อมูลผู้สมัคร</span>
                </span>
                {copiedCandidateId === matchedCand.id ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold animate-pulse">คัดลอกแล้ว</span>
                ) : null}
              </button>

              {/* Info stats block */}
              <div className="border-t border-slate-100 mt-1 pt-1.5 px-2.5 pb-1 text-[9px] text-slate-400 font-mono">
                {candidateEvaluations.length > 0
                  ? `ประเมินแล้ว ${candidateEvaluations.length} กรรมการ`
                  : "ยังไม่มีข้อมูลการประเมิน"}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* --- CANDIDATE DETAIL MODAL COMPONENT --- */}
      <AnimatePresence>
        {selectedDetailCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailCandidate(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 text-slate-800 overflow-hidden"
            >
              <button
                id="btn_close_detail_modal"
                onClick={() => setSelectedDetailCandidate(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mb-5 pb-4 border-b border-slate-100">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 shrink-0">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black font-mono tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase">
                    สาขาที่ {selectedDetailCandidate.branch}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1.5">{selectedDetailCandidate.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">จังหวัด {selectedDetailCandidate.province}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">สังกัด / หน่วยงาน</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedDetailCandidate.organization}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">เขตตรวจราชการที่รับผิดชอบ</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedDetailCandidate.district}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ชื่อปราชญ์เกษตรและสาขาวิชาชีพ</span>
                  <p className="text-slate-700 mt-0.5 italic">
                    {branches.find(b => b.code === selectedDetailCandidate.branch)?.name}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-4">
                  <span className="text-slate-500 font-extrabold uppercase tracking-wider text-[9px] block mb-2">
                    สรุปผลการพิจารณาเบื้องต้นในระบบ
                  </span>
                  {(() => {
                    const candEvals = evaluations.filter(ev => ev.candidateId === selectedDetailCandidate.id);
                    if (candEvals.length === 0) {
                      return <p className="text-slate-400 italic text-xs">ยังไม่มีกรรมการทำการลงชื่อหรือประเมินคะแนนผู้สมัครท่านนี้ในระบบ</p>;
                    }
                    
                    const avgScore = Math.round(candEvals.reduce((acc, ev) => acc + ev.totalScore, 0) / candEvals.length);
                    return (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-600 font-medium">คะแนนรวมเฉลี่ยจากการประเมิน</p>
                          <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">{avgScore} / 100 คะแนน</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600 font-medium">จำนวนผู้ประเมิน</p>
                          <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{candEvals.length} ท่าน</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  id="btn_detail_modal_close_footer"
                  onClick={() => setSelectedDetailCandidate(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition-all"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  id="btn_detail_modal_start_eval"
                  onClick={() => {
                    onStartEvaluation(selectedDetailCandidate.branch, selectedDetailCandidate.id);
                    setSelectedDetailCandidate(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
                >
                  ลงคะแนนให้ปราชญ์เกษตรท่านนี้
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
