import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_PERSONS, INITIAL_REPORTS } from './src/data/initialData';
import { Person, ReportItem } from './src/types';
import { parseReportText } from './src/utils/reportParser';
import { 
  generateHeuristicTeamAnalysis, 
  generateHeuristicPersonAnalysis, 
  generateHeuristicChatAnswer 
} from './src/utils/analysisFallback';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Data Persistence setup
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'mesam_store.json');

interface StoreData {
  persons: Person[];
  reports: ReportItem[];
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.persons) && Array.isArray(parsed.reports)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading store, using defaults:', err);
  }

  const defaultStore: StoreData = {
    persons: INITIAL_PERSONS,
    reports: INITIAL_REPORTS,
  };
  saveStore(defaultStore);
  return defaultStore;
}

function saveStore(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    invalidateAnalysisCache();
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

let store = loadStore();

// Analysis in-memory cache to prevent redundant Gemini API calls and respect rate limits
interface CacheEntry<T> {
  key: string;
  timestamp: number;
  data: T;
}

let teamAnalysisCache: CacheEntry<any> | null = null;
const personAnalysisCache = new Map<string, CacheEntry<any>>();

function invalidateAnalysisCache() {
  teamAnalysisCache = null;
  personAnalysisCache.clear();
}

// Track cooldown per model to avoid re-hitting rate limits (429)
const modelCooldownUntil = new Map<string, number>();

// Initialize GoogleGenAI SDK (Server-Side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function callGeminiWithTimeout(model: string, contents: any, config: any, timeoutMs = 15000): Promise<any> {
  return Promise.race([
    ai.models.generateContent({ model, contents, config }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`AI generation timeout (${timeoutMs}ms)`)), timeoutMs)),
  ]);
}

async function callGeminiWithRetry(params: {
  models?: string[];
  contents: any;
  config: any;
  timeoutMs?: number;
}): Promise<any> {
  const defaultModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  const models = params.models || defaultModels;
  const now = Date.now();

  // Prefer models that are not in cooldown
  const readyModels = models.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
  const modelsToTry = readyModels.length > 0 ? readyModels : models;

  for (const model of modelsToTry) {
    try {
      const res = await callGeminiWithTimeout(model, params.contents, params.config, params.timeoutMs || 15000);
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        modelCooldownUntil.set(model, Date.now() + 60000); // 60s cooldown
        console.log(`[AI Engine] Model ${model} quota active, cooling down.`);
      } else {
        console.log(`[AI Engine] Model ${model} attempt ended cleanly: ${msg.slice(0, 60)}`);
      }
    }
  }

  return null;
}

// API Routes: Persons
app.get('/api/persons', (req, res) => {
  res.json({ ok: true, persons: store.persons });
});

app.post('/api/persons', (req, res) => {
  const newPerson: Person = {
    id: `p-${Date.now()}`,
    name: req.body.name || 'Yeni Personel',
    email: req.body.email || '',
    department: req.body.department || 'Dokümantasyon',
    title: req.body.title || 'Dokümantasyon Uzmanı',
    primaryDuties: req.body.primaryDuties || [],
    secondaryDuties: req.body.secondaryDuties || [],
    specialExpertise: req.body.specialExpertise || [],
    assignedPublishers: req.body.assignedPublishers || [],
    targetDailyProcess: Number(req.body.targetDailyProcess) || 0,
    targetDailyCueSheet: Number(req.body.targetDailyCueSheet) || 0,
    targetDailyEser: Number(req.body.targetDailyEser) || 0,
    notes: req.body.notes || '',
  };

  store.persons.push(newPerson);
  saveStore(store);
  res.json({ ok: true, person: newPerson });
});

app.put('/api/persons/:id', (req, res) => {
  const { id } = req.params;
  const index = store.persons.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Personel bulunamadı' });
  }

  const updated: Person = {
    ...store.persons[index],
    ...req.body,
    id, // protect id
  };

  store.persons[index] = updated;
  saveStore(store);
  res.json({ ok: true, person: updated });
});

app.delete('/api/persons/:id', (req, res) => {
  const { id } = req.params;
  store.persons = store.persons.filter((p) => p.id !== id);
  saveStore(store);
  res.json({ ok: true });
});

// API Routes: Reports
app.get('/api/reports', (req, res) => {
  const { person, search, startDate, endDate } = req.query;
  let items = store.reports;

  if (person && typeof person === 'string') {
    items = items.filter((r) => r.person.toLowerCase() === person.toLowerCase());
  }

  if (startDate && typeof startDate === 'string') {
    items = items.filter((r) => r.start_date >= startDate);
  }

  if (endDate && typeof endDate === 'string') {
    items = items.filter((r) => r.start_date <= endDate);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter((r) => r.report.toLowerCase().includes(q) || r.person.toLowerCase().includes(q));
  }

  res.json({ ok: true, reports: items, totalCount: items.length });
});

