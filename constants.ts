import { 
  Workflow, 
  Settings, 
  Cable, 
  ClipboardList, 
  LifeBuoy,
  BarChart3,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Service, ProcessStep, CaseStudy, PricingTier } from './types';

export const COMPANY_INFO = {
  name: "AE Software Solutions LLC",
  location: "Chambersburg, Pennsylvania",
  email: "hello@aesoftware.solutions", // Placeholder
  phone: "(717) 555-0123", // Placeholder
  founded: "2023",
  entityType: "Pennsylvania Domestic Limited Liability Company (LLC)"
};

export const SERVICES: Service[] = [
  {
    id: "automation",
    title: "Workflow Automation & Redesign",
    description: "Map current processes, remove waste, and automate manual steps.",
    icon: Workflow,
    deliverables: ["Process Map", "Automation Scripts", "Training Docs"],
    timeline: "2-4 Weeks",
    outcome: "Eliminate repetitive data entry and reduce human error."
  },
  {
    id: "consulting",
    title: "Software Consulting & Implementation",
    description: "Select, configure, and deploy tools like CRMs, ticketing, and reporting.",
    icon: Settings,
    deliverables: ["Vendor Selection", "Configuration", "Data Migration"],
    timeline: "4-8 Weeks",
    outcome: "A centralized tech stack that matches your business model."
  },
  {
    id: "integration",
    title: "Systems Integration",
    description: "Connect isolated tools so data moves automatically and stays consistent.",
    icon: Cable,
    deliverables: ["API Integrations", "Webhooks Setup", "Data Sync"],
    timeline: "2-6 Weeks",
    outcome: "Real-time visibility across all your business systems."
  },
  {
    id: "ops-setup",
    title: "Small-Business Operational Setup",
    description: "Build repeatable onboarding, checklists, and templates for scale.",
    icon: ClipboardList,
    deliverables: ["SOPs", "Onboarding Flows", "Governance Guide"],
    timeline: "3-5 Weeks",
    outcome: "Growth without chaos; standardized operations."
  },
  {
    id: "support",
    title: "Ongoing Support & Optimization",
    description: "Maintenance and improvements to keep systems usable as you grow.",
    icon: LifeBuoy,
    deliverables: ["Monthly Audits", "Staff Training", "Feature Updates"],
    timeline: "Monthly Subscription",
    outcome: "Systems that adapt to your changing business needs."
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: "01",
    title: "Discovery",
    description: "We audit your current workflows to find bottlenecks and wasted time.",
    clientRole: "Provide access to current tools & walk us through a 'day in the life'."
  },
  {
    number: "02",
    title: "Plan",
    description: "We design a roadmap of tools and automations tailored to your budget.",
    clientRole: "Review and approve the proposed roadmap and tech stack."
  },
  {
    number: "03",
    title: "Build",
    description: "We configure software, write integration code, and build the dashboards.",
    clientRole: "Test key features in a staging environment."
  },
  {
    number: "04",
    title: "Launch",
    description: "We roll out the new system, migrate data, and train your team.",
    clientRole: "Go live with the new system; team attends training."
  },
  {
    number: "05",
    title: "Improve",
    description: "We monitor performance and tweak automations for maximum efficiency.",
    clientRole: "Provide feedback on what's working and what needs tweaking."
  }
];

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Audit & Roadmap",
    price: "$950",
    description: "Perfect for understanding where you're losing time.",
    features: [
      "Current Workflow Audit",
      "Gap Analysis",
      "Tool Recommendations",
      "Implementation Roadmap"
    ],
    cta: "Book an Audit"
  },
  {
    name: "Implementation Sprint",
    price: "From $2,500",
    description: "Project-based setup for specific automations or tool deployments.",
    features: [
      "Software Configuration",
      "Custom Automation Scripts",
      "Data Migration",
      "Team Training Session"
    ],
    cta: "Get a Quote"
  },
  {
    name: "Monthly Optimization",
    price: "From $800/mo",
    description: "Ongoing support to keep your operations running smoothly.",
    features: [
      "System Maintenance",
      "Priority Support",
      "Iterative Improvements",
      "Monthly Reporting"
    ],
    cta: "Start Support"
  }
];

export const PROBLEMS_SOLVED = [
  {
    title: "Scattered Spreadsheets",
    desc: "Stop running your business on fragile Excel sheets that only one person understands.",
    icon: BarChart3
  },
  {
    title: "Missed Handoffs",
    desc: "Ensure tasks move from Sales to Operations to Billing without falling through cracks.",
    icon: Zap
  },
  {
    title: "Repetitive Admin",
    desc: "Automate invoicing, scheduling, and data entry to free up your best people.",
    icon: Clock
  },
  {
    title: "Data Security",
    desc: "Secure your operational data with proper permissions and reliable backups.",
    icon: ShieldCheck
  }
];