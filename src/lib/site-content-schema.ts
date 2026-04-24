export interface MetadataBlock {
  title: string;
  description: string;
}

export interface NavigationItem {
  path: string;
  label: string;
}

export interface BackgroundVideoConfig {
  poster: string;
  webm: string;
  mp4: string;
}

export interface GlobalContent {
  brandName: string;
  siteTitle: string;
  siteDescription: string;
  favicon: string;
  navigation: NavigationItem[];
  backgroundVideo: BackgroundVideoConfig;
}

export interface HomeHeroContent {
  monogram: string;
  greeting: string;
  name: string;
  subtitle: string;
}

export interface HomeCta {
  label: string;
  href: string;
  style: "primary" | "secondary";
}

export interface HomeHighlight {
  title: string;
  description: string;
  iconKey: string;
}

export interface HomeContent {
  metadata: MetadataBlock;
  hero: HomeHeroContent;
  ctas: HomeCta[];
  highlights: HomeHighlight[];
}

export interface AboutJourneyItem {
  period: string;
  title: string;
  description: string;
}

export interface AboutContent {
  metadata: MetadataBlock;
  headerTitle: string;
  intro: string;
  journeyTitle: string;
  journey: AboutJourneyItem[];
  techStackTitle: string;
  techStack: string[];
  beyondTitle: string;
  beyondBody: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  tech: string[];
  link: string;
  icon: string;
  logoBg: string;
}

export interface ProjectsContent {
  metadata: MetadataBlock;
  headerTitle: string;
  intro: string;
  items: ProjectItem[];
  reflectionTitle: string;
  reflectionBody: string;
}

export interface SkillItem {
  iconKey: string;
  label: string;
}

export interface SkillSection {
  title: string;
  items: SkillItem[];
}

export interface SkillsContent {
  metadata: MetadataBlock;
  headerTitle: string;
  intro: string;
  sections: SkillSection[];
}

export interface ResumeContent {
  metadata: MetadataBlock;
  headerTitle: string;
  intro: string;
  resumeFileId: string;
  thumbnail: string;
  highlightsTitle: string;
  highlights: string[];
  downloadLabel: string;
  driveLinkLabel: string;
}

export interface ContactInfo {
  email: string;
  location: string;
  linkedin: string;
}

export interface ContactContent {
  metadata: MetadataBlock;
  headerTitle: string;
  intro: string;
  infoTitle: string;
  messageTitle: string;
  successTitle: string;
  successBody: string;
  submitLabel: string;
  info: ContactInfo;
}

export interface ChatPrompt {
  label: string;
  prompt: string;
}

export interface ChatContent {
  metadata: MetadataBlock;
  pageTitle: string;
  pageBody: string;
  openButtonLabel: string;
  widgetOpenLabel: string;
  composerPlaceholder: string;
  readyLabel: string;
  welcomeMessage: string;
  clearedMessage: string;
  quickPrompts: ChatPrompt[];
}

export interface MusicContent {
  songUrls: string[];
  widgetOpenLabel: string;
  panelTitle: string;
  defaultTrackTitle: string;
  defaultStatus: string;
  openPrompt: string;
  loadingLabel: string;
  queueTitle: string;
  queueHeading: string;
  queueDescription: string;
  currentBadge: string;
  playLabel: string;
  pauseLabel: string;
  previousLabel: string;
  nextLabel: string;
  volumeLabel: string;
  emptyStateLabel: string;
  showQueueLabel: string;
  showPlayerLabel: string;
  minimizeLabel: string;
}

export interface SiteContent {
  global: GlobalContent;
  home: HomeContent;
  about: AboutContent;
  projects: ProjectsContent;
  skills: SkillsContent;
  resume: ResumeContent;
  contact: ContactContent;
  chat: ChatContent;
  music: MusicContent;
}

export type SiteContentSectionKey = keyof SiteContent;

export const SITE_CONTENT_SECTION_ORDER: Array<{
  key: SiteContentSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: "global",
    label: "Global",
    description: "Brand, navigation, metadata, and background media.",
  },
  {
    key: "home",
    label: "Home",
    description: "Hero copy, calls to action, and homepage highlights.",
  },
  {
    key: "about",
    label: "About",
    description: "Bio, journey timeline, and personal narrative.",
  },
  {
    key: "projects",
    label: "Projects",
    description: "Project cards, links, technologies, and reflection text.",
  },
  {
    key: "skills",
    label: "Skills",
    description: "Grouped skill sections and icon-mapped labels.",
  },
  {
    key: "resume",
    label: "Resume",
    description: "Resume asset IDs, highlights, and related labels.",
  },
  {
    key: "contact",
    label: "Contact",
    description: "Contact copy and public communication details.",
  },
  {
    key: "chat",
    label: "Chat",
    description: "Chat page copy, widget labels, and quick prompt content.",
  },
  {
    key: "music",
    label: "Music",
    description: "Floating music player labels and song URL configuration.",
  },
];
