import { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  deliverables: string[];
  timeline: string;
  outcome: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  clientRole: string;
}

export interface CaseStudy {
  id: string;
  industry: string;
  title: string;
  problem: string;
  solution: string;
  stats: { label: string; value: string }[];
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
}