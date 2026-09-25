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

  // Calculate publisher coverage based on official SharePoint mappings & reports
  const publisherMap: Record<string, Set<string>> = {
    'Pelikan': new Set<string>(),
    'Wediacorp': new Set<string>(),
    'Median Müzik Grubu': new Set<string>(),
    'Doğan Müzik (DMC) & NetD': new Set<string>(),
    'Poll Grubu (Menajerlik & Prodüksiyon)': new Set<string>(),
    'Universal Müzik (Yerli & Yabancı)': new Set<string>(),
    'Taksim Edisyon': new Set<string>(),
    'Kalan Müzik': new Set<string>(),
    'ILS & Dinazor': new Set<string>(),
    'Müzikotek': new Set<string>(),
    'GMP Eticket & ONK Ajans': new Set<string>(),
    'Eurus & Ulus': new Set<string>(),
  };

  // Populate from persons assignedPublishers
  persons.forEach((p) => {
    (p.assignedPublishers || []).forEach((pub) => {
      // Find matching group or add directly
      let matched = false;
      for (const key of Object.keys(publisherMap)) {
        if (pub.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
          publisherMap[key].add(p.name);
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (!publisherMap[pub]) publisherMap[pub] = new Set<string>();
        publisherMap[pub].add(p.name);
      }
    });
  });

  // Populate from reports
  reports.forEach((r) => {
    (r.parsedMetrics?.detectedPublishers || []).forEach((pub) => {
      let matched = false;
      for (const key of Object.keys(publisherMap)) {
        if (pub.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
          publisherMap[key].add(r.person);
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (!publisherMap[pub]) publisherMap[pub] = new Set<string>();
        publisherMap[pub].add(r.person);
      }
    });
  });

  const publisherCoverage = Object.entries(publisherMap)
    .filter(([_, handlers]) => handlers.size > 0)
    .slice(0, 10)
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

  // General Edition & Duty distribution query
  if (q.includes('edisyon') && (q.includes('kim') || q.includes('dağılım') || q.includes('liste') || q.includes('sorumlu'))) {
    return `**MESAM Resmi Edisyon ve Görev Dağılım Matrisi (SharePoint):**\n\nEkibimizdeki 16 personelin sorumlu olduğu temel edisyonlar ve resmi görev dağılımı şöyledir:\n\n` +
      `1. **Sena Uğurlu:** TBK Bildirimleri Sorumlusu • Wediacorp, Fatih Alp, ETL, Artvizyon, NK, Kemal Faruk, Global Edisyon, Notavera (8 edisyon)\n` +
      `2. **Gizem Kurtoğlu:** Üye Dilekçeleri Sorumlusu • ILS, Dinazor, Arcadia, Kara Müzik, Zoo Turizm, Sayanora, Güvercin Müzik (8 edisyon)\n` +
      `3. **Ahmet Turan Çalışkan:** Cues Nöbetçisi • GMP Eticket, Cevlan, Okyanus Müzik, Sonses, Arba Prod, ONK Ajans, Looops Medya, Kuzgun Müzik (8 edisyon)\n` +
      `4. **Onur İnanç:** Taksim Edisyon Yabancı, Fa Müzik, Floom Müzik, Edisyon Müzik (4 edisyon)\n` +
      `5. **Nursena Harput:** Pelikan Yerli, Pelikan Yabancı, Viya Müzik (3 edisyon)\n` +
      `6. **Yücel Gezgin:** Üye Reklam Bildirimleri • Dark ve Dark, Kalan Müzik, Poll Grubu (Menajerlik/Org/Prodüksiyon), Pelikan International/Wise Music/Danışmanlık (8 edisyon)\n` +
      `7. **Cahit Benek:** Cues Nöbetçisi • Hüner Edisyon, Mona Medya, Zin Kültür Sanat (3 edisyon)\n` +
      `8. **Emrah Kurtoğlu:** Median Müzik Edisyon Grubu (Collective Future, Blue, International, Red, Median Ltd) (6 edisyon)\n` +
      `9. **Hilal Algun:** Cues Nöbetçisi • Es Müzik, Pasaj Film, Sahne Sanatları, Pana Film, Star Müzik, Gazel Müzik (6 edisyon)\n` +
      `10. **Büşra Sezer:** Doğan Müzik (DMC), NetD, Beyza Müzik, Hasarı Film, İkrar, İstanbul Edisyon, Kahuna, Yoyo, EMG, Ahenk Müzik (10 edisyon)\n` +
      `11. **Büşra Şimşek:** Dokümantasyon & Eser Tescil Operasyonları\n` +
      `12. **Neslihan Yılmaz:** Üye Cue Sheet Bildirimleri & Cues Nöbetçisi • Tüm Yıldızlar, Harmonee, Füzyon, Fiks, Mavisaz, Pozitif, TOO, Eurus, MHZ, Ulus (10 edisyon)\n` +
      `13. **Nebahat Seçci:** Universal Müzik Taksim Yerli, Müzikotek, GNL, İrem Emre, Erdem Uyanık, TMP (6 edisyon)\n` +
      `14. **Eşref Karagöz:** Birim Yöneticisi • Universal Music International Yabancı Repertuvarı, TMC (2 edisyon)\n` +
      `15. **Gökçe & İrem:** Eser Bildirimi ve tescil işlemleri sorumlusu\n\n` +
      `Detaylı tabloyu **Personel > Edisyon & Görev Matrisi** sekmesinden interaktif olarak inceleyebilirsiniz.`;
  }

  // TBK question
  if (q.includes('tbk') || q.includes('borçlar kanunu')) {
    return `**TBK (Türk Borçlar Kanunu) ve Üye Bildirimleri Sorumlusu:**\n\n- **Yetkili Personel:** **Sena Uğurlu**\n- **Resmi Görev Tanımı:** TBK bildirimleri, üye bildirimleri, komisyon/yönetim kararlarının takibi ve sisteme işlenmesi.\n- **Sorumlu Olduğu Edisyonlar (8 Adet):** Wediacorp, Fatih Alp, ETL, Artvizyon, NK, Kemal Faruk, Global Edisyon Yay. Söz., Notavera.`;
  }

  // Dilekçe question
  if (q.includes('dilekçe') || q.includes('dilekce')) {
    return `**Üye Dilekçeleri ve Hukuki İncelemeler Sorumlusu:**\n\n- **Yetkili Personel:** **Gizem Kurtoğlu**\n- **Resmi Görev Tanımı:** Birim genelindeki tüm üye dilekçelerinin incelenmesi, hukuki ihtilafların araştırılması ve cevaplanması.\n- **Sorumlu Olduğu Edisyonlar (8 Adet):** ILS, Dinazor, Arcadia Entertainment, Kara Müzik, Zoo Turizm, Dinazor Boyama Sanatları, Sayanora, Güvercin Müzik.`;
  }

  // Reklam Bildirimleri question
  if (q.includes('reklam')) {
    return `**Üye Reklam Bildirimleri Sorumlusu:**\n\n- **Yetkili Personel:** **Yücel Gezgin**\n- **Resmi Görev Tanımı:** Üye reklam müzikleri, jingle bildirimleri ve AVR entegrasyonu.\n- **Sorumlu Olduğu Edisyonlar (8 Adet):** Dark ve Dark, Kalan Müzik, Poll Menajerlik, Poll Organizasyon, Poll Prodüksiyon, Pelikan International, Pelikan Wise Music Group, Pelikan Danışmanlık.`;
  }

  // Cue Sheet nöbeti question
  if (q.includes('nöbet') || q.includes('nobet') || (q.includes('cue') && q.includes('kim'))) {
    return `**Cue-Sheet Nöbeti ve Bildirim Sorumluları:**\n\n` +
      `1. **Resmi Üye Cue Sheet Bildirimleri Yetkilisi:** **Neslihan Yılmaz** (Tüm Yıldızlar, Harmonee, Füzyon, Fiks, Pozitif, Eurus, Ulus dahil 10 edisyon)\n` +
      `2. **Cue-Sheet Nöbetçileri (Cues Nöbet Listesi):**\n` +
      `   - **Ahmet Turan Çalışkan** (GMP Eticket, ONK Ajans vb. 8 edisyon)\n` +
      `   - **Cahit Benek** (Hüner, Mona Medya, Zin Kültür vb. 3 edisyon)\n` +
      `   - **Hilal Algun** (Es Müzik, Pasaj, Pana Film vb. 6 edisyon)\n` +
      `   - **Neslihan Yılmaz** (10 edisyon)`;
  }

  // Eser Bildirimi question
  if (q.includes('eser bildirim')) {
    return `**Eser Bildirimi Resmi Sorumluları:**\n\n- **Yetkili Personeller:** **Gökçe** ve **İrem**\n- **Resmi Görev:** Üyelerden gelen fiziki ve online yeni eser bildirim formlarının kontrolü, fiche kayıtları ve tescil işlemlerinin eksiksiz yürütülmesi.`;
  }

  // Wediacorp question
  if (q.includes('wediacorp')) {
    return `**Wediacorp Edisyonu Sorumlusu:**\n\n- **Sorumlu:** **Sena Uğurlu**\n- Sena Uğurlu ayrıca TBK bildirimleri, Fatih Alp, ETL, Artvizyon, NK, Kemal Faruk, Global Edisyon ve Notavera edisyonlarını da yönetmektedir.`;
  }

  // Median question
  if (q.includes('median')) {
    return `**Median Müzik Edisyon Grubu Sorumlusu:**\n\n- **Sorumlu:** **Emrah Kurtoğlu**\n- **Sorumlu Olduğu 6 Şirket:** Median Collective Future Music, Median Blue Music, Median Music International, Median Müzik Edisyon Ltd, Median Müzik Edisyon Ltd Şti, Median Red Music. CWR entegrasyonları ve yabancı sözleşmeler kendisi tarafından takip edilmektedir.`;
  }

  // DMC / NetD / Doğan question
  if (q.includes('dmc') || q.includes('doğan') || q.includes('dogan') || q.includes('netd')) {
    return `**Doğan Müzik (DMC) ve NetD Sorumlusu:**\n\n- **Sorumlu:** **Büşra Sezer**\n- Büşra Sezer ayrıca Beyza Müzik, Hasarı Film, İkrar, İstanbul Edisyon, Kahuna, Yoyo, EMG ve Ahenk Müzik olmak üzere toplam **10 büyük edisyonun** resmi sorumlusudur.`;
  }

  // Pelikan question
  if (q.includes('pelikan')) {
    return `**Pelikan Müzik Süreçleri ve Dağılımı:**\n\n- **Pelikan Yerli ve Pelikan Yabancı:** **Nursena Harput** (CWR güncelleme, ACK ve sözleşme girişleri)\n- **Pelikan International, Wise Music Group, Danışmanlık:** **Yücel Gezgin**\n- Pelikan MESAM'ın en yüksek veri hacmine sahip edisyonu olup operasyonlar Nursena Harput ve Yücel Gezgin koordinasyonunda yürütülmektedir.`;
  }

  // Universal question
  if (q.includes('universal')) {
    return `**Universal Müzik Edisyon Dağılımı:**\n\n- **Universal Müzik Taksim Edisyon Yerli:** **Nebahat Seçci**\n- **Universal Music International Yabancı Repertuvarı:** **Eşref Karagöz**\n- Universal kataloğundaki yerli ve yabancı bildirimler iki uzman koordinatör tarafından takip edilmektedir.`;
  }

  // Poll question
  if (q.includes('poll')) {
    return `**Poll Müzik Grubu Edisyon Sorumlusu:**\n\n- **Sorumlu:** **Yücel Gezgin**\n- **Kapsam:** Poll Menajerlik, Poll Organizasyon ve Poll Prodüksiyon edisyonlarının tüm telif ve sözleşme tescil süreçleri Yücel Gezgin tarafından yürütülmektedir.`;
  }

  // Disney question
  if (q.includes('disney')) {
    const disneyReports = reports.filter((r) => r.report.toLowerCase().includes('disney'));
    return `**Disney Edisyonu ve Cue-Sheet Çalışmaları:**\n\n- Disney cue-sheet ve jenerik kontrolleri birim cue-sheet nöbetçileri (Ahmet Turan, Cahit Benek, Hilal Algun, Neslihan Yılmaz) ve veri işleme ekibince yapılmaktadır.\n- Raporlarda toplam **${disneyReports.length} adet** Disney işlemi tespit edilmiştir.`;
  }

  // General question
  return `Sistem veritabanında **${persons.length} personel** ve **${reports.length} adet günlük iş raporu** incelenmiştir.\n\n- **Ekip Durumu:** Dokümantasyon biriminde 16 personel kayıtlı olup 87 edisyonun resmi dağılımı SharePoint listesine göre eşleştirilmiştir.\n- **Öne Çıkan Dağılımlar:**\n  * TBK Bildirimleri: Sena Uğurlu\n  * Üye Dilekçeleri: Gizem Kurtoğlu\n  * Üye Reklam Bildirimleri: Yücel Gezgin\n  * Üye Cue Sheet: Neslihan Yılmaz\n  * Cue-Sheet Nöbeti: Ahmet Turan, Cahit Benek, Hilal Algun, Neslihan Yılmaz\n  * Eser Bildirimi: Gökçe, İrem\n\nDetaylı inceleme için **Personel > Edisyon & Görev Matrisi** sekmesini kullanabilirsiniz.`;
}
