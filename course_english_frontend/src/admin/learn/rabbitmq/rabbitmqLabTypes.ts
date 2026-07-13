export type RabbitMqLesson = {
  id: string;
  title: string;
  emoji: string;
  essence: string;
  analogy: string;
  inCourseEnglish: string;
  quiz?: { question: string; answer: string };
};

export type RabbitMqLabStep = {
  id: string;
  title: string;
  description: string;
  command?: string;
  hint?: string;
};

export type RoutingKeyOption = {
  key: string;
  label: string;
  bindsTo: ("in-app" | "email")[];
  description: string;
};
