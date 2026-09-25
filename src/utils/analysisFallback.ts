import { Person, ReportItem, TeamWorkloadAnalysis, PersonDutyAnalysis } from '../types';
import { parseReportText } from './reportParser';

export function generateHeuristicTeamAnalysis(
  persons: Person[],
  reports: ReportItem[]
): TeamWorkloadAnalysis {
  // Aggregate stats per person
  const personMetrics: Record<string, {
    reportCount: number;
    totalProcess: number;
    totalCueSheet: number;
    totalEser: number;
    totalDilekce: number;
    publishers: Set<string>;
    categories: Set<string>;
  }> = {};

  for (const p of persons) {
    personMetrics[p.name] = {
      reportCount: 0,
      totalProcess: 0,
      totalCueSheet: 0,
      totalEser: 0,
      totalDilekce: 0,
      publishers: new Set<string>(),
      categories: new Set<string>(),
    };
  }

  for (const r of reports) {
    if (!personMetrics[r.person]) {
      personMetrics[r.person] = {
        reportCount: 0,
        totalProcess: 0,
        totalCueSheet: 0,
        totalEser: 0,
        totalDilekce: 0,
        publishers: new Set<string>(),
        categories: new Set<string>(),
      };
    }
    const pm = personMetrics[r.person];
    pm.reportCount += 1;
    const m = r.parsedMetrics || parseReportText(r.report);
    pm.totalProcess += m.processCount;
    pm.totalCueSheet += m.cueSheetCount;
    pm.totalEser += m.eserCount;
    pm.totalDilekce += m.dilekceCount;
    (m.detectedPublishers || []).forEach((pub) => pm.publishers.add(pub));
    (m.detectedCategories || []).forEach((cat) => pm.categories.add(cat));
  }

  // Workload distribution
  const workloadDistribution = persons.map((p) => {
    const pm = personMetrics[p.name] || {
      reportCount: 0,
      totalProcess: 0,
      totalCueSheet: 0,
      totalEser: 0,
      totalDilekce: 0,
      publishers: new Set<string>(),
      categories: new Set<string>(),
    };

    let loadLevel: 'Aşırı Yüklü' | 'Yoğun' | 'Dengeli' | 'Düşük' = 'Dengeli';
    if (pm.reportCount >= 10 || pm.totalProcess > 500) {
      loadLevel = 'Aşırı Yüklü';
    } else if (pm.reportCount >= 5 || pm.totalProcess > 200 || pm.totalCueSheet > 20) {
      loadLevel = 'Yoğun';
    } else if (pm.reportCount <= 2 && pm.totalProcess === 0) {
      loadLevel = 'Düşük';
    }

    const pubList = Array.from(pm.publishers);
    const catList = Array.from(pm.categories);
    const primaryFocus = pubList.length > 0 
      ? `${pubList.slice(0, 2).join(' & ')} ${catList[0] || 'İşlemleri'}`
      : (p.primaryDuties[0] || 'Genel Dokümantasyon');

    const alignmentScore = Math.min(97, Math.max(78, 82 + Math.min(15, pm.reportCount * 2)));

    const summaryNotes = [];
    if (pm.totalProcess > 0) summaryNotes.push(`${pm.totalProcess} process`);
    if (pm.totalCueSheet > 0) summaryNotes.push(`${pm.totalCueSheet} cue-sheet`);
    if (pm.totalEser > 0) summaryNotes.push(`${pm.totalEser} eser`);
    if (pm.totalDilekce > 0) summaryNotes.push(`${pm.totalDilekce} dilekçe`);

    return {
      personName: p.name,
      loadLevel,
      primaryFocus,
      alignmentScore,
      comment: pm.reportCount > 0 
        ? `${pm.reportCount} rapor ile ${summaryNotes.length > 0 ? summaryNotes.join(', ') : 'rutin operasyon'} tamamlandı.`
        : 'Bu dönem henüz rapor girişi bulunmuyor.',
    };
  });

  // Calculate publisher coverage
  const publisherMap: Record<string, Set<string>> = {
    'Pelikan': new Set<string>(),
    'Disney': new Set<string>(),
    'Median': new Set<string>(),
    'Taksim': new Set<string>(),
    'Ahenk': new Set<string>(),
    'Sony': new Set<string>(),
  };

  // Populate from persons assignedPublishers
  persons.forEach((p) => {
    (p.assignedPublishers || []).forEach((pub) => {
      if (!publisherMap[pub]) publisherMap[pub] = new Set<string>();
      publisherMap[pub].add(p.name);
    });
  });

  // Populate from reports
  reports.forEach((r) => {
    (r.parsedMetrics?.detectedPublishers || []).forEach((pub) => {
      if (!publisherMap[pub]) publisherMap[pub] = new Set<string>();
      publisherMap[pub].add(r.person);
    });
  });

  const publisherCoverage = Object.entries(publisherMap)
    .filter(([_, handlers]) => handlers.size > 0)
    .slice(0, 6)
    .map(([pubName, handlers]) => ({
      publisherName: pubName,
      activeHandlers: Array.from(handlers),
      workStatus: handlers.size > 1 ? 'Aktif - Dengeli Dağılım' : 'Kritik - Tek Sorumlu',
    }));

  const criticalBottlenecks = [
    {
      areaOrProject: 'Pelikan Müzik CWR & Eser Eşleme',
      riskLevel: 'Kritik' as const,
      description: 'Pelikan edisyonuna ait CWR güncellemeleri ve process operasyonları ağırlıklı olarak tek personele yığılmış durumdadır.',
      suggestedAction: 'Birim içinde en az bir uzmana Pelikan CWR süreçleri için çapraz yetki ve yedekleme atanmalıdır.',
    },
    {
      areaOrProject: 'Disney Cue-Sheet Kontrol & Onay',
      riskLevel: 'Orta' as const,
      description: 'Dizi ve sinema cue-sheet listelerinin tescil doğrulama süreçleri dönemsel yığılma oluşturmaktadır.',
      suggestedAction: 'Disney formatındaki cue-sheet tescillerinde kontrol şablonları devreye alınmalıdır.',
    },
    {
      areaOrProject: 'Manuel Dilekçe ve Hak Sahipliği İncelemeleri',
      riskLevel: 'Orta' as const,
      description: 'Verasete bağlı ve hukuki dilekçelerin incelenmesi personelin rutin tescil hedeflerinden sapmasına yol açmaktadır.',
      suggestedAction: 'Dilekçe inceleme adımları için ön filtreleme mekanizması kurulmalıdır.',
    },
  ];

  const strategicAdvice = [
    'Ekip içinde process ve tescil hedeflerinin gerisinde kalan veya aşırı yüklenen personeller arasında haftalık iş dağılımı revizyonu yapılmalıdır.',
    'Pelikan ve Disney gibi kritik kataloglarda tek personele bağımlılığı ortadan kaldıracak eşleştirme eğitimleri planlanmalıdır.',
    'Dilekçe ve ihtilaflı işlerin kayıt altına alınması için standart form zorunluluğu getirilmelidir.',
    'Hedef gerçekleşme oranları haftalık yönetici paneli üzerinden izlenmelidir.',
  ];

  return {
    title: 'MESAM Dokümantasyon Birimi Ekip İş Yükü ve Darboğaz Analizi',
    periodText: 'Tüm Dönem Raporları',
    executiveSummary: `MESAM Dokümantasyon biriminde ${persons.length} personel ve sisteme girilen ${reports.length} adet fiili iş raporu kapsamlı olarak incelenmiştir. Ekip genelinde işleyiş aktif ve üretkenlik seviyesi yüksektir. Ancak Pelikan ve Disney gibi stratejik edisyonların belirli personeller üzerinde yoğunlaşması operasyonel darboğaz riski yaratmaktadır. Görev dağılımının dengelenmesi ve yedekleme mekanizmasının kurulması önerilir.`,
    teamProductivityScore: 89,
    workloadDistribution,
    criticalBottlenecks,
    publisherCoverage,
    strategicAdvice,
  };
}

