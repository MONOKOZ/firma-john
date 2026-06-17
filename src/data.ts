import { ServiceCategory, TeamMember, HistoryMilestone, JobVacancy, CMSContent } from "./types";

/**
 * DEFAULT_ALLGEMEIN — Seed/Fallback der Key-Value-Inhalte.
 * Einzige Quelle (vorher 4× dupliziert: googleSheets-const, populate, write, index.astro).
 */
export const DEFAULT_ALLGEMEIN: Record<string, string> = {
  contact_phone: "03378 801127",
  contact_email: "info@john-haustechnik.de",
  contact_address: "Dornweg 14, 14974 Ludwigsfelde",
  contact_hours: "Mo - Do: 07:00 - 16:30 Uhr | Fr: 07:00 - 14:00 Uhr",
  notdienst_phone: "0172 3004050",
  hero_title: "Meisterliche Haustechnik für Bad & Heizung",
  hero_subtitle: "Seit 1981 der ehrliche & verlässliche Fachbetrieb in Ludwigsfelde. Wir planen moderne Wärmepumpen, gestalten barrierefreie Bäder und reparieren dichte Rohrnetze zur vollsten Zufriedenheit.",
  experience_stat: "45 Jahre",
  success_stat: "100%"
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Sven John",
    role: "Inhaber & Installateur- und Heizungsbaumeister",
    quote: "Für mich ist Handwerk nicht nur Arbeit, sondern Verantwortung. Die Wärme in Ihrer Wohnung und die Sicherheit Ihrer Leitungen sind seit über vier Jahrzehnten unsere Familiensache.",
    description: "Sven führt die Firma John in zweiter Generation mit einem kompromisslosen Auge für Detailqualität. Er koordiniert die Großprojekte, plant regenerative Energiesysteme und berät Kunden persönlich vor Ort in Ludwigsfelde und Umgebung.",
    experienceYear: 1998,
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Sabine John",
    role: "Kaufmännische Betriebsleitung & Kundenservice",
    quote: "Eine Baustelle funktioniert nur so gut wie ihre Vorbereitung. Wenn Sie uns anrufen, bin ich die Stimme, die dafür sorgt, dass Ihr Anliegen direkt verstanden wird.",
    description: "Sabine strukturiert das 'Gehirn' des Betriebs. Sie leitet das Büro, organisiert die präzise Taktung unseres Notdienstes und wickelt die kaufmännischen Prozesse ab, sodass Handwerk und Verwaltung nahtlos ineinandergreifen.",
    experienceYear: 1994,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Marcus John",
    role: "Anlagenmechaniker SHK & Sanitärexperte",
    quote: "Moderne Bäder sind Lebensräume. Wenn ein Bad nach der Modernisierung barrierefrei erstrahlt, freut mich das handwerklich wie auch menschlich jedes Mal wieder.",
    description: "Marcus ist Spezialist für hocheffiziente Sanitärarchitektur und moderne Bauausführung. Seine Expertise umfasst anspruchsvolle Rohrleitungssysteme, anspruchsvolle Badkeramik und barrierefreien Umbau.",
    experienceYear: 2008,
    imageUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Tobias Krause",
    role: "Heizungs- und Servicetechniker",
    quote: "Brennwerttechnik, solarthermische Verzweigungen oder modernste Wärmepumpen – die Technik entwickelt sich schnell. Wir sorgen dafür, dass sie dauerhaft störungsfrei läuft.",
    description: "Tobias ist unser Diagnostiker und Problemlöser auf vier Rädern. Wenn eine Heizungsanlage streikt oder für die nächste Generation modernisiert werden soll, findet er durch logische Analyse jede Fehlerquelle.",
    experienceYear: 2012,
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Leon Lehmann",
    role: "Auszubildender zum Anlagenmechaniker SHK",
    quote: "Hier lerne ich nicht nur, wie man Rohre verlegt, sondern wie echte Problemlösung funktioniert. Die Kollegen erklären jeden Arbeitsschritt mit einer unglaublichen Geduld.",
    description: "Leon unterstützt das Team bei der täglichen Arbeit und erlernt das SHK-Handwerk von der Pike auf. Die Förderung junger Menschen ist für uns die wichtigste Investition in die Zukunft der Branche.",
    experienceYear: 2024,
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
  }
];

