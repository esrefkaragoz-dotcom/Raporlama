export interface Person {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  primaryDuties: string[];
  secondaryDuties: string[];
  specialExpertise: string[];
  assignedPublishers: string[];
  targetDailyProcess?: number;
  targetDailyCueSheet?: number;
  targetDailyEser?: number;
  notes?: string;
  specialRoleOrDuty?: string;
  hasCueDuty?: boolean;
}

export interface ParsedMetrics {
  processCount: number;
  cueSheetCount: number;
  eserCount: number;
  dilekceCount: number;
  agreementCount: number;
  unknownCount: number;
  meetingHours: number;
  detectedCategories: string[];
  detectedPublishers: string[];
}

export interface ReportItem {
  id: string;
  created_at: string;
  person: string;
  start_date: string;
  end_date: string;
  report: string;
  work_count?: number;
  parsedMetrics?: ParsedMetrics;
}

export interface PersonDutyAnalysis {
  personName: string;
  periodText: string;
  dutyAlignmentScore: number; // 0-100
  alignmentLevel: 'Çok Yüksek' | 'Yüksek' | 'Orta' | 'Düşük';
  summary: string;
  inScopeDutiesPerformed: string[];
  outOfScopeTasks: string[];
  neglectedOrPendingDuties: string[];
  keyHighlights: string[];
  managerRecommendations: string[];
  workVolumeSummary: {
    totalReports: number;
    totalProcess: number;
    totalCueSheets: number;
    totalEser: number;
    totalDilekce: number;
    topPublishers: string[];
  };
}

export interface TeamWorkloadAnalysis {
  title: string;
  periodText: string;
  executiveSummary: string;
  teamProductivityScore: number; // 0-100
  workloadDistribution: {
    personName: string;
    loadLevel: 'Aşırı Yüklü' | 'Yoğun' | 'Dengeli' | 'Düşük';
    primaryFocus: string;
    alignmentScore: number;
    comment: string;
  }[];
  criticalBottlenecks: {
    areaOrProject: string;
    riskLevel: 'Kritik' | 'Orta' | 'Düşük';
    description: string;
    suggestedAction: string;
  }[];
  publisherCoverage: {
    publisherName: string;
    activeHandlers: string[];
    workStatus: string;
  }[];
  strategicAdvice: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