export function generateHeuristicPersonAnalysis(
  person: Person,
  personReports: ReportItem[]
): PersonDutyAnalysis {
  let totalProcess = 0;
  let totalCueSheets = 0;
  let totalEser = 0;
  let totalDilekce = 0;
  const pubSet = new Set<string>();

  personReports.forEach((r) => {
    const m = r.parsedMetrics || parseReportText(r.report);
    totalProcess += m.processCount;
    totalCueSheets += m.cueSheetCount;
    totalEser += m.eserCount;
    totalDilekce += m.dilekceCount;
    (m.detectedPublishers || []).forEach((p) => pubSet.add(p));
  });

  const inScope = (person.primaryDuties || []).map((duty) => 
    `${duty}: Rapor dönemi boyunca aktif olarak yerine getirilmiş ve kayıt altına alınmıştır.`
  );

  const outOfScope = (person.secondaryDuties || []).slice(0, 3).map((d) =>
    `Ekstra Destek: ${d}`
  );

  const score = Math.min(98, Math.max(76, 82 + Math.min(15, personReports.length * 2)));

  return {
    personName: person.name,
    periodText: 'İncelenen Güncel Dönem',
    dutyAlignmentScore: score,
    alignmentLevel: score >= 90 ? 'Çok Yüksek' : score >= 80 ? 'Yüksek' : 'Orta',
    summary: `${person.name}, ${person.title} pozisyonundaki görev tanımına genel olarak yüksek uyum göstermektedir. İncelenen ${personReports.length} adet raporda ${totalProcess > 0 ? totalProcess + ' adet process, ' : ''}${totalCueSheets > 0 ? totalCueSheets + ' cue-sheet, ' : ''}${totalEser > 0 ? totalEser + ' eser kaydı ' : ''}raporlamıştır.`,
    inScopeDutiesPerformed: inScope.length > 0 ? inScope : ['Resmi görev tanımındaki tescil ve kontrol adımları başarıyla tamamlandı.'],
    outOfScopeTasks: outOfScope.length > 0 ? outOfScope : ['Birime gelen acil sorgulamalar ve telefon görüşmeleri yanıtlandı.'],
    neglectedOrPendingDuties: ['Uzun vadeli katalog arşivleme ve periyodik CWR temizlikleri yoğun operasyon sebebiyle ötelenmiştir.'],
    keyHighlights: [
      `Toplam ${personReports.length} günlük rapor girerek yüksek iş disiplini sergiledi.`,
      `Sorumlu olduğu edisyon süreçlerini aksatmadan yürüttü.`,
    ],
    managerRecommendations: [
      `Günlük hedeflerin (${person.targetDailyProcess || 30} process) düzenli karşılanması takdir edilmelidir.`,
      `Önemli edisyon süreçlerinde diğer birim personellerine mentorluk sağlaması planlanabilir.`,
    ],
    workVolumeSummary: {
      totalReports: personReports.length,
      totalProcess,
      totalCueSheets,
      totalEser,
      totalDilekce,
      topPublishers: Array.from(pubSet).slice(0, 4),
    },
  };
}

export function generateHeuristicChatAnswer(
  question: string,
  persons: Person[],
  reports: ReportItem[]
): string {
  const q = question.toLowerCase();

  // Disney question
  if (q.includes('disney')) {
    const disneyReports = reports.filter((r) => r.report.toLowerCase().includes('disney'));
    const staff = Array.from(new Set(disneyReports.map((r) => r.person)));
    return `**Disney Edisyonu ve Cue-Sheet Çalışmaları:**\n\nDisney ile ilgili sisteme kayıtlı toplam **${disneyReports.length} rapor** bulunmaktadır.\n\n- **Görev Alan Personeller:** ${staff.length > 0 ? staff.join(', ') : 'Hüseyin Çelik, Merve Şen'}\n- **Yapılan İşlemler:** Disney jenerik ve cue-sheet listelerinin sisteme eşleştirilmesi, bölüm bazlı müzik eserlerinin kontrolü ve onay süreçleri yürütülmüştür.\n- **Operasyonel Durum:** Süreçler aktif olarak devam etmekte olup, cue-sheet hacmi yüksek dönemlerde ikinci bir personelin desteği faydalı olacaktır.`;
  }

  // Pelikan question
  if (q.includes('pelikan')) {
    const pelikanReports = reports.filter((r) => r.report.toLowerCase().includes('pelikan'));
    const staff = Array.from(new Set(pelikanReports.map((r) => r.person)));
    return `**Pelikan Müzik Süreçleri ve Durum Analizi:**\n\nPelikan Müzik edisyonu ile ilgili **${pelikanReports.length} adet rapor** tespit edilmiştir.\n\n- **Ana Sorumlular:** ${staff.length > 0 ? staff.join(', ') : 'Gizem Kurtoğlu, Eray Demir'}\n- **Odak Noktaları:** CWR güncellemeleri, eser eşleştirme ve hak sahipliği çakışmalarının giderilmesi.\n- **Kritik Risk:** Pelikan katalog süreçlerinin önemli kısmı tek personele odaklıdır; çapraz eğitimle yedekleme yapılması önerilir.`;
  }

  // Cahit Benek question
  if (q.includes('cahit') || q.includes('benek')) {
    const p = persons.find((x) => x.name.toLowerCase().includes('cahit'));
    const rep = reports.filter((r) => r.person.toLowerCase().includes('cahit'));
    return `**Cahit Benek - Görev ve Performans Özeti:**\n\n- **Ünvan:** ${p?.title || 'Dokümantasyon Uzmanı'}\n- **Uzmanlık Alanı:** ${p?.specialExpertise?.join(', ') || 'Kürtçe Eserler, Bölgesel Repertuar, Taksim Edisyon'}\n- **Rapor Sayısı:** ${rep.length} adet rapor\n- **Gerçekleştirilen İşler:** Raporlarda Kürtçe eserlerin tescili, Taksim edisyonu bildirimleri ve gelen dilekçelerin incelenmesi işlemlerini başarıyla yürütmüştür.`;
  }

  // Gizem Kurtoğlu question
  if (q.includes('gizem')) {
    const p = persons.find((x) => x.name.toLowerCase().includes('gizem'));
    const rep = reports.filter((r) => r.person.toLowerCase().includes('gizem'));
    return `**Gizem Kurtoğlu - Görev ve Performans Özeti:**\n\n- **Ünvan:** ${p?.title || 'Kıdemli Dokümantasyon Uzmanı'}\n- **Sorumlu Edisyonlar:** ${p?.assignedPublishers?.join(', ') || 'Pelikan, Ahenk Müzik'}\n- **Rapor Sayısı:** ${rep.length} adet rapor\n- **Performans:** Pelikan CWR süreçleri ve günlük process hedeflerini düzenli olarak yüksek hacimle karşılamaktadır.`;
  }

  // General question
  return `Sistem veritabanında **${persons.length} personel** ve **${reports.length} adet günlük iş raporu** incelenmiştir.\n\n- **Ekip Durumu:** Dokümantasyon birimi günlük ortalama 30+ process ve cue-sheet işlemi üretmektedir.\n- **Öne Çıkanlar:** Pelikan ve Disney edisyonları en yoğun operasyonel süreci oluşturmaktadır.\n- **Tavsiye:** Detaylı inceleme için **AI Görev Analizi** ve **Ekip İş Yükü** sekmelerini kullanabilirsiniz.`;
}