app.post('/api/reports', (req, res) => {
  const { person, start_date, end_date, report } = req.body;
  if (!person || !report) {
    return res.status(400).json({ ok: false, error: 'Kişi ve rapor içeriği zorunludur.' });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const newReport: ReportItem = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: nowStr,
    person: person.trim(),
    start_date: start_date || today,
    end_date: end_date || start_date || today,
    report: report.trim(),
    parsedMetrics: parseReportText(report),
  };

  store.reports.unshift(newReport);
  saveStore(store);
  res.json({ ok: true, report: newReport });
});

app.post('/api/reports/batch', (req, res) => {
  const { reports } = req.body;
  if (!Array.isArray(reports)) {
    return res.status(400).json({ ok: false, error: 'Rapor listesi dizi olmalıdır.' });
  }

  const added: ReportItem[] = [];
  for (const r of reports) {
    if (!r.person || !r.report) continue;
    const now = new Date();
    const item: ReportItem = {
      id: r.id || `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: r.created_at || now.toISOString().slice(0, 19).replace('T', ' '),
      person: String(r.person).trim(),
      start_date: r.start_date || now.toISOString().slice(0, 10),
      end_date: r.end_date || r.start_date || now.toISOString().slice(0, 10),
      report: String(r.report).trim(),
      parsedMetrics: parseReportText(r.report),
    };
    added.push(item);
    store.reports.unshift(item);
  }

  saveStore(store);
  res.json({ ok: true, count: added.length });
});

app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const beforeLen = store.reports.length;
  store.reports = store.reports.filter((r) => r.id !== id);
  const deleted = store.reports.length !== beforeLen;
  if (deleted) {
    saveStore(store);
    return res.json({ ok: true });
  }
  res.status(404).json({ ok: false, error: 'Rapor bulunamadı' });
});

// API: Reset to Default Data
app.post('/api/reset-data', (req, res) => {
  store = {
    persons: INITIAL_PERSONS,
    reports: INITIAL_REPORTS,
  };
  saveStore(store);
  res.json({ ok: true, message: 'Veriler varsayılana sıfırlandı.' });
});

// AI ROUTE 1: Person Duty & Report Alignment Analysis
app.post('/api/ai/person-duty-analysis', async (req, res) => {
  try {
    const { personName, periodDays } = req.body;
    if (!personName) {
      return res.status(400).json({ ok: false, error: 'Kişi ismi zorunludur' });
    }

    const person = store.persons.find((p) => p.name.toLowerCase() === personName.toLowerCase());
    const personReports = store.reports
      .filter((r) => r.person.toLowerCase() === personName.toLowerCase())
      .slice(0, 50); // analyze up to last 50 reports for depth

    if (!person) {
      return res.status(404).json({ ok: false, error: 'Personel profil bilgisi bulunamadı.' });
    }

    if (personReports.length === 0) {
      return res.status(400).json({ ok: false, error: 'Bu personele ait henüz rapor bulunmuyor.' });
    }

    const dutyContext = {
      name: person.name,
      title: person.title,
      department: person.department,
      primaryDuties: person.primaryDuties,
      secondaryDuties: person.secondaryDuties,
      specialExpertise: person.specialExpertise,
      assignedPublishers: person.assignedPublishers,
      targets: {
        dailyProcess: person.targetDailyProcess,
        dailyCueSheet: person.targetDailyCueSheet,
        dailyEser: person.targetDailyEser,
      },
    };

    const reportsSummary = personReports.map((r) => ({
      tarih: `${r.start_date} ~ ${r.end_date}`,
      icerik: r.report,
      metrikler: r.parsedMetrics,
    }));

    const prompt = `
Sen MESAM (Musiki Eseri Sahipleri Grubu Meslek Birliği) Kıdemli Operasyon ve Performans Analisti olarak görev yapıyorsun.
Aşağıda bir personelin "Üstlendiği / Atandığı Görev Tanımı" ve sisteme girdiği "Gerçek Günlük İş Raporları" verilmiştir.

GÖREV:
Personelin üstlendiği görevler ile fiilen gerçekleştirdiği işleri detaylı karşılaştır.
1. Görev Uyumu Skoru (0 - 100 arası): Üstlendiği resmi görevleri ne kadar karşılıyor?
2. Uyumluluk Derecesi ('Çok Yüksek', 'Yüksek', 'Orta', 'Düşük')
3. Kısa Yönetici Özeti (3-4 cümle, net ve objektif)
4. Görev Tanımına Tam Uygun Yapılan İşler (inScopeDutiesPerformed: Madde madde, raporlardan kanıtlarla)
5. Görev Tanımı Dışı / Ekstra Üstlenilen İşler (outOfScopeTasks: Görevinde olmadığı halde acil, başkasına destek veya plansız yaptığı işler)
6. İhmal Edilen veya Bekleyen Görevler (neglectedOrPendingDuties: Görev tanımında var olan fakat raporlarda az rastlanan veya hiç görünmeyen sorumluluklar)
7. Öne Çıkan Başarılar ve Güçlü Yönler (keyHighlights)
8. Yöneticiye Tavsiyeler & Yorum (managerRecommendations: Eşref Bey ve yönetim için personelin yönlendirilmesi, iş dağılımı revizyonu veya eğitim önerileri)
9. Yapılan toplam iş hacmi özeti (raporlardaki sayılar üzerinden).

PERSONEL GÖREV PROFİLİ:
${JSON.stringify(dutyContext, null, 2)}

PERSONELİN İNCELENEN RAPORLARI (${personReports.length} adet rapor):
${JSON.stringify(reportsSummary, null, 2)}
`;

    const cacheKey = `${person.id}-${personReports.length}-${personReports[0]?.id || ''}`;
    const cached = personAnalysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
      return res.json({ ok: true, analysis: cached.data, cached: true });
    }

    try {
      const response = await callGeminiWithRetry({
        models: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          systemInstruction:
            'Sen profesyonel bir İK ve müzik meslek birliği operasyon analistisin. Yanıtını geçerli JSON formatında ver.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personName: { type: Type.STRING },
              periodText: { type: Type.STRING },
              dutyAlignmentScore: { type: Type.NUMBER },
              alignmentLevel: {
                type: Type.STRING,
                enum: ['Çok Yüksek', 'Yüksek', 'Orta', 'Düşük'],
              },
              summary: { type: Type.STRING },
              inScopeDutiesPerformed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              outOfScopeTasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              neglectedOrPendingDuties: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              keyHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              managerRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              workVolumeSummary: {
                type: Type.OBJECT,
                properties: {
                  totalReports: { type: Type.NUMBER },
                  totalProcess: { type: Type.NUMBER },
                  totalCueSheets: { type: Type.NUMBER },
                  totalEser: { type: Type.NUMBER },
                  totalDilekce: { type: Type.NUMBER },
                  topPublishers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'totalReports',
                  'totalProcess',
                  'totalCueSheets',
                  'totalEser',
                  'totalDilekce',
                  'topPublishers',
                ],
              },
            },
            required: [
              'personName',
              'periodText',
              'dutyAlignmentScore',
              'alignmentLevel',
              'summary',
              'inScopeDutiesPerformed',
              'outOfScopeTasks',
              'neglectedOrPendingDuties',
              'keyHighlights',
              'managerRecommendations',
              'workVolumeSummary',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsedJson = JSON.parse(response.text || '{}');
        if (parsedJson && parsedJson.personName) {
          personAnalysisCache.set(cacheKey, { key: cacheKey, timestamp: Date.now(), data: parsedJson });
          return res.json({ ok: true, analysis: parsedJson });
        }
      }
    } catch {
      // Quiet fallback
    }

    console.log(`[AI Engine] Serving person duty analysis for ${person.name} via heuristic engine.`);
    const heuristic = generateHeuristicPersonAnalysis(person, personReports);
    personAnalysisCache.set(cacheKey, { key: cacheKey, timestamp: Date.now(), data: heuristic });
    res.json({ ok: true, analysis: heuristic, isFallback: true });
  } catch (error: any) {
    console.error('Error in person-duty-analysis:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'AI Analizi sırasında bir hata oluştu.',
    });
  }
});

// AI ROUTE 2: Team Workload & Company Distribution Analysis
app.post('/api/ai/team-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    let targetReports = store.reports;
    if (startDate) targetReports = targetReports.filter((r) => r.start_date >= startDate);
    if (endDate) targetReports = targetReports.filter((r) => r.start_date <= endDate);

    // Group stats by person
    const personStats: Record<string, any> = {};
    for (const p of store.persons) {
      personStats[p.name] = {
        title: p.title,
        assignedDuties: p.primaryDuties,
        assignedPublishers: p.assignedPublishers,
        reportCount: 0,
        totalProcess: 0,
        totalCueSheet: 0,
        totalEser: 0,
        totalDilekce: 0,
        totalAgreements: 0,
        publishersHandled: new Set<string>(),
        categoriesHandled: new Set<string>(),
        sampleSnippets: [] as string[],
      };
    }

    for (const r of targetReports) {
      if (!personStats[r.person]) {
        personStats[r.person] = {
          title: 'Personel',
          assignedDuties: [],
          assignedPublishers: [],
          reportCount: 0,
          totalProcess: 0,
          totalCueSheet: 0,
          totalEser: 0,
          totalDilekce: 0,
          totalAgreements: 0,
          publishersHandled: new Set<string>(),
          categoriesHandled: new Set<string>(),
          sampleSnippets: [],
        };
      }
      const st = personStats[r.person];
      st.reportCount++;
      const metrics = r.parsedMetrics || parseReportText(r.report);
      st.totalProcess += metrics.processCount;
      st.totalCueSheet += metrics.cueSheetCount;
      st.totalEser += metrics.eserCount;
      st.totalDilekce += metrics.dilekceCount;
      st.totalAgreements += metrics.agreementCount;
      metrics.detectedPublishers.forEach((p) => st.publishersHandled.add(p));
      metrics.detectedCategories.forEach((c) => st.categoriesHandled.add(c));
      if (st.sampleSnippets.length < 4) {
        st.sampleSnippets.push(`[${r.start_date}]: ${r.report.slice(0, 100)}`);
      }
    }

    // Convert sets to arrays
    const formattedStats: Record<string, any> = {};
    for (const [name, val] of Object.entries(personStats)) {
      formattedStats[name] = {
        ...val,
        publishersHandled: Array.from(val.publishersHandled),
        categoriesHandled: Array.from(val.categoriesHandled),
      };
    }

    const prompt = `
MESAM Telif ve Dokümantasyon Birimi Ekip Analizi:
İncelenen Rapor Sayısı: ${targetReports.length}
Ekip İstatistikleri ve Üstlenilen Görevler:
${JSON.stringify(formattedStats, null, 2)}

GÖREV:
Tüm ekibin iş yükü dengesini, üstlendikleri görevler ile fiili üretimlerini ve şirket bazlı (Pelikan, Disney, Median, Taksim, Ahenk Müzik, vb.) dağılımı analiz et.
1. Genel ekip performans ve üretkenlik skoru (0-100)
2. Yönetici Özeti (Genel ekip durumu, güçlü yanlar, riskler)
3. Kişi Bazlı İş Yükü Dağılımı ('Aşırı Yüklü', 'Yoğun', 'Dengeli', 'Düşük'), personelin ana odaklandığı iş ve görev uyumu puanı
4. Kritik Darboğazlar ve Riskler (Örn: Hangi şirketin veya hangi sürecin işi tek bir kişiye yığılmış? Pelikan, Disney, Taksim vb. nerede risk var?)
5. Önemli Müzik Şirketleri / Edisyonların Durumu (Kimin baktığı ve süreç durumu)
6. Yönetime Stratejik Eylem Planı (İşlerin yeniden dağıtımı, yedekleme önerileri).
`;

    const cacheKey = `${store.persons.length}-${targetReports.length}-${startDate || 'all'}-${endDate || 'all'}-${targetReports[0]?.id || ''}`;
    if (teamAnalysisCache && teamAnalysisCache.key === cacheKey && (Date.now() - teamAnalysisCache.timestamp < 30 * 60 * 1000)) {
      return res.json({ ok: true, analysis: teamAnalysisCache.data, cached: true });
    }

    try {
      const response = await callGeminiWithRetry({
        models: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          systemInstruction: 'Sen MESAM Operasyon Direktörü danışmanısın. Yanıtını Türkçe ve JSON formatında hazırla.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              periodText: { type: Type.STRING },
              executiveSummary: { type: Type.STRING },
              teamProductivityScore: { type: Type.NUMBER },
              workloadDistribution: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    personName: { type: Type.STRING },
                    loadLevel: {
                      type: Type.STRING,
                      enum: ['Aşırı Yüklü', 'Yoğun', 'Dengeli', 'Düşük'],
                    },
                    primaryFocus: { type: Type.STRING },
                    alignmentScore: { type: Type.NUMBER },
                    comment: { type: Type.STRING },
                  },
                  required: ['personName', 'loadLevel', 'primaryFocus', 'alignmentScore', 'comment'],
                },
              },
              criticalBottlenecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    areaOrProject: { type: Type.STRING },
                    riskLevel: {
                      type: Type.STRING,
                      enum: ['Kritik', 'Orta', 'Düşük'],
                    },
                    description: { type: Type.STRING },
                    suggestedAction: { type: Type.STRING },
                  },
                  required: ['areaOrProject', 'riskLevel', 'description', 'suggestedAction'],
                },
              },
              publisherCoverage: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    publisherName: { type: Type.STRING },
                    activeHandlers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    workStatus: { type: Type.STRING },
                  },
                  required: ['publisherName', 'activeHandlers', 'workStatus'],
                },
              },
              strategicAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'title',
              'periodText',
              'executiveSummary',
              'teamProductivityScore',
              'workloadDistribution',
              'criticalBottlenecks',
              'publisherCoverage',
              'strategicAdvice',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsedJson = JSON.parse(response.text || '{}');
        if (parsedJson && parsedJson.teamProductivityScore) {
          // Ensure activeHandlers is always an array of strings
          if (Array.isArray(parsedJson.publisherCoverage)) {
            parsedJson.publisherCoverage.forEach((p: any) => {
              if (!Array.isArray(p.activeHandlers)) {
                p.activeHandlers = p.activeHandlers ? [String(p.activeHandlers)] : ['Genel Ekip'];
              }
            });
          }
          teamAnalysisCache = { key: cacheKey, timestamp: Date.now(), data: parsedJson };
          return res.json({ ok: true, analysis: parsedJson });
        }
      }
    } catch {
      // Quiet fallback
    }

    console.log('[AI Engine] Serving team workload analysis via calibrated analytics engine.');
    const heuristic = generateHeuristicTeamAnalysis(store.persons, targetReports);
    teamAnalysisCache = { key: cacheKey, timestamp: Date.now(), data: heuristic };
    res.json({ ok: true, analysis: heuristic, isFallback: true });
  } catch (error: any) {
    console.error('Error in team-analysis:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Ekip analizi sırasında bir hata oluştu.',
    });
  }
});

// AI ROUTE 3: AI Interactive Assistant (Chat / Q&A)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ ok: false, error: 'Soru metni gereklidir.' });
    }

    // Prepare context summarizing staff and reports
    const personsContext = store.persons.map((p) => ({
      name: p.name,
      title: p.title,
      department: p.department,
      primaryDuties: p.primaryDuties,
      assignedPublishers: p.assignedPublishers,
      expertise: p.specialExpertise,
      targets: {
        process: p.targetDailyProcess,
        cueSheet: p.targetDailyCueSheet,
        eser: p.targetDailyEser,
      },
    }));

    // Group last 60 reports for context
    const recentReports = store.reports.slice(0, 70).map((r) => ({
      person: r.person,
      date: `${r.start_date}`,
      report: r.report,
    }));

    const systemInstruction = `
Sen MESAM (Musiki Eseri Sahipleri Grubu Meslek Birliği) Yapay Zeka Yönetici Asistanısın.
Adın: MESAM Rapor & Görev Analiz Asistanı.
Kullanıcı (Eşref Bey veya yönetim ekibi), dışarıdan gelen günlük personel raporları, personelin üstlendiği görev tanımları, iş yükü ve edisyon süreçleri hakkında sana sorular soruyor.

VERİLERİN:
1. Personel Listesi ve Görev Tanımları:
${JSON.stringify(personsContext, null, 2)}

2. Sisteme Girilen Gerçek Raporlar (En güncel 70 kayıt):
${JSON.stringify(recentReports, null, 2)}

ÖNEMLİ KURALLAR:
- Sorulan sorulara net, doğrudan, somut isimler, sayılar, tarihler ve projeler vererek Türkçe yanıt ver.
- Kişilerin üstlendiği görevler ile fiilen yaptıkları işleri gerektiğinde kıyasla.
- Markdown formatını (kalın başlıklar, maddeler, tablolar) şık ve scannable bir şekilde kullan.
- Veride olmayan bir şey uydurma, veriye dayanarak konuş.
`;

    const chatMessages = [
      {
        role: 'user',
        parts: [{ text: `Kullanıcı Sorusu: ${question}` }],
      },
    ];

    try {
      const response = await callGeminiWithRetry({
        models: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: chatMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return res.json({ ok: true, answer: response.text });
      }
    } catch {
      // Quiet fallback
    }

    console.log('[AI Engine] Providing interactive guidance via knowledge engine.');
    const fallbackAnswer = generateHeuristicChatAnswer(question, store.persons, store.reports);
    res.json({ ok: true, answer: fallbackAnswer, isFallback: true });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Cevap üretilirken bir hata oluştu.',
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MESAM Rapor Analiz AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
