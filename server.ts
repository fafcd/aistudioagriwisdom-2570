import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Candidate, Evaluation, CandidateStats, Voter } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure directories exist
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const normalizeDistrict = (district: string): string => {
    if (!district) return "เขตตรวจราชการส่วนกลาง";
    const trimmed = district.trim();
    if (trimmed === "ส่วนกลาง" || trimmed === "CENTRAL" || trimmed === "เขตตรวจราชการส่วนกลาง" || trimmed.toUpperCase().includes("CENTRAL")) {
      return "เขตตรวจราชการส่วนกลาง";
    }
    const match = trimmed.match(/\d+/);
    if (match) {
      return `เขตตรวจราชการที่ ${match[0]}`;
    }
    return trimmed;
  };

  const candidatesPath = path.join(dataDir, "candidates.json");
  const evaluationsPath = path.join(dataDir, "evaluations.json");
  const votersPath = path.join(dataDir, "voters.json");
  const regionsStatusPath = path.join(dataDir, "regions_status.json");

  const loadRegionStatuses = (): Record<string, boolean> => {
    try {
      if (fs.existsSync(regionsStatusPath)) {
        return JSON.parse(fs.readFileSync(regionsStatusPath, "utf-8"));
      } else {
        const defaultStatuses: Record<string, boolean> = {};
        const regionCodes = [
          "CENTRAL", "REGION 1", "REGION 2", "REGION 3", "REGION 4", "REGION 5",
          "REGION 6", "REGION 7", "REGION 8", "REGION 9", "REGION 10", "REGION 11",
          "REGION 12", "REGION 13", "REGION 14", "REGION 15", "REGION 16", "REGION 17", "REGION 18"
        ];
        regionCodes.forEach((code) => {
          defaultStatuses[code] = true; // All regions open by default
        });
        fs.writeFileSync(regionsStatusPath, JSON.stringify(defaultStatuses, null, 2), "utf-8");
        return defaultStatuses;
      }
    } catch (e) {
      console.error("Error loading region statuses", e);
      return {};
    }
  };

  const saveRegionStatuses = (statuses: Record<string, boolean>) => {
    fs.writeFileSync(regionsStatusPath, JSON.stringify(statuses, null, 2), "utf-8");
  };

  // Initial Prepopulated Voters (Committee Members tied to Inspection Regions)
  const initialVoters: Voter[] = [];

  const loadVoters = (): Voter[] => {
    try {
      if (fs.existsSync(votersPath)) {
        return JSON.parse(fs.readFileSync(votersPath, "utf-8"));
      } else {
        fs.writeFileSync(votersPath, JSON.stringify(initialVoters, null, 2), "utf-8");
        return initialVoters;
      }
    } catch (e) {
      console.error("Error loading voters", e);
      return initialVoters;
    }
  };

  const saveVoters = (voters: Voter[]) => {
    fs.writeFileSync(votersPath, JSON.stringify(voters, null, 2), "utf-8");
  };

  // Initial Prepopulated Candidates
  const initialCandidates: Candidate[] = [];

  // Helper to load candidates
  const loadCandidates = (): Candidate[] => {
    try {
      let cands: Candidate[] = [];
      if (fs.existsSync(candidatesPath)) {
        cands = JSON.parse(fs.readFileSync(candidatesPath, "utf-8"));
      } else {
        fs.writeFileSync(candidatesPath, JSON.stringify(initialCandidates, null, 2), "utf-8");
        cands = initialCandidates;
      }

      // Auto-normalize district values
      let changed = false;
      const normalized = cands.map(c => {
        const norm = normalizeDistrict(c.district);
        if (norm !== c.district) {
          changed = true;
          return { ...c, district: norm };
        }
        return c;
      });

      if (changed) {
        saveCandidates(normalized);
      }
      return normalized;
    } catch (e) {
      console.error("Error loading candidates", e);
      return initialCandidates;
    }
  };

  // Helper to save candidates
  const saveCandidates = (candidates: Candidate[]) => {
    fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2), "utf-8");
  };

  // Helper to load evaluations
  const loadEvaluations = (): Evaluation[] => {
    try {
      let evals: Evaluation[] = [];
      if (fs.existsSync(evaluationsPath)) {
        evals = JSON.parse(fs.readFileSync(evaluationsPath, "utf-8"));
      } else {
        // Prepopulate with a few demo evaluations to show rich statistics instantly
        const initialEvaluations: Evaluation[] = [];
        fs.writeFileSync(evaluationsPath, JSON.stringify(initialEvaluations, null, 2), "utf-8");
        evals = initialEvaluations;
      }

      // Auto-normalize evaluations
      let changed = false;
      const normalized = evals.map(ev => {
        const norm = normalizeDistrict(ev.candidateDistrict || "");
        if (norm !== ev.candidateDistrict) {
          changed = true;
          return { ...ev, candidateDistrict: norm };
        }
        return ev;
      });

      if (changed) {
        saveEvaluations(normalized);
      }
      return normalized;
    } catch (e) {
      console.error("Error loading evaluations", e);
      return [];
    }
  };

  // Helper to save evaluations
  const saveEvaluations = (evaluations: Evaluation[]) => {
    fs.writeFileSync(evaluationsPath, JSON.stringify(evaluations, null, 2), "utf-8");
  };

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route - Login
  app.post("/api/auth/login", (req, res) => {
    const { password, name, agency } = req.body;

    if (!name || !agency) {
      return res.status(400).json({ error: "กรุณากรอกชื่อและหน่วยงานของท่าน" });
    }

    const trimmedCode = password ? password.trim().toUpperCase() : "";

    // Allow predefined codes
    if (trimmedCode === "SAGE2570" || trimmedCode === "ADMIN2570" || trimmedCode === "COMMITTEE") {
      return res.json({
        success: true,
        user: {
          name,
          agency,
          role: trimmedCode === "ADMIN2570" ? "admin" : "committee",
        },
      });
    }

    return res.status(401).json({ error: "รหัสผ่านกรรมการไม่ถูกต้อง (ลองใช้: SAGE2570 หรือ ADMIN2570)" });
  });

  // API Route - Get Candidates
  app.get("/api/candidates", (req, res) => {
    const candidates = loadCandidates();
    res.json(candidates);
  });

  // API Route - Add Candidate (Admin only)
  app.post("/api/candidates", (req, res) => {
    const { name, branch, province, district, organization } = req.body;
    if (!name || !branch || !province || !district || !organization) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลผู้สมัครให้ครบถ้วน" });
    }

    const candidates = loadCandidates();
    const newCandidate: Candidate = {
      id: "cand_" + Date.now(),
      name,
      branch: parseInt(branch) as 1 | 2 | 3 | 4,
      province,
      district,
      organization,
    };

    candidates.push(newCandidate);
    saveCandidates(candidates);
    res.json({ success: true, candidate: newCandidate });
  });

  // API Route - Delete Candidate
  app.delete("/api/candidates/:id", (req, res) => {
    const { id } = req.params;
    let candidates = loadCandidates();
    candidates = candidates.filter((c) => c.id !== id);
    saveCandidates(candidates);
    res.json({ success: true });
  });

  // API Route - Get Voters
  app.get("/api/voters", (req, res) => {
    const voters = loadVoters();
    res.json(voters);
  });

  // API Route - Add Voter (Admin only)
  app.post("/api/voters", (req, res) => {
    const { name, agency, district } = req.body;
    if (!name || !agency || !district) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลกรรมการให้ครบถ้วน" });
    }

    const voters = loadVoters();
    const newVoter: Voter = {
      id: "voter_" + Date.now(),
      name,
      agency,
      district,
    };

    voters.push(newVoter);
    saveVoters(voters);
    res.json({ success: true, voter: newVoter });
  });

  // API Route - Delete Voter
  app.delete("/api/voters/:id", (req, res) => {
    const { id } = req.params;
    let voters = loadVoters();
    voters = voters.filter((v) => v.id !== id);
    saveVoters(voters);
    res.json({ success: true });
  });

  // API Route - Get Evaluations
  app.get("/api/evaluations", (req, res) => {
    const evaluations = loadEvaluations();
    res.json(evaluations);
  });

  // API Route - Get Region Voting Statuses
  app.get("/api/regions/status", (req, res) => {
    res.json(loadRegionStatuses());
  });

  // API Route - Update Region Voting Status
  app.post("/api/regions/status", (req, res) => {
    const { regionCode, active } = req.body;
    if (!regionCode) {
      return res.status(400).json({ error: "ระบุเขตไม่ถูกต้อง (Missing regionCode)" });
    }
    const statuses = loadRegionStatuses();
    statuses[regionCode] = !!active;
    saveRegionStatuses(statuses);
    res.json({ success: true, statuses });
  });

  // API Route - Bulk Update Region Voting Statuses
  app.post("/api/regions/status/bulk", (req, res) => {
    const { active } = req.body;
    if (active === undefined) {
      return res.status(400).json({ error: "ระบุสถานะไม่ถูกต้อง (Missing active status)" });
    }
    const statuses = loadRegionStatuses();
    const regionCodes = [
      "CENTRAL", "REGION 1", "REGION 2", "REGION 3", "REGION 4", "REGION 5",
      "REGION 6", "REGION 7", "REGION 8", "REGION 9", "REGION 10", "REGION 11",
      "REGION 12", "REGION 13", "REGION 14", "REGION 15", "REGION 16", "REGION 17", "REGION 18"
    ];
    regionCodes.forEach((code) => {
      statuses[code] = !!active;
    });
    saveRegionStatuses(statuses);
    res.json({ success: true, statuses });
  });

  // Helper to send data to Google Sheets Web App
  const sendToGoogleSheets = async (evaluation: Evaluation, candidate: Candidate): Promise<{ success: boolean; error?: string }> => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxxA2841SgAHDulZeJnGHgocgJFNBmWGg30U1DTZEpCnaIEyHfn4ZZ7Jcd8Sqp4lv70Lg/exec";
    const sheetId = "1A5fN1mJ_YGr7v2vx3p8u3ZGH8KnvEjHkyOZzsnpYQa8";

    const branchNames: Record<number, string> = {
      1: "สาขาปราชญ์เกษตรผู้ทรงภูมิปัญญาและมีคุณูปการต่อภาคการเกษตรไทย",
      2: "สาขาปราชญ์เกษตรเศรษฐกิจพอเพียง",
      3: "สาขาปราชญ์เกษตรดีเด่น",
      4: "สาขาปราชญ์ผู้นำชุมชนและเครือข่าย",
    };

    const headers = [
      "Timestamp",
      "Committee_Name",
      "Committee_Agency",
      "Branch_Code",
      "Branch_Name",
      "Candidate_ID",
      "Candidate_Name",
      "Province",
      "District",
      
      // Branch 1 Fields
      "b1_q1_1_1", "b1_q1_1_2", "b1_q1_1_3",
      "b1_q1_2_1", "b1_q1_2_2", "b1_q1_2_3", "b1_q1_2_4", "b1_q1_2_5",
      "b1_q1_3_1", "b1_q1_3_2",
      "b1_q2_1_1", "b1_q2_1_2", "b1_q2_1_3",
      "b1_q2_2_1", "b1_q2_2_2", "b1_q2_2_3",
      "b1_q2_3_1", "b1_q2_3_2", "b1_q2_3_3",
      "b1_q2_4_1",
      "b1_q3_1_1", "b1_q3_1_2", "b1_q3_1_3",
      "b1_q3_2_1", "b1_q3_2_2", "b1_q3_2_3",
      "b1_q3_3_1", "b1_q3_3_2", "b1_q3_3_3", "b1_total_score", "b1_comments",

      // Branch 2 Fields
      "b2_q1_1_honesty_ethics", "b2_q1_2_sacrifice_social", "b2_q1_3_perseverance", "b2_q1_4_role_model",
      "b2_q2_1_moderation", "b2_q2_2_reasonableness", "b2_q2_3_immunity_finance",
      "b2_q3_1_model_family", "b2_q3_2_leadership_network", "b2_q3_3_spreading_dedication",
      "b2_q4_1_network_size_success", "b2_q4_2_network_cooperation", "b2_total_score", "b2_comments",

      // Branch 3 Fields
      "b3_q1_1_honesty_ethics", "b3_q1_2_sacrifice_social", "b3_q1_3_perseverance", "b3_q1_4_role_model",
      "b3_q2_1_initiative_tech", "b3_q2_2_productivity_income", "b3_q2_3_eco_friendly",
      "b3_q3_1_awards_recognition", "b3_q3_2_speaker_trainer", "b3_q3_3_learning_center",
      "b3_q4_1_benefit_activities", "b3_q4_2_community_problem_solving", "b3_total_score", "b3_comments",

      // Branch 4 Fields
      "b4_q1_1_honesty_ethics", "b4_q1_2_sacrifice_social", "b4_q1_3_perseverance", "b4_q1_4_role_model",
      "b4_q2_1_leader_establishment", "b4_q2_2_community_management", "b4_q2_3_leader_communication",
      "b4_q3_1_network_strength", "b4_q3_2_network_activities", "b4_q3_3_network_collaboration",
      "b4_q4_1_member_impact", "b4_q4_2_network_sustainability", "b4_total_score", "b4_comments"
    ];

    const bCode = evaluation.branch;
    const bName = branchNames[bCode] || `สาขาที่ ${bCode}`;
    
    // Construct flat row data matching Google Sheet headers
    const rowData: Record<string, any> = {
      "spreadsheetId": sheetId,
      "sheetId": sheetId,
      "sheet_id": sheetId,
      "Timestamp": evaluation.timestamp,
      "Committee_Name": evaluation.committeeName,
      "Committee_Agency": evaluation.committeeAgency,
      "Branch_Code": bCode,
      "Branch_Name": bName,
      "Candidate_ID": evaluation.candidateId,
      "Candidate_Name": evaluation.candidateName,
      "Province": evaluation.candidateProvince,
      "District": evaluation.candidateDistrict,
    };

    // Fill in scores and comments for Google Sheet
    headers.slice(9).forEach((header) => {
      if (header.endsWith("_total_score")) {
        const expectedBranchTotal = `b${bCode}_total_score`;
        rowData[header] = header === expectedBranchTotal ? evaluation.totalScore : "";
      } else if (header.endsWith("_comments")) {
        const expectedBranchComments = `b${bCode}_comments`;
        rowData[header] = header === expectedBranchComments ? evaluation.comments : "";
      } else {
        if (header.startsWith(`b${bCode}_`)) {
          rowData[header] = evaluation.scores[header] !== undefined ? evaluation.scores[header] : "";
        } else {
          rowData[header] = "";
        }
      }
    });

    try {
      console.log(`Submitting evaluation of "${evaluation.candidateName}" to Google Sheets Apps Script...`);
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rowData),
      });

      const responseText = await response.text();
      console.log(`Google Sheets integration completed with status ${response.status}. Response length: ${responseText.length}`);

      // Google Apps Script quirk: it returns HTTP status 200 with an HTML error page when doPost is missing
      if (
        responseText.includes("doPost") || 
        responseText.includes("找不到") || 
        responseText.includes("錯誤") || 
        responseText.includes("script.images/favicon.ico") ||
        responseText.includes("<!DOCTYPE html>")
      ) {
        console.error("Google Sheets API Error detected: Missing doPost or compilation error in Apps Script.");
        return { 
          success: false, 
          error: "สคริปต์ Google Apps Script ปลายทางยังไม่ได้ติดตั้งหรือเปิดใช้งานฟังก์ชัน 'doPost' กรุณาทำตามคู่มือการคัดลอกโค้ดไปใส่ใน Apps Script ที่เตรียมไว้ในแท็บ 'แผนผัง Google Sheets'" 
        };
      }

      return { success: response.ok };
    } catch (err) {
      console.error("Error communicating with Google Sheets script:", err);
      return { success: false, error: (err as Error).message };
    }
  };

  // API Route - Submit Evaluation
  app.post("/api/evaluations", async (req, res) => {
    const { committeeName, committeeAgency, branch, candidateId, scores, comments } = req.body;

    if (!committeeName || !committeeAgency || !branch || !candidateId || !scores) {
      return res.status(400).json({ error: "ข้อมูลการประเมินไม่ครบถ้วน" });
    }

    const candidates = loadCandidates();
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัครที่ต้องการประเมิน" });
    }

    const evaluations = loadEvaluations();

    // Check if this committee member has already evaluated this candidate (prevent duplicate submissions)
    const existingIndex = evaluations.findIndex(
      (e) => e.candidateId === candidateId && e.committeeName === committeeName
    );

    // Calculate total score from the submitted scores map
    const totalScore = Object.values(scores as Record<string, number>).reduce((sum, score) => sum + score, 0);

    const newEvaluation: Evaluation = {
      id: existingIndex >= 0 ? evaluations[existingIndex].id : "eval_" + Date.now(),
      timestamp: new Date().toISOString(),
      committeeName,
      committeeAgency,
      branch: branch as 1 | 2 | 3 | 4,
      candidateId,
      candidateName: candidate.name,
      candidateProvince: candidate.province,
      candidateDistrict: candidate.district,
      scores,
      totalScore,
      comments: comments || "",
    };

    if (existingIndex >= 0) {
      // Update existing evaluation
      evaluations[existingIndex] = newEvaluation;
    } else {
      // Append new evaluation
      evaluations.push(newEvaluation);
    }

    saveEvaluations(evaluations);

    // Send to Google Sheets asynchronously in background so we don't hold up the user interface
    const sheetsResult = await sendToGoogleSheets(newEvaluation, candidate).catch(err => {
      console.error("Async Google Sheets submission error:", err);
      return { success: false, error: String(err) };
    });

    res.json({ 
      success: true, 
      evaluation: newEvaluation, 
      googleSheetsSynced: sheetsResult.success,
      googleSheetsError: sheetsResult.success ? undefined : sheetsResult.error 
    });
  });

  // API Route - Re-sync all evaluations to Google Sheets
  app.post("/api/sync-to-sheets", async (req, res) => {
    try {
      const evaluations = loadEvaluations();
      const candidates = loadCandidates();

      console.log(`Manual trigger: Syncing all ${evaluations.length} evaluations to Google Sheets...`);
      
      let successCount = 0;
      let failureCount = 0;

      for (const ev of evaluations) {
        const candidate = candidates.find(c => c.id === ev.candidateId);
        if (candidate) {
          const result = await sendToGoogleSheets(ev, candidate).catch(err => {
            console.error(`Error syncing evaluation ${ev.id}:`, err);
            return { success: false };
          });
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          failureCount++;
        }
      }

      res.json({
        success: true,
        message: `ซิงค์ข้อมูลไปยัง Google Sheets เสร็จสิ้น สำเร็จ: ${successCount} รายการ, ล้มเหลว: ${failureCount} รายการ`,
        total: evaluations.length,
        successCount,
        failureCount
      });
    } catch (err) {
      console.error("Manual sync failed:", err);
      res.status(500).json({ error: "ไม่สามารถดำเนินการซิงค์ข้อมูลได้: " + (err as Error).message });
    }
  });

  // API Route - Get Statistics and Leaderboard
  app.get("/api/stats", (req, res) => {
    const candidates = loadCandidates();
    const evaluations = loadEvaluations();

    const stats: Record<string, CandidateStats> = {};

    // Initialize stats for all candidates
    candidates.forEach((cand) => {
      stats[cand.id] = {
        candidateId: cand.id,
        name: cand.name,
        branch: cand.branch,
        province: cand.province,
        district: cand.district,
        averageScore: 0,
        voteCount: 0,
        scoresBreakdown: {},
      };
    });

    // Populate score calculations
    evaluations.forEach((evalItem) => {
      const candStat = stats[evalItem.candidateId];
      if (candStat) {
        candStat.voteCount += 1;
        candStat.averageScore += evalItem.totalScore;

        // Accumulate individual question scores
        Object.entries(evalItem.scores).forEach(([key, val]) => {
          candStat.scoresBreakdown[key] = (candStat.scoresBreakdown[key] || 0) + val;
        });
      }
    });

    // Calculate final averages
    Object.values(stats).forEach((candStat) => {
      if (candStat.voteCount > 0) {
        candStat.averageScore = parseFloat((candStat.averageScore / candStat.voteCount).toFixed(2));
        // Average the sub-questions as well
        Object.keys(candStat.scoresBreakdown).forEach((key) => {
          candStat.scoresBreakdown[key] = parseFloat((candStat.scoresBreakdown[key] / candStat.voteCount).toFixed(2));
        });
      }
    });

    res.json(Object.values(stats));
  });

  // API Route - Export perfectly formatted headers for Google Sheets (CSV)
  app.get("/api/export", (req, res) => {
    const evaluations = loadEvaluations();
    const candidates = loadCandidates();

    // Standard headers that represent all possible fields in the system
    const headers = [
      "Timestamp",
      "Committee_Name",
      "Committee_Agency",
      "Branch_Code",
      "Branch_Name",
      "Candidate_ID",
      "Candidate_Name",
      "Province",
      "District",
      
      // Branch 1 Fields
      "b1_q1_1_1", "b1_q1_1_2", "b1_q1_1_3",
      "b1_q1_2_1", "b1_q1_2_2", "b1_q1_2_3", "b1_q1_2_4", "b1_q1_2_5",
      "b1_q1_3_1", "b1_q1_3_2",
      "b1_q2_1_1", "b1_q2_1_2", "b1_q2_1_3",
      "b1_q2_2_1", "b1_q2_2_2", "b1_q2_2_3",
      "b1_q2_3_1", "b1_q2_3_2", "b1_q2_3_3",
      "b1_q2_4_1",
      "b1_q3_1_1", "b1_q3_1_2", "b1_q3_1_3",
      "b1_q3_2_1", "b1_q3_2_2", "b1_q3_2_3",
      "b1_q3_3_1", "b1_q3_3_2", "b1_q3_3_3", "b1_total_score", "b1_comments",

      // Branch 2 Fields
      "b2_q1_1_honesty_ethics", "b2_q1_2_sacrifice_social", "b2_q1_3_perseverance", "b2_q1_4_role_model",
      "b2_q2_1_moderation", "b2_q2_2_reasonableness", "b2_q2_3_immunity_finance",
      "b2_q3_1_model_family", "b2_q3_2_leadership_network", "b2_q3_3_spreading_dedication",
      "b2_q4_1_network_size_success", "b2_q4_2_network_cooperation", "b2_total_score", "b2_comments",

      // Branch 3 Fields
      "b3_q1_1_honesty_ethics", "b3_q1_2_sacrifice_social", "b3_q1_3_perseverance", "b3_q1_4_role_model",
      "b3_q2_1_initiative_tech", "b3_q2_2_productivity_income", "b3_q2_3_eco_friendly",
      "b3_q3_1_awards_recognition", "b3_q3_2_speaker_trainer", "b3_q3_3_learning_center",
      "b3_q4_1_benefit_activities", "b3_q4_2_community_problem_solving", "b3_total_score", "b3_comments",

      // Branch 4 Fields
      "b4_q1_1_honesty_ethics", "b4_q1_2_sacrifice_social", "b4_q1_3_perseverance", "b4_q1_4_role_model",
      "b4_q2_1_leader_establishment", "b4_q2_2_community_management", "b4_q2_3_leader_communication",
      "b4_q3_1_network_strength", "b4_q3_2_network_activities", "b4_q3_3_network_collaboration",
      "b4_q4_1_member_impact", "b4_q4_2_network_sustainability", "b4_total_score", "b4_comments"
    ];

    const branchNames = {
      1: "สาขาปราชญ์เกษตรผู้ทรงภูมิปัญญาและมีคุณูปการต่อภาคการเกษตรไทย",
      2: "สาขาปราชญ์เกษตรเศรษฐกิจพอเพียง",
      3: "สาขาปราชญ์เกษตรดีเด่น",
      4: "สาขาปราชญ์ผู้นำชุมชนและเครือข่าย",
    };

    const rows = evaluations.map((e) => {
      const bCode = e.branch;
      const bName = branchNames[bCode] || `สาขาที่ ${bCode}`;
      
      const rowData: Record<string, any> = {
        "Timestamp": e.timestamp,
        "Committee_Name": e.committeeName,
        "Committee_Agency": e.committeeAgency,
        "Branch_Code": bCode,
        "Branch_Name": bName,
        "Candidate_ID": e.candidateId,
        "Candidate_Name": e.candidateName,
        "Province": e.candidateProvince,
        "District": e.candidateDistrict,
      };

      // Fill in all scores (empty if not belonging to this branch)
      headers.slice(9).forEach((header) => {
        if (header.endsWith("_total_score")) {
          const expectedBranchTotal = `b${bCode}_total_score`;
          if (header === expectedBranchTotal) {
            rowData[header] = e.totalScore;
          } else {
            rowData[header] = "";
          }
        } else if (header.endsWith("_comments")) {
          const expectedBranchComments = `b${bCode}_comments`;
          if (header === expectedBranchComments) {
            rowData[header] = e.comments;
          } else {
            rowData[header] = "";
          }
        } else {
          // It's a standard question score
          if (header.startsWith(`b${bCode}_`)) {
            rowData[header] = e.scores[header] !== undefined ? e.scores[header] : "";
          } else {
            rowData[header] = "";
          }
        }
      });

      return rowData;
    });

    res.json({ headers, rows });
  });

  // Vite middleware for development / build assets for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