export const HISTORY_MILESTONES: HistoryMilestone[] = [
  {
    year: 1981,
    title: "Die Gründung in Ludwigsfelde",
    description: "Als kleiner, hochspezialisierter Fachbetrieb für Sanitär- und Gasinstallationen gegründet, um der stark wachsenden Stadt Ludwigsfelde verlässliche Haustechnik zu bieten."
  },
  {
    year: 1996,
    title: "Technologiewandel & Erste Solaranlagen",
    description: "Erweiterung des Dienstleistungsspektrums um solarthermische Großanlagen und Brennwerttechnik. Errichtung des heutigen Standorts am Dornweg im Gewerbegebiet."
  },
  {
    year: 2006,
    title: "Übergabe an Sven John",
    description: "Der Betrieb geht nach erfolgreicher Meisterqualifikation in die Hände von Sven John über. Fortführung der familiären Werte bei stetig wachsender technischer Spezialisierung."
  },
  {
    year: 2021,
    title: "40 Jahre Jubiläum & Regenerative Zukunft",
    description: "Ausrichtung auf die Wärmewende mit dem Schwerpunkt auf Luft-Wasser-Wärmepumpen und intelligente Hybrid-Heizsysteme. Über 40 Jahre verlässliches Vertrauen."
  },
  {
    year: 2026,
    title: "45 Jahre Firma JOHN",
    description: "Mit einem starken Team und frischer Innovationskraft sind wir heute der führende persönliche Ansprechpartner für modernste Bad- und Heizungskonzepte in Teltow-Fläming."
  }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "sanitaer",
    title: "Bad & Sanitär",
    iconName: "Bath",
    description: "Wir erschaffen langlebige Bäder und modernisieren Ihre Sanitäranlagen – von barrierefreier Bewegungsfreiheit bis zum gehobenen privaten Wellnessbereich.",
    details: [
      {
        id: "bad_mod",
        title: "Badmodernisierung & Sanierung",
        description: "Vollständige Planung und staubarme Ausführung Ihres neuen Badezimmers aus einer Hand, abgestimmt auf Ihr Budget.",
        bullets: [
          "Bedarfsanalyse und barrierefreie Layoutplanung",
          "Koordination aller Handwerke (Fliesenleger, Elektriker)",
          "Einsatz wassersparender und ergonomischer Designarmaturen",
          "Staubschutz-Konzept während der gesamten Umbauphase"
        ]
      },
      {
        id: "barrier_free",
        title: "Barrierefreie & Generationenbäder",
        description: "Die vorausschauende Planung von Bädern, die sich jeder Lebensphase anpassen. Sicher, komfortabel und kompromisslos schön.",
        bullets: [
          "Bodengleiche, schwellenlose Duschzonen (Walk-In)",
          "Sicherheits-Haltegriffe und integrierte Duschsitze",
          "DIN-gerechte Abstände und unterfahrbare Waschtische",
          "Beratung zu staatlichen Zuschüssen (z.B. KfW, Pflegekasse)"
        ]
      },
      {
        id: "rohr_instand",
        title: "Rohrnetz & Instandhaltung",
        description: "Schutz der Trinkwasserqualität durch vorschriftsmäßige Leitungsverlegung und verlässliche Schadenbehebung.",
        bullets: [
          "Austausch veralteter, korrodierter Rohrleitungen",
          "Einbau moderner Trinkwasserfilter und Entkalkungsanlagen",
          "Schnelle Reparatur bei Rohrbrüchen und Leckagen",
          "Zertifizierte Legionellen- und Keimprävention"
        ]
      }
    ],
    colorTheme: {
      badge: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]",
      border: "border-[#e0f2fe]",
      text: "text-[#0369a1]",
      bg: "bg-[#f8fafc]",
      accent: "#0284c7"
    }
  },
  {
    id: "heizung",
    title: "Heizung & Wärme",
    iconName: "Flame",
    description: "Effiziente, zukunftssichere Beheizung Ihres Zuhauses. Wir projektieren und installieren moderne Wärmeerzeuger und sorgen für minimalen Ressourcenverbrauch.",
    details: [
      {
        id: "warme",
        title: "Moderne Wärmepumpen",
        description: "Nutzen Sie unbegrenzte Umweltwärme aus Luft, Erde oder Grundwasser. Wir planen Ihre Wärmepumpe maßgeschneidert.",
        bullets: [
          "Detaillierte Heizlastberechnung nach DIN 12831",
          "Installation flüsterleiser Luft-Wasser-Wärmepumpen",
          "Optimaler hydraulischer Abgleich für minimale Betriebskosten",
          "Abwicklung aller Förderanträge (BAFA, KfW-Heizungsförderung)"
        ]
      },
      {
        id: "hybrid_gas",
        title: "Hybrid- & Brennwerttechnik",
        description: "Gas- und Ölkessel mit intelligenten Brennwertlösungen – oft die optimale Option in Kombination mit Solarthermie.",
        bullets: [
          "Austausch alter Niedertemperaturkessel gegen Gas-Brennwertgeräte",
          "Hydraulische Ankopplung an Bestandsverrohrung",
          "Intelligente Regelungen für außentemperaturgeführte Steuerung",
          "Integration von Kamin- oder Pellet-Heizöfen"
        ]
      },
      {
        id: "fussboden",
        title: "Fußbodenheizung & Flächensysteme",
        description: "Sanfte Strahlungswärme statt staubaufwirbelnder Luftströmung. Ideal für das moderne Niedertemperatur-Heizen.",
        bullets: [
          "Nachträgliches Einfräsen von Fußbodenheizungen im Altbau",
          "Klassische Tacker- oder Trockenbausysteme",
          "Individuelle Raumtemperaturregelungen (Smart-Home-bereit)",
          "Effizienzsteigerung durch Senkung der Vorlauftemperatur"
        ]
      }
    ],
    colorTheme: {
      badge: "bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]",
      border: "border-[#ffedd5]",
      text: "text-[#c2410c]",
      bg: "bg-[#fffbeb]",
      accent: "#ea580c"
    }
  },
  {
    id: "lueftung",
    title: "Klima & Lüftung",
    iconName: "Wind",
    description: "Gesunde Atemluft und wohltemperierte Räume zu jeder Jahreszeit. Wir verbauen kontrollierte Wohnraumlüftungen und flüsterleise Klimageräte.",
    details: [
      {
        id: "kli_split",
        title: "Split-Klimasysteme",
        description: "Genießen Sie angenehm temperierte Sommernächte und kühle Arbeitsumgebungen mit modernen Wand- und Deckengeräten.",
        bullets: [
          "Flüsterleise Innengeräte mit hochwirksamen Allergenfiltern",
          "Invertertechnik für minimalen Stromverbrauch bei hoher Kühlleistung",
          "Installation und Kältemittelbefüllung durch zertifizierte Techniker",
          "Steuerung per App oder lokaler Fernbedienung"
        ]
      },
      {
        id: "wohnraumlueft",
        title: "Kontrollierte Wohnraumlüftung",
        description: "Schutz vor Schimmel im gedämmten Neubau. Kontrollierter Luftaustausch ohne Energieverlust dank Wärmerückgewinnung.",
        bullets: [
          "Zentrale Lüftungsanlagen mit hocheffizienten Kreuzgegenstrom-Tauschern",
          "Dezentrale Einzellüfter für die unkomplizierte Altbausanierung",
          "Integrierter Feuchteschutz und kontinuierliche Frischluftzufuhr",
          "Schallgedämmte Außenwand-Durchlässe für erholsamen Schlaf"
        ]
      }
    ],
    colorTheme: {
      badge: "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]",
      border: "border-[#ccfbf1]",
      text: "text-[#0f766e]",
      bg: "bg-[#fafdfd]",
      accent: "#0d9488"
    }
  },
  {
    id: "solar",
    title: "Solar & Energie",
    iconName: "Sun",
    description: "Machen Sie sich unabhängig von steigenden Energiepreisen. Wir nutzen die Kraft der Sonne für Warmwasserbereitung und Stromerzeugung.",
    details: [
      {
        id: "solar_therm",
        title: "Solarthermie-Anlagen",
        description: "Direkte Nutzung der Sonnenkraft zur Erwärmung Ihres Duschwassers und zur Unterstützung Ihrer Zentralheizung.",
        bullets: [
          "Hochleistungs-Flach- und Vakuumröhrenkollektoren",
          "Dimensionierung passender Pufferspeicher (Kombispeicher)",
          "Einbindung in bestehende Öl-, Gas- oder Holzkessel",
          "Vollständige Wartung und Frostschutzmittel-Spülung"
        ]
      },
      {
        id: "photovoltaik",
        title: "Photovoltaik-Verkopplung",
        description: "Eigener Sonnenstrom für den Betrieb von Wärmepumpe und Haushaltsgeräten. Wir kooperieren für ganzheitliche Konzepte.",
        bullets: [
          "Heizstab-Kopplung (Power-to-Heat) zur Warmwassererstellung",
          "Schnittstellen-Einrichtung zwischen Energiezähler und Wärmepumpe",
          "Maximierung der Eigenverbrauchsquote",
          "Umfassende Konzepte zur Sektorenkopplung"
        ]
      }
    ],
    colorTheme: {
      badge: "bg-[#fef9c3] text-[#a16207] border-[#fef08a]",
      border: "border-[#fef9c3]",
      text: "text-[#a16207]",
      bg: "bg-[#fefdf0]",
      accent: "#d97706"
    }
  }
];

