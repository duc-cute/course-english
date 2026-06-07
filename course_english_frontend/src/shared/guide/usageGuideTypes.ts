export type GuideLink = {
  label: string;
  to: string;
};

export type GuideSection = {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
  link?: GuideLink;
};

export type UsageGuideContent = {
  title: string;
  subtitle: string;
  intro: string;
  sections: GuideSection[];
};
