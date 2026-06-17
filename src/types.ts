export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface ServiceCategory {
  id: string;
  title: string;
  iconName: string; // Used to pick Lucide icons
  description: string;
  details: ServiceDetail[];
  colorTheme: {
    badge: string;
    border: string;
    text: string;
    bg: string;
    accent: string;
  };
}

export interface TeamMember {
  name: string;
  role: string;
  quote: string;
  description: string;
  experienceYear: number;
  imageUrl?: string;
}

export interface HistoryMilestone {
  year: number;
  title: string;
  description: string;
}

export interface JobVacancy {
  id: string;
  title: string;
  type: string;
  intro: string;
  requirements: string[];
  benefits: string[];
}

/** Gesamter editierbarer Seiteninhalt (eine Struktur über alle 5 Sheet-Tabs). */
export interface CMSContent {
  allgemeines: Record<string, string>;
  team: TeamMember[];
  historie: HistoryMilestone[];
  dienstleistungen: ServiceCategory[];
  jobs: JobVacancy[];
}
