import { ParsedMetrics, ReportItem } from '../types';

const KNOWN_PUBLISHERS = [
  'Pelikan',
  'Median',
  'Disney',
  'Ahenk',
  'Taksim',
  'Es Müzik',
  'Eurus',
  'Sony',
  'Concord',
  'Universal',
  'Pasaj',
  'Ulus',
  'DMC',
  'Doğan Müzik',
  'NetD',
  'Pana Film',
  'Harmonee',
  'Sahne Sanatları',
  'Dark',
  'Poll',
  'Kalan Müzik',
  'Wediacorp',
  'Fatih Alp',
  'ETL',
  'Artvizyon',
  'NK',
  'Kemal Faruk',
  'Global Edisyon',
  'Notavera',
  'ILS',
  'Dinazor',
  'Arcadia',
  'Kara Müzik',
  'Zoo Turizm',
  'Sayanora',
  'Güvercin Müzik',
  'GMP Eticket',
  'Cevlan',
  'Okyanus Müzik',
  'Sonses',
  'Arba Prod',
  'ONK Ajans',
  'Looops Medya',
  'Kuzgun Müzik',
  'Fa Müzik',
  'Floom Müzik',
  'Viya Müzik',
  'Hüner Edisyon',
  'Mona Medya',
  'Zin Kültür',
  'Star Müzik',
  'Gazel Müzik',
  'Beyza Müzik',
  'Hasarı Film',
  'İkrar Yayımcılık',
  'İstanbul Edisyon',
  'Kahuna Bilişim',
  'Yoyo İstanbul',
  'EMG Yapım',
  'Tüm Yıldızlar',
  'Füzyon Müzik',
  'Fiks Müzik',
  'Mavisaz',
  'Pozitif Edisyon',
  'TOO Prodüksiyon',
  'MHZ',
  'Müzikotek',
  'GNL',
  'İrem Emre',
  'Erdem Uyanık',
  'TMP',
  'Ünal Yüksel',
  'TMC',
  'TRT',
  'Burak Öksüzoğlu',
];

const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  Process: ['process', 'proccess', 'proces'],
  'Cue Sheet': ['cue-sheet', 'cue sheet', 'cuesheet', 'jenerik'],
  'Eser Kaydı / Bildirimi': ['eser kayd', 'eser bildirim', 'eser bilgi', 'fiche', 'fich', 'work kayd', 'work bildirim'],
  'Sözleşme & Hak Sahipliği': ['sözleşme', 'sozlesme', 'hak sahipli', 'agreement', 'agm', 'fesih', 'devir'],
  'Dilekçe & Hukuk / TBK': ['dilekçe', 'dilekce', 'tbk', 'mahkeme', 'hukuk'],
  'Unknown / Çakışma / Eşleştirme': ['unknown', 'cwr', 'cisnet', 'iswc', 'çakışma', 'cakisma', 'bloke', 'core'],
  'Toplantı & Telefon / Görüşme': ['toplantı', 'toplanti', 'telefon', 'görüşme', 'gorusme', 'ziyaret'],
  'Tanıtım / Reklam': ['reklam', 'tanıtım', 'tanitim', 'jingle'],
  'İzin / Mazeret': ['izin', 'mazeret', 'raporlu', 'hastane'],
};

export function parseReportText(text: string): ParsedMetrics {
  const lower = (text || '').toLowerCase();

  let processCount = 0;
  let cueSheetCount = 0;
  let eserCount = 0;
  let dilekceCount = 0;
  let agreementCount = 0;
  let unknownCount = 0;
  let meetingHours = 0;

  // Process patterns: "121 adet process", "53 tane process", "Process (22 tane)"
  const processMatches = lower.matchAll(/(\d+)\s*(?:adet|tane|ad|tane\s*cwr)?\s*proc?ess/gi);
  for (const match of processMatches) {
    processCount += parseInt(match[1], 10) || 0;
  }
  const procRevMatches = lower.matchAll(/proc?ess\s*(?:\()?\s*(\d+)/gi);
  for (const match of procRevMatches) {
    if (processCount === 0) processCount += parseInt(match[1], 10) || 0;
  }

  // Cue-sheet patterns: "4 tane cue-sheet", "15 cue sheet", "3 cue sheet"
  const cueMatches = lower.matchAll(/(\d+)\s*(?:tane|adet|bölüm|bolum)?\s*(?:cue[\s-]?sheet|cuesheet)/gi);
  for (const match of cueMatches) {
    cueSheetCount += parseInt(match[1], 10) || 0;
  }
  const cueRevMatches = lower.matchAll(/cue[\s-]?sheet\s*(?:\()?\s*(\d+)/gi);
  for (const match of cueRevMatches) {
    if (cueSheetCount === 0) cueSheetCount += parseInt(match[1], 10) || 0;
  }

  // Eser patterns: "88 eser kaydı", "47 eser bilgisi", "40 work", "18 yeni eser"
  const eserMatches = lower.matchAll(/(\d+)\s*(?:tane|adet)?\s*(?:eser|work|fiche|fich)\b/gi);
  for (const match of eserMatches) {
    eserCount += parseInt(match[1], 10) || 0;
  }

  // Dilekçe: "3 dilekçe", "1 dilekçe"
  const dilekceMatches = lower.matchAll(/(\d+)\s*(?:tane|adet)?\s*dilek[çc]e/gi);
  for (const match of dilekceMatches) {
    dilekceCount += parseInt(match[1], 10) || 0;
  }

  // Sözleşme / Agreement: "2 sözleşme", "10 agreemant"
  const agMatches = lower.matchAll(/(\d+)\s*(?:tane|adet)?\s*(?:s[öo]zle[şs]me|agreement|agm)/gi);
  for (const match of agMatches) {
    agreementCount += parseInt(match[1], 10) || 0;
  }

  // Unknown: "21 unknown", "70 eser unknown"
  const unkMatches = lower.matchAll(/(\d+)\s*(?:tane|adet|eser)?\s*unknown/gi);
  for (const match of unkMatches) {
    unknownCount += parseInt(match[1], 10) || 0;
  }

  // Meeting hours: "toplantı (2 saat)", "1saat 40 dk"
  const hourMatches = lower.matchAll(/(\d+)\s*(?:saat|dk|dakika)/gi);
  for (const match of hourMatches) {
    meetingHours += parseInt(match[1], 10) || 0;
  }

  // Detect Publishers
  const detectedPublishers: string[] = [];
  for (const pub of KNOWN_PUBLISHERS) {
    const regex = new RegExp(`\\b${pub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      detectedPublishers.push(pub);
    }
  }

  // Detect Categories
  const detectedCategories: string[] = [];
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedCategories.push(catName);
    }
  }

  return {
    processCount,
    cueSheetCount,
    eserCount,
    dilekceCount,
    agreementCount,
    unknownCount,
    meetingHours,
    detectedCategories,
    detectedPublishers,
  };
}

export function enrichReport(report: ReportItem): ReportItem {
  return {
    ...report,
    parsedMetrics: parseReportText(report.report),
  };
}
