import React, { useState, useEffect } from "react";
import { Evaluation } from "../types";
import { Table, Copy, Download, FileSpreadsheet, Check, ArrowRightLeft, HelpCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface GoogleSheetsMapProps {
  evaluations: Evaluation[];
}

interface MappingRow {
  header: string;
  question: string;
  branch: string;
  maxScore: string;
}

export default function GoogleSheetsMap({ evaluations }: GoogleSheetsMapProps) {
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>("all");
  const [isCopied, setIsCopied] = useState(false);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [isScriptCopied, setIsScriptCopied] = useState(false);

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var sheetId = params.spreadsheetId || "1A5fN1mJ_YGr7v2vx3p8u3ZGH8KnvEjHkyOZzsnpYQa8";
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheets()[0];
    
    var headers = [
      "Timestamp", "Committee_Name", "Committee_Agency", "Branch_Code", "Branch_Name",
      "Candidate_ID", "Candidate_Name", "Province", "District",
      "b1_q1_1_1", "b1_q1_1_2", "b1_q1_1_3", "b1_q1_2_1", "b1_q1_2_2", "b1_q1_2_3", "b1_q1_2_4", "b1_q1_2_5",
      "b1_q1_3_1", "b1_q1_3_2", "b1_q2_1_1", "b1_q2_1_2", "b1_q2_1_3", "b1_q2_2_1", "b1_q2_2_2", "b1_q2_2_3",
      "b1_q2_3_1", "b1_q2_3_2", "b1_q2_3_3", "b1_q2_4_1", "b1_q3_1_1", "b1_q3_1_2", "b1_q3_1_3",
      "b1_q3_2_1", "b1_q3_2_2", "b1_q3_2_3", "b1_q3_3_1", "b1_q3_3_2", "b1_q3_3_3", "b1_total_score", "b1_comments",
      "b2_q1_1_honesty_ethics", "b2_q1_2_sacrifice_social", "b2_q1_3_perseverance", "b2_q1_4_role_model",
      "b2_q2_1_initiative_tech", "b2_q2_2_productivity_income", "b2_q2_3_eco_friendly",
      "b2_q3_1_awards_recognition", "b2_q3_2_speaker_trainer", "b2_q3_3_learning_center",
      "b2_q4_1_benefit_activities", "b2_q4_2_community_problem_solving", "b2_total_score", "b2_comments",
      "b3_q1_1_honesty_ethics", "b3_q1_2_sacrifice_social", "b3_q1_3_perseverance", "b3_q1_4_role_model",
      "b3_q2_1_initiative_tech", "b3_q2_2_productivity_income", "b3_q2_3_eco_friendly",
      "b3_q3_1_awards_recognition", "b3_q3_2_speaker_trainer", "b3_q3_3_learning_center",
      "b3_q4_1_benefit_activities", "b3_q4_2_community_problem_solving", "b3_total_score", "b3_comments",
      "b4_q1_1_honesty_ethics", "b4_q1_2_sacrifice_social", "b4_q1_3_perseverance", "b4_q1_4_role_model",
      "b4_q2_1_initiative_tech", "b4_q2_2_productivity_income", "b4_q2_3_eco_friendly",
      "b4_q3_1_awards_recognition", "b4_q3_2_speaker_trainer", "b4_q3_3_learning_center",
      "b4_q4_1_benefit_activities", "b4_q4_2_community_problem_solving", "b4_total_score", "b4_comments"
    ];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    
    var rowValues = headers.map(function(h) {
      return params[h] !== undefined ? params[h] : "";
    });
    
    sheet.appendRow(rowValues);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Synced successfully" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("ระบบเชื่อมต่อ Google Sheets พร้อมใช้งาน กรุณาใช้ POST ในการบันทึกคะแนน");
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode).then(() => {
      setIsScriptCopied(true);
      setTimeout(() => setIsScriptCopied(false), 2000);
    });
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync-to-sheets", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus({ success: true, message: data.message });
        setTimeout(() => setSyncStatus(null), 5000);
      } else {
        const errorData = await res.json();
        setSyncStatus({ success: false, message: errorData.error || "เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อส่งข้อมูล" });
      }
    } catch (err) {
      setSyncStatus({ success: false, message: "เกิดข้อผิดพลาดในการส่งคำร้องขอซิงค์" });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchExportData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/export");
      if (res.ok) {
        const data = await res.json();
        setCsvData(data);
      }
    } catch (err) {
      console.error("Error fetching export data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExportData();
  }, [evaluations]);

  const mappingData: MappingRow[] = [
    // Common info
    { header: "Timestamp", question: "วันเวลาที่ลงคะแนนประเมิน (อัตโนมัติ)", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Committee_Name", question: "ชื่อ-นามสกุล คณะกรรมการประเมิน", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Committee_Agency", question: "หน่วยงาน / สังกัด คณะกรรมการประเมิน", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Branch_Code", question: "รหัสสาขาปราชญ์เกษตร (1 - 4)", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Branch_Name", question: "ชื่อสาขาปราชญ์เกษตร", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Candidate_ID", question: "รหัสระบบผู้ได้รับการเสนอชื่อ", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Candidate_Name", question: "ชื่อ-นามสกุล ผู้ได้รับการเสนอชื่อ (ปราชญ์เกษตร)", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "Province", question: "จังหวัดของผู้รับการเสนอชื่อ", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },
    { header: "District", question: "เขตตรวจราชการ", branch: "ข้อมูลพื้นฐาน", maxScore: "N/A" },

    // Branch 1
    { header: "b1_q1_1_1", question: "1.1 ข้อ 1. เป็นบุคคลที่มีคุณูปการต่อภาคเกษตร มีชื่อเสียงได้รับการยอมรับในระดับพื้นที่ ไม่น้อยกว่า 20 ปี", branch: "สาขาที่ 1", maxScore: "4 คะแนน" },
    { header: "b1_q1_1_2", question: "1.1 ข้อ 2. เป็นบุคคลที่มีคุณูปการต่อภาคเกษตร มีชื่อเสียงได้รับการยอมรับในระดับประเทศ ไม่น้อยกว่า 20 ปี", branch: "สาขาที่ 1", maxScore: "4 คะแนน" },
    { header: "b1_q1_1_3", question: "1.1 ข้อ 3. เป็นบุคคลที่มีคุณูปการต่อภาคเกษตร มีชื่อเสียงได้รับการยอมรับในระดับต่างประเทศ ไม่น้อยกว่า 10 ปี", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q1_2_1", question: "1.2 ข้อ 1. ขยันหมั่นเพียร ใช้เวลาว่างให้เกิดประโยชน์ เป็นตัวอย่างของการพึ่งพาตนเอง", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q1_2_2", question: "1.2 ข้อ 2. เป็นแบบอย่างที่ดีของสมาชิกในครอบครัว ผู้คนในระดับชุมชนและประเทศ", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q1_2_3", question: "1.2 ข้อ 3. มีระเบียบวินัย เคารพกฎหมาย มีมารยาทและรับผิดชอบต่อส่วนรวม", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q1_2_4", question: "1.2 ข้อ 4. ปฏิบัติตนตามครรลองของระบอบประชาธิปไตย", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q1_2_5", question: "1.2 ข้อ 5. เป็นผู้ใฝ่รู้ และนำความรู้มาปฏิบัติงานจนเกิดประโยชน์", branch: "สาขาที่ 1", maxScore: "2 คะแนน" },
    { header: "b1_q3_1_3", question: "3.1 ข้อ 3. มีการถ่ายทอดผลงานผ่านสื่อที่หลากหลายและต่อเนื่อง", branch: "สาขาที่ 1", maxScore: "3 คะแนน" },
    { header: "b1_q3_2_1", question: "3.2 ข้อ 1. มีทีมงานเครือข่ายในระดับชุมชนและท้องถิ่น", branch: "สาขาที่ 1", maxScore: "3 คะแนน" },
    { header: "b1_q3_2_2", question: "3.2 ข้อ 2. มีกลุ่มเครือข่ายการพัฒนาเชื่อมโยงระหว่างชุมชนและภูมิภาค", branch: "สาขาที่ 1", maxScore: "3 คะแนน" },
    { header: "b1_q3_2_3", question: "3.2 ข้อ 3. มีกลุ่มองค์กรและเครือข่ายพัฒนากระจายกว้างขวางทั่วประเทศ", branch: "สาขาที่ 1", maxScore: "4 คะแนน" },
    { header: "b1_q3_3_1", question: "3.3 ข้อ 1. ผลงานได้รับการยอมรับและนำไปใช้ปฏิบัติแพร่หลายทั่วประเทศ", branch: "สาขาที่ 1", maxScore: "3 คะแนน" },
    { header: "b1_q3_3_2", question: "3.3 ข้อ 2. ผลงานได้รับการผลักดันเป็นนโยบายหรือแนวปฏิบัติระดับประเทศ", branch: "สาขาที่ 1", maxScore: "4 คะแนน" },
    { header: "b1_q3_3_3", question: "3.3 ข้อ 3. ผลงานได้รับการเผยแพร่จนมีการจำลองแบบในต่างประเทศ", branch: "สาขาที่ 1", maxScore: "3 คะแนน" },
    { header: "b1_total_score", question: "คะแนนรวมสาขาปราชญ์เกษตรผู้ทรงภูมิปัญญาฯ (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 1", maxScore: "100 คะแนน" },
    { header: "b1_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 1", branch: "สาขาที่ 1", maxScore: "ข้อความ" },

    // Branch 2
    { header: "b2_q1_1_honesty_ethics", question: "1.1 เป็นผู้สร้างสรรค์องค์ความรู้และมีคุญูปการด้านการเกษตร", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q1_2_sacrifice_social", question: "1.2 การประพฤติตนเป็นแบบอย่างที่ดี ได้ความยอมรับจากสังคม", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q1_3_perseverance", question: "1.3 มีคุณธรรม จริยธรรม และความเสียสละ", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_1_initiative_tech", question: "2.1 มีผลงานเป็นที่ประจักษ์ และได้รับการยอมรับ", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_2_productivity_income", question: "2.2 ประโยชน์ของผลงานที่เกี่ยวข้องกับเศรษฐกิจและสังคมภาคการเกษตร", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_3_eco_friendly", question: "2.3 การนำผลงานไปใช้ประโยชน์ในการแก้ไขปัญหา", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_4_creativity_ratio", question: "2.4 สัดส่วนในการสร้างสรรค์ผลงาน", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_1_awards_recognition", question: "3.1 การถ่ายทอดผลงาน", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_2_speaker_trainer", question: "3.2 การสร้างเครือข่าย", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_3_learning_center", question: "3.3 การยอมรับผลงานในระดับประเทศ และต่างประเทศ", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_total_score", question: "คะแนนรวมสาขาปราชญ์เกษตรเศรษฐกิจพอเพียง (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 2", maxScore: "100 คะแนน" },
    { header: "b2_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 2", branch: "สาขาที่ 2", maxScore: "ข้อความ" },

    // Branch 3
    { header: "b3_q1_1_honesty_ethics", question: "1.1 เป็นผู้สร้างสรรค์องค์ความรู้และมีคุญูปการด้านการเกษตร", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q1_2_sacrifice_social", question: "1.2 การประพฤติตนเป็นแบบอย่างที่ดี ได้ความยอมรับจากสังคม", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q1_3_perseverance", question: "1.3 มีคุณธรรม จริยธรรม และความเสียสละ", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_1_initiative_tech", question: "2.1 มีผลงานเป็นที่ประจักษ์ และได้รับการยอมรับ", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_2_productivity_income", question: "2.2 ประโยชน์ของผลงานที่เกี่ยวข้องกับเศรษฐกิจและสังคมภาคการเกษตร", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_3_eco_friendly", question: "2.3 การนำผลงานไปใช้ประโยชน์ในการแก้ไขปัญหา", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_4_creativity_ratio", question: "2.4 สัดส่วนในการสร้างสรรค์ผลงาน", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_1_awards_recognition", question: "3.1 การถ่ายทอดผลงาน", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_2_speaker_trainer", question: "3.2 การสร้างเครือข่าย", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_3_learning_center", question: "3.3 การยอมรับผลงานในระดับประเทศ และต่างประเทศ", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_total_score", question: "คะแนนรวมสาขาปราชญ์เกษตรดีเด่น (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 3", maxScore: "100 คะแนน" },
    { header: "b3_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 3", branch: "สาขาที่ 3", maxScore: "ข้อความ" },

    // Branch 4
    { header: "b4_q1_1_honesty_ethics", question: "1.1 เป็นผู้สร้างสรรค์องค์ความรู้และมีคุญูปการด้านการเกษตร", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q1_2_sacrifice_social", question: "1.2 การประพฤติตนเป็นแบบอย่างที่ดี ได้ความยอมรับจากสังคม", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q1_3_perseverance", question: "1.3 มีคุณธรรม จริยธรรม และความเสียสละ", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_1_initiative_tech", question: "2.1 มีผลงานเป็นที่ประจักษ์ และได้รับการยอมรับ", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_2_productivity_income", question: "2.2 ประโยชน์ของผลงานที่เกี่ยวข้องกับเศรษฐกิจและสังคมภาคการเกษตร", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_3_eco_friendly", question: "2.3 การนำผลงานไปใช้ประโยชน์ในการแก้ไขปัญหา", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_4_creativity_ratio", question: "2.4 สัดส่วนในการสร้างสรรค์ผลงาน", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_1_awards_recognition", question: "3.1 การถ่ายทอดผลงาน", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_2_speaker_trainer", question: "3.2 การสร้างเครือข่าย", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_3_learning_center", question: "3.3 การยอมรับผลงานในระดับประเทศ และต่างประเทศ", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_total_score", question: "คะแนนรวมสาขาปราชญ์ผู้นำชุมชนและเครือข่าย (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 4", maxScore: "100 คะแนน" },
    { header: "b4_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 4", branch: "สาขาที่ 4", maxScore: "ข้อความ" },
    { header: "b4_q3_1_awards_recognition", question: "3.1 การได้รับรางวัลหรือใบประกาศเกียรติคุณในระดับประเทศ/สากล", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_2_speaker_trainer", question: "3.2 การเป็นวิทยากรและผู้ถ่ายทอดความรู้ในเทคโนโลยีการเกษตร", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_3_learning_center", question: "3.3 การจัดทำศูนย์เรียนรู้ด้านการเกษตรดีเด่นเพื่อสังคม", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q4_1_benefit_activities", question: "4.1 กิจกรรมการบำเพ็ญประโยชน์ต่อสังคมและเพื่อนเกษตรกร", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q4_2_community_problem_solving", question: "4.2 ผลสัมฤทธิ์การมีส่วนร่วมแก้ไขปัญหาชุมชนและยกระดับชีวิต", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_total_score", question: "คะแนนรวมสาขาปราชญ์ผู้นำชุมชนและเครือข่าย (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 4", maxScore: "100 คะแนน" },
    { header: "b4_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 4", branch: "สาขาที่ 4", maxScore: "ข้อความ" },
    { header: "b2_q2_1_moderation", question: "2.1 ความพอประมาณในการประกอบอาชีพและชีวิต", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_2_reasonableness", question: "2.2 ความมีเหตุผลและการบริหารจัดการความเสี่ยง", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q2_3_immunity_finance", question: "2.3 การมีภูมิคุ้มกันที่ดีและการลดรายจ่าย เพิ่มรายได้ และออมเงิน", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_1_model_family", question: "3.1 ความเป็นต้นแบบครอบครัวหรือชุมชนเศรษฐกิจพอเพียง", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_2_leadership_network", question: "3.2 ความเป็นผู้นำในการสร้างและพัฒนาเครือข่ายเศรษฐกิจพอเพียง", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q3_3_spreading_dedication", question: "3.3 การอุทิศตนเพื่อเผยแพร่แนวคิดปรัชญาเศรษฐกิจพอเพียง", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q4_1_network_size_success", question: "4.1 จำนวนสมาชิกและผลสัมฤทธิ์ของเครือข่ายพอเพียง", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_q4_2_network_cooperation", question: "4.2 ผลการดำเนินกิจกรรมของเครือข่ายร่วมกันเพื่อประโยชน์ส่วนรวม", branch: "สาขาที่ 2", maxScore: "10 คะแนน" },
    { header: "b2_total_score", question: "คะแนนรวมสาขาปราชญ์เกษตรเศรษฐกิจพอเพียง (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 2", maxScore: "100 คะแนน" },
    { header: "b2_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 2", branch: "สาขาที่ 2", maxScore: "ข้อความ" },

    // Branch 3
    { header: "b3_q1_1_honesty_ethics", question: "1.1 ความซื่อสัตย์ สุจริต คุณธรรม และจริยธรรม", branch: "สาขาที่ 3", maxScore: "5 คะแนน" },
    { header: "b3_q1_2_sacrifice_social", question: "1.2 การอุทิศตน เสียสละ และการบำเพ็ญประโยชน์ต่อสังคม", branch: "สาขาที่ 3", maxScore: "5 คะแนน" },
    { header: "b3_q1_3_perseverance", question: "1.3 ความวิริยะ อุตสาหะ ในการประกอบอาชีพ", branch: "สาขาที่ 3", maxScore: "5 คะแนน" },
    { header: "b3_q1_4_role_model", question: "1.4 การเป็นแบบอย่างที่ดีในการดำรงชีวิต", branch: "สาขาที่ 3", maxScore: "5 คะแนน" },
    { header: "b3_q2_1_initiative_tech", question: "2.1 ความคิดริเริ่มและการนำเทคโนโลยีมาพัฒนาอาชีพเกษตรกรรม", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_2_productivity_income", question: "2.2 ผลผลิตและรายได้จากการทำการเกษตรดีเด่นเชิงพาณิชย์", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q2_3_eco_friendly", question: "2.3 ความเป็นมิตรต่อสิ่งแวดล้อมและเกษตรกรรมยั่งยืน", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_1_awards_recognition", question: "3.1 การได้รับรางวัลหรือใบประกาศเกียรติคุณในระดับประเทศ/สากล", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_2_speaker_trainer", question: "3.2 การเป็นวิทยากรและผู้ถ่ายทอดความรู้ในเทคโนโลยีการเกษตร", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q3_3_learning_center", question: "3.3 การจัดทำศูนย์เรียนรู้ด้านการเกษตรดีเด่นเพื่อสังคม", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q4_1_benefit_activities", question: "4.1 กิจกรรมการบำเพ็ญประโยชน์ต่อสังคมและเพื่อนเกษตรกร", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_q4_2_community_problem_solving", question: "4.2 ผลสัมฤทธิ์การมีส่วนร่วมแก้ไขปัญหาชุมชนและยกระดับชีวิต", branch: "สาขาที่ 3", maxScore: "10 คะแนน" },
    { header: "b3_total_score", question: "คะแนนรวมสาขาปราชญ์เกษตรดีเด่น (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 3", maxScore: "100 คะแนน" },
    { header: "b3_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 3", branch: "สาขาที่ 3", maxScore: "ข้อความ" },

    // Branch 4
    { header: "b4_q1_1_honesty_ethics", question: "1.1 ความซื่อสัตย์ สุจริต คุณธรรม และจริยธรรม", branch: "สาขาที่ 4", maxScore: "5 คะแนน" },
    { header: "b4_q1_2_sacrifice_social", question: "1.2 การอุทิศตน เสียสละ และการบำเพ็ญประโยชน์ต่อสังคม", branch: "สาขาที่ 4", maxScore: "5 คะแนน" },
    { header: "b4_q1_3_perseverance", question: "1.3 ความวิริยะ อุตสาหะ ในการประกอบอาชีพ", branch: "สาขาที่ 4", maxScore: "5 คะแนน" },
    { header: "b4_q1_4_role_model", question: "1.4 การเป็นแบบอย่างที่ดีในการดำรงชีวิต", branch: "สาขาที่ 4", maxScore: "5 คะแนน" },
    { header: "b4_q2_1_leader_establishment", question: "2.1 บทบาทความเป็นแกนนำในการจัดตั้งกลุ่ม หรือองค์กรชุมชน", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_2_community_management", question: "2.2 ความสามารถในการบริหารจัดการกลุ่มและการแก้ไขปัญหาชุมชน", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q2_3_leader_communication", question: "2.3 การสื่อสารและการใช้เทคโนโลยี/สื่อขับเคลื่อนเครือข่าย", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_1_network_strength", question: "3.1 ความเข้มแข็งและขนาดของการเชื่อมโยงเครือข่ายเกษตรกร", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_2_network_activities", question: "3.2 การดำเนินกิจกรรมของเครือข่ายอย่างต่อเนื่อง", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q3_3_network_collaboration", question: "3.3 ผลการทำงานร่วมกันของเครือข่ายที่เป็นประโยชน์ต่อวงกว้าง", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q4_1_member_impact", question: "4.1 ผลกระทบเชิงบวกต่อรายได้และความเป็นอยู่ของสมาชิก", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_q4_2_network_sustainability", question: "4.2 ความยั่งยืนและโครงสร้างเครือข่ายและการสร้างคนรุ่นใหม่", branch: "สาขาที่ 4", maxScore: "10 คะแนน" },
    { header: "b4_total_score", question: "คะแนนรวมสาขาปราชญ์ผู้นำชุมชนและเครือข่าย (ผลรวมอัตโนมัติ)", branch: "สาขาที่ 4", maxScore: "100 คะแนน" },
    { header: "b4_comments", question: "ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับสาขาที่ 4", branch: "สาขาที่ 4", maxScore: "ข้อความ" }
  ];

  const filteredMapping = mappingData.filter(m => {
    if (activeBranchFilter === "all") return true;
    if (activeBranchFilter === "base") return m.branch === "ข้อมูลพื้นฐาน";
    if (activeBranchFilter === "b1") return m.branch === "สาขาที่ 1";
    if (activeBranchFilter === "b2") return m.branch === "สาขาที่ 2";
    if (activeBranchFilter === "b3") return m.branch === "สาขาที่ 3";
    if (activeBranchFilter === "b4") return m.branch === "สาขาที่ 4";
    return true;
  });

  const handleCopyHeaders = () => {
    if (!csvData) return;
    const headerRow = csvData.headers.join(",");
    navigator.clipboard.writeText(headerRow).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    if (!csvData) return;
    
    // Create CSV content with UTF-8 BOM so Thai characters display correctly in Excel
    const BOM = "\uFEFF";
    let csvContent = BOM;
    
    // Add Headers
    csvContent += csvData.headers.join(",") + "\n";
    
    // Add Rows
    csvData.rows.forEach(row => {
      const lineValues = csvData.headers.map(header => {
        let val = row[header];
        if (val === undefined || val === null) {
          return "";
        }
        // If it's a string, wrap in double quotes to handle commas
        if (typeof val === "string") {
          // Double up inner quotes
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        }
        return val;
      });
      csvContent += lineValues.join(",") + "\n";
    });

    // Download triggers
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ปราชญ์เกษตร2570_คะแนนประเมิน_GoogleSheets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Help Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-1.5">
            <h2 className="text-lg md:text-xl font-sans font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5.5 h-5.5 text-blue-400" />
              โครงสร้างตารางข้อมูล & การเชื่อมโยง Google Sheets
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              ระบบนี้ออกแบบมาเพื่อจัดระเบียบข้อมูลคะแนนดิบตามหัวตาราง (Header Row) ของ Google Sheets อย่างเคร่งครัด 100% 
              เมื่อกรรมการส่งคะแนน ข้อมูลจะตกลงคอลัมน์ของหัวตารางที่ถูกต้องทันที สามารถคัดลอกส่วนหัวและดาวน์โหลดไฟล์เพื่อนำไปใช้ต่อได้ทันที
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              id="btn_copy_headers"
              onClick={handleCopyHeaders}
              disabled={!csvData}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 font-semibold text-xs md:text-sm border border-slate-800 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกคีย์หัวตาราง</span>
                </>
              )}
            </button>
            <button
              id="btn_download_csv"
              onClick={handleDownloadCSV}
              disabled={!csvData}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm shadow-md shadow-emerald-600/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV เข้าชีท</span>
            </button>
            <button
              id="btn_sync_google_sheets"
              onClick={handleSyncToSheets}
              disabled={isSyncing || !csvData || csvData.rows.length === 0}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs md:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                isSyncing ? "bg-amber-600 animate-pulse" : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "กำลังซิงค์..." : "ซิงค์ไปยัง Google Sheets"}</span>
            </button>
          </div>
        </div>
      </div>

      {syncStatus && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm animate-fade-in ${
          syncStatus.success 
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" 
            : "bg-rose-950/40 border-rose-800 text-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus.success ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="text-rose-400">●</span>}
            <span>{syncStatus.message}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-1 hover:bg-white/5 rounded-lg transition-all">ปิด</button>
        </div>
      )}

      {/* Google Apps Script Fix Guide */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-bold text-white">คู่มือแก้ไขข้อผิดพลาด / ตั้งค่า Google Apps Script (doPost)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                เนื่องจากการกรอกคะแนนแบบประเมินมีข้อมูลฟิลด์จำนวนมาก (เกิน 50 คอลัมน์) ระบบจึงจำเป็นต้องส่งข้อมูลด้วยเมธอด <span className="text-blue-400 font-bold">POST</span> เท่านั้น 
                หากท่านพบปัญหาซิงค์คะแนนไม่เข้า Google Sheets หรือพบข้อความแสดงข้อผิดพลาด "ไม่พบฟังก์ชัน doPost" กรุณาทำตามคู่มือแก้ไขดังนี้
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScriptGuide(!showScriptGuide)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 font-semibold text-xs border border-slate-800 transition-all cursor-pointer shrink-0"
          >
            {showScriptGuide ? "ซ่อนวิธีตั้งค่า" : "แสดงวิธีตั้งค่าโค้ด Apps Script"}
          </button>
        </div>

        {showScriptGuide && (
          <div className="space-y-4 pt-4 border-t border-slate-850 text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                <span className="text-blue-400 font-bold">ขั้นตอนที่ 1:</span>
                <p>เปิด Google Sheets ของท่าน (Sheet ID: <span className="text-amber-200 select-all font-mono">1A5fN1mJ_YGr7v2vx3p8u3ZGH8KnvEjHkyOZzsnpYQa8</span>) แล้วไปที่เมนู <b>ส่วนขยาย (Extensions) &gt; Apps Script</b></p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                <span className="text-blue-400 font-bold">ขั้นตอนที่ 2:</span>
                <p>ลบโค้ดเดิมทั้งหมดในโปรแกรมแปลงสคริปต์ออก แล้วกดปุ่ม <b>"คัดลอกโค้ด Apps Script"</b> ด้านล่างนี้ไปวางแทนที่ทั้งหมด</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                <span className="text-blue-400 font-bold">ขั้นตอนที่ 3:</span>
                <p>กดบันทึก จากนั้นเลือก <b>การทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New deployment)</b> เลือกประเภทเว็บแอปและเลือกผู้มีสิทธิ์เข้าใช้งานเป็น <b>"ทุกคน (Anyone)"</b></p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">โค้ดสคริปต์ที่พร้อมใช้งาน (คัดลอกไปวางได้ทันที):</span>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  {isScriptCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isScriptCopied ? "คัดลอกสำเร็จ!" : "คัดลอกโค้ด Apps Script"}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-850 overflow-x-auto text-[11px] font-mono text-slate-300 max-h-60 scrollbar-thin">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Live Sheet Preview & Mapping Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Mapping Table */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-md font-sans font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4.5 h-4.5 text-blue-400" />
                ตารางความสัมพันธ์หัวคอลัมน์ (Header Column Mapping)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">จับคู่ช่องคำถามของแบบประเมิน กับฟิลด์ Header ของ Google Sheets</p>
            </div>

            {/* Filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
              <button
                onClick={() => setActiveBranchFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "all" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveBranchFilter("base")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "base" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                ข้อมูลพื้นฐาน
              </button>
              <button
                onClick={() => setActiveBranchFilter("b1")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "b1" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                สาขา 1
              </button>
              <button
                onClick={() => setActiveBranchFilter("b2")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "b2" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                สาขา 2
              </button>
              <button
                onClick={() => setActiveBranchFilter("b3")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "b3" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                สาขา 3
              </button>
              <button
                onClick={() => setActiveBranchFilter("b4")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeBranchFilter === "b4" ? "bg-slate-950 border border-blue-500/40 text-blue-400" : "bg-slate-950 text-slate-500 border border-transparent"
                }`}
              >
                สาขา 4
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 md:p-4 font-mono font-bold">Google Sheet Header Name</th>
                  <th className="p-3 md:p-4 font-sans">รายละเอียดคำถาม / ข้อมูล</th>
                  <th className="p-3 md:p-4 font-sans text-center">หมวดหมู่</th>
                  <th className="p-3 md:p-4 font-sans text-right">เกณฑ์คะแนน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredMapping.map((row) => (
                  <tr key={row.header} className="hover:bg-slate-950/40 text-slate-300">
                    <td className="p-3 md:p-4 font-mono text-emerald-400 font-semibold bg-emerald-500/[0.01]">
                      {row.header}
                    </td>
                    <td className="p-3 md:p-4 leading-relaxed max-w-xs md:max-w-md">
                      {row.question}
                    </td>
                    <td className="p-3 md:p-4 text-center shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.branch === "ข้อมูลพื้นฐาน" ? "bg-slate-800 text-slate-300" : "bg-blue-950/50 text-blue-400 border border-blue-900/30"
                      }`}>
                        {row.branch}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-right font-mono font-medium text-slate-400">
                      {row.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Interactive Sheets Live Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-md font-sans font-bold text-white flex items-center gap-2">
              <Table className="w-4.5 h-4.5 text-blue-400" />
              จำลองหน้าตา Google Sheets ของคุณ
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">พรีวิวการจัดเรียงเมื่อเชื่อมต่อด้วย Google Sheets (แบบเรียลไทม์)</p>
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 overflow-hidden relative min-h-[300px] flex flex-col justify-between">
            {/* Sheet UI header simulator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">ปราชญ์เกษตร2570.xlsx</span>
                </div>
                <button
                  onClick={fetchExportData}
                  disabled={isLoading}
                  className="p-1 hover:bg-slate-900 rounded text-slate-500"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              {/* Grid representation */}
              <div className="overflow-x-auto text-[10px] font-mono whitespace-nowrap scrollbar-thin">
                <div className="flex bg-slate-900 border border-slate-800 text-slate-400 font-bold divide-x divide-slate-800">
                  <div className="p-1.5 min-w-[120px]">Timestamp</div>
                  <div className="p-1.5 min-w-[120px]">Committee_Name</div>
                  <div className="p-1.5 min-w-[130px]">Candidate_Name</div>
                  <div className="p-1.5 min-w-[100px]">Branch_Code</div>
                  <div className="p-1.5 min-w-[120px]">b1_total_score</div>
                  <div className="p-1.5 min-w-[120px]">b2_total_score</div>
                </div>

                <div className="divide-y divide-slate-900">
                  {csvData && csvData.rows.length > 0 ? (
                    csvData.rows.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="flex divide-x divide-slate-900 hover:bg-slate-900/30 text-slate-300">
                        <div className="p-1.5 min-w-[120px] truncate">{row.Timestamp ? new Date(row.Timestamp).toLocaleDateString("th-TH") : "N/A"}</div>
                        <div className="p-1.5 min-w-[120px] truncate">{row.Committee_Name || "N/A"}</div>
                        <div className="p-1.5 min-w-[130px] truncate text-amber-200">{row.Candidate_Name || "N/A"}</div>
                        <div className="p-1.5 min-w-[100px] text-center">{row.Branch_Code || "N/A"}</div>
                        <div className="p-1.5 min-w-[120px] text-center text-emerald-400 font-bold">{row.b1_total_score || ""}</div>
                        <div className="p-1.5 min-w-[120px] text-center text-emerald-400 font-bold">{row.b2_total_score || ""}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-600">
                      ยังไม่มีคะแนนกรอกเข้ามา
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl text-[11px] text-slate-400 leading-relaxed mt-4">
              <div className="flex gap-1 text-slate-300 font-bold mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>คำแนะนำสำหรับการดึงข้อมูล:</span>
              </div>
              เมื่อบันทึกคะแนนเสร็จเรียบร้อยแล้ว คณะกรรมการสามารถกดปุ่ม <span className="text-emerald-400 font-bold">"ส่งออก CSV เข้าชีท"</span> เพื่อนำข้อมูลคะแนนที่สมบูรณ์ไปอัปโหลดขึ้น Google Sheets ได้ทันทีอย่างเป็นระเบียบ สะดวก และปลอดภัย
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
