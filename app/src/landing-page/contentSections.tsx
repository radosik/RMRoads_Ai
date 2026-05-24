import publicBanner from "../client/static/public-banner.webp";
import { BlogUrl } from "../shared/common";
import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "Shipment CSV Import",
    description: "Start pilots from ordinary shipment exports instead of waiting on integrations.",
    emoji: "CSV",
    href: "/pilot",
    size: "small",
  },
  {
    name: "Risk-Ranked Exceptions",
    description: "Prioritize shipments by lane disruption, urgency, value, and confidence.",
    emoji: "RISK",
    href: "/pilot",
    size: "small",
  },
  {
    name: "Planner Approval",
    description: "Approve, defer, or reject recommended recovery actions with decision notes.",
    emoji: "OK",
    href: "/pilot",
    size: "medium",
  },
  {
    name: "Critical Alerts",
    description: "Log critical exceptions and notify configured recipients when urgent risk appears.",
    emoji: "ALRT",
    href: "/pilot",
    size: "large",
  },
  {
    name: "Pilot Value Metrics",
    description: "Track reviewed decisions, approved actions, average risk, and estimated protected shipment value.",
    emoji: "ROI",
    href: "/pilot",
    size: "large",
  },
  {
    name: "Audit Trail",
    description: "Persist recommendation inputs, outputs, status, owner, and timestamped decisions.",
    emoji: "LOG",
    href: "/pilot",
    size: "small",
  },
];

export const testimonials = [
  {
    name: "Pilot target",
    role: "Transportation operations leader",
    avatarSrc: publicBanner,
    socialUrl: "",
    quote: "The useful test is whether the queue finds the few shipments planners should act on today.",
  },
  {
    name: "Pilot target",
    role: "Supply chain planning leader",
    avatarSrc: publicBanner,
    socialUrl: "",
    quote: "CSV-first is the right pilot wedge because integrations slow every early validation cycle.",
  },
];

export const faqs = [
  {
    id: 1,
    question: "Do we need a TMS integration for the pilot?",
    answer: "No. The MVP is designed around shipment CSV exports so the pilot can start before integrations.",
    href: "/pilot",
  },
  {
    id: 2,
    question: "Does RMRoads AI make autonomous shipment changes?",
    answer: "No. The MVP recommends and compares actions, but planners approve, defer, or reject every decision.",
    href: "/pilot",
  },
];

export const footerNavigation = {
  app: [
    { name: "Pilot", href: "/pilot" },
    { name: "Workspace", href: "/rmroads" },
    { name: "Blog", href: BlogUrl },
  ],
  company: [
    { name: "About", href: "/pilot" },
    { name: "Privacy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
};

export const examples = [
  {
    name: "Import active shipments",
    description: "Upload shipment exports and validate the rows that can be scored.",
    imageSrc: publicBanner,
    href: "/pilot",
  },
  {
    name: "Create disruption signals",
    description: "Add manual events for weather, port congestion, carrier issues, or customer-sensitive lanes.",
    imageSrc: publicBanner,
    href: "/pilot",
  },
  {
    name: "Approve recovery decisions",
    description: "Compare scenarios and keep an auditable human approval workflow.",
    imageSrc: publicBanner,
    href: "/pilot",
  },
];