export const JOB_VACANCIES: JobVacancy[] = [
  {
    id: "anlagenmechaniker",
    title: "Anlagenmechaniker für Sanitär-, Heizungs- und Klimatechnik (m/w/d)",
    type: "Vollzeit (37,5 Std/Woche) • Unbefristet",
    intro: "Sie lieben das Handwerk, arbeiten gerne eigenverantwortlich beim privaten Endkunden und schätzen ein familiäres Arbeitsklima ohne Baustellenhektik? Dann verstärken Sie unser Team in Ludwigsfelde!",
    requirements: [
      "Abgeschlossene Ausbildung zum Anlagenmechaniker SHK, Gas-Wasser-Installateur oder vergleichbar",
      "Berufserfahrung in der Badinstallation oder im Heizungsbau (gerne auch Spezialthemen wie Wärmepumpen)",
      "Selbstständige, saubere Arbeitsweise und ein freundlicher Umgang mit Kunden",
      "Führerschein Klasse B (PKW-Werkstattwagen wird gestellt)"
    ],
    benefits: [
      "Attraktive, leistungsgerechte Vergütung mit Urlaubs- und Weihnachtsgeld",
      "Modern ausgestattetes Firmenfahrzeug (auch für den Heimweg nutzbar)",
      "Hochwertiges Markenwerkzeug und ergonomische Arbeitskleidung von Engelbert Strauss",
      "Keine Fernmontage: Tägliche Heimkehr, ausschließlich regionale Einsätze",
      "Regelmäßige, voll finanzierte Schulungen (Buderus, Geberit, Viessmann etc.)",
      "Ein Team, das sich auf Augenhöhe begegnet und Erfolge gemeinsam feiert"
    ]
  },
  {
    id: "kundendienst",
    title: "Servicetechniker / Kundendienstmonteur SHK (m/w/d)",
    type: "Vollzeit • Unbefristet",
    intro: "Fehlersuche ist für Sie wie ein Rätsel, das gelöst werden will? Als Kundendiensttechniker sind Sie unser wichtigster Mann vor Ort, wenn es um Wartung, Störungsbehebung und Regelungstechnik geht.",
    requirements: [
      "Fundiertes Fachwissen in der Heizungstechnik (Öl, Gas, idealerweise auch Wärmepumpen)",
      "Erfahrung im elektrischen Anschluss und der elektrischen Störungsanalyse",
      "Erfahrung im direkten Kundenkontakt und serviceorientiertes Auftreten",
      "Bereitschaft zur Teilnahme am rotierenden, fairen Notdienst"
    ],
    benefits: [
      "Überdurchschnittlicher Stundenlohn plus Notdienst-Zuschläge",
      "Eigenes, modern sortiertes Kundendienstfahrzeug mit Messgeräten bester Güte",
      "Direkter Support durch die Betriebsleitung und kurze Kommunikationswege",
      "Sicherer Arbeitsplatz in einem krisenfesten, alteingesessenen Familienbetrieb",
      "30 Tage Urlaub für die perfekte Erholung"
    ]
  }
];

/**
 * DEFAULT_CONTENT — vollständiger Seed über alle Tabs.
 * Dient der Engine als Fallback (leere Sektion) und als Service-Styling-Quelle
 * (iconName/colorTheme stehen nicht im Sheet) sowie beim Seeden eines neuen Sheets.
 */
export const DEFAULT_CONTENT: CMSContent = {
  allgemeines: DEFAULT_ALLGEMEIN,
  team: TEAM_MEMBERS,
  historie: HISTORY_MILESTONES,
  dienstleistungen: SERVICE_CATEGORIES,
  jobs: JOB_VACANCIES
};
