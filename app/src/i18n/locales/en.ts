export default {
  "common": {
    "loading": "Loading…",
    "save": "Save",
    "cancel": "Cancel",
    "openWorkspace": "Open workspace"
  },
  "nav": {
    "product": "Product",
    "pilot": "Pilot",
    "workspace": "Workspace",
    "settings": "Settings",
    "tenantHealth": "Tenant Health",
    "recommendations": "Recommendations",
    "pilotLeads": "Pilot Leads",
    "login": "Log in",
    "languageMenuLabel": "Language"
  },
  "footer": {
    "tagline": "Disruption response workbench for shipment planners. Rank exception risk, compare recovery options, and approve the response before delays hit customers.",
    "systemsActive": "All systems active",
    "columns": {
      "product": "Product",
      "resources": "Resources",
      "legal": "Legal",
      "admin": "Admin",
      "workspace": "Workspace"
    },
    "links": {
      "howItWorks": "How it works",
      "workbenchPreview": "Workbench preview",
      "trustControl": "Trust & control",
      "pilotAudit": "Pilot audit",
      "blog": "Blog",
      "docs": "Docs",
      "pilotBrief": "Pilot brief",
      "privacy": "Privacy",
      "terms": "Terms of Service",
      "cookies": "Cookie settings",
      "workspaceLink": "Workspace",
      "settingsLink": "Settings",
      "pendingInvitations": "Pending invitations",
      "tenantHealth": "Tenant health",
      "recommendationsLog": "Recommendations log",
      "pilotLeads": "Pilot leads"
    },
    "copyright": "{{year}} RMRoads AI · Disruption response workbench · Open source",
    "disclaimer": "Recommendations are decision support. Planner approval is required."
  },
  "landing": {
    "hero": {
      "systemActive": "System active",
      "headline": "Rank shipment risk, compare recovery options.",
      "subtitle": "Approve response actions before delays hit customers. High-stakes logistics operations demand precision, not fragmented alerts.",
      "ctaPrimary": "Book a disruption audit",
      "ctaSecondary": "See the workflow"
    },
    "problem": {
      "tag": "The pain point",
      "headline": "Disruptions are not the hard part. Deciding what to do next is.",
      "subtitle": "Port congestion, carrier delays, weather, and customs issues surface in too many places and too late. By the time the team agrees on a response, the customer is already feeling the delay.",
      "stats": {
        "detect": {
          "unit": "min",
          "label": "Avg. time to detect a shipment exception today",
          "detail": "Planners scan carrier portals, spreadsheets, and email threads to spot risk."
        },
        "tools": {
          "unit": "tools",
          "label": "Systems touched before a recovery decision",
          "detail": "TMS, ERP, customer CRM, supplier emails, and offline notes all weigh in."
        },
        "audit": {
          "unit": "audit",
          "label": "Decisions captured with reasoning for the next review",
          "detail": "Outcomes vanish in chat threads — there is no system of record for response."
        }
      }
    },
    "finalCta": {
      "title": "Use the pilot to prove decision speed.",
      "body": "Start with a 30-45 day disruption audit on active shipments, then review decisions and protected value weekly.",
      "cta": "Book a disruption audit"
    },
    "workflow": {
      "title": "A narrow pilot workflow that proves value fast.",
      "subtitle": "The MVP focuses on decisions before automation: find exposed shipments, recommend a response, and store the approval trail.",
      "steps": {
        "import": {
          "title": "Import active shipments",
          "text": "Start with a CSV from the team's current process. No carrier or ERP integration is required for the first pilot."
        },
        "detect": {
          "title": "Detect disruption exposure",
          "text": "Match shipments against manual disruption signals such as port congestion, carrier issues, weather, and customs delays."
        },
        "rank": {
          "title": "Rank exception priority",
          "text": "Bring high-value, high-priority shipments to the top with risk explanations planners can review quickly."
        },
        "compare": {
          "title": "Compare response scenarios",
          "text": "Evaluate wait, notify, reroute, split, and expedite options with cost, ETA, customer risk, and complexity."
        },
        "approve": {
          "title": "Approve the action",
          "text": "Keep the human in control. Every approve, defer, or reject decision is stored with notes for the audit trail."
        },
        "review": {
          "title": "Review pilot value",
          "text": "Export weekly summaries showing reviewed decisions, protected shipment value, top risks, and alert delivery health."
        }
      }
    },
    "preview": {
      "exceptionQueue": "Exception queue",
      "shipmentDetail": "Shipment detail",
      "scenarioComparison": "Scenario comparison",
      "cols": {
        "shipment": "Shipment",
        "lane": "Lane",
        "riskReason": "Risk reason",
        "value": "Value",
        "risk": "Risk"
      },
      "reasons": {
        "portCongestion": "Port congestion",
        "carrierDelay": "Carrier delay",
        "customsHold": "Customs hold"
      },
      "detail": {
        "customer": "Customer",
        "carrier": "Carrier",
        "eta": "ETA",
        "value": "Value"
      },
      "scenarioCols": {
        "action": "Action",
        "cost": "Cost",
        "eta": "ETA",
        "customerRisk": "Customer risk"
      },
      "scenarios": {
        "wait": { "action": "Wait", "cost": "No direct cost", "eta": "+1-2 days", "customerRisk": "High" },
        "notify": { "action": "Notify", "cost": "Low", "eta": "No recovery", "customerRisk": "Medium" },
        "reroute": { "action": "Reroute", "cost": "Medium", "eta": "Save 1 day", "customerRisk": "Medium" },
        "split": { "action": "Split", "cost": "Medium", "eta": "Protect partial demand", "customerRisk": "Low" },
        "expedite": { "action": "Expedite", "cost": "High", "eta": "Fastest recovery", "customerRisk": "Low" }
      }
    },
    "controlLayer": {
      "approval": {
        "title": "Human approval",
        "text": "Recommendations are decision support. The planner approves, defers, or rejects every action."
      },
      "scoring": {
        "title": "Explainable scoring",
        "text": "Risk reasons stay visible beside the recommendation so the team can challenge bad assumptions."
      },
      "tenant": {
        "title": "Tenant-scoped data",
        "text": "Workspace data is tied to the organization, with admin-only settings and pre-pilot access review."
      }
    }
  },
  "preview": {
    "header": {
      "title": "Risk intelligence · Live",
      "active": "{{count}} active"
    },
    "cols": {
      "shipment": "Shipment",
      "lane": "Lane",
      "reason": "Reason",
      "risk": "Risk"
    },
    "customers": {
      "northstar": "Northstar Retail",
      "atlas": "Atlas Medical",
      "foundry": "Foundry Parts",
      "helix": "Helix Coffee"
    },
    "reasons": {
      "portCongestion": "Port congestion",
      "carrierDelay": "Carrier delay",
      "customsHold": "Customs hold",
      "weather": "Weather risk"
    },
    "scenario": {
      "ready": "Scenario ready · {{id}}",
      "approvalRequired": "Planner approval required",
      "defer": "Defer",
      "approve": "Approve"
    },
    "scenarioActions": {
      "wait": "Wait",
      "reroute": "Reroute",
      "expedite": "Expedite"
    }
  },
  "settings": {
    "eyebrow": "Workspace readiness",
    "title": "RMRoads Settings",
    "intro": "Configure the organization, pilot target, alert recipients, invitations, and readiness controls before importing real pilot data.",
    "backToWorkspace": "Back to Workspace",
    "loading": "Loading workspace settings...",
    "loadError": "Could not load workspace settings.",
    "organization": {
      "title": "Organization",
      "workspaceName": "Workspace name",
      "workspaceSlug": "Workspace slug"
    },
    "pilot": {
      "title": "Pilot Configuration",
      "mode": "Pilot mode",
      "modes": {
        "demo": "Demo workspace",
        "paid_pilot": "Paid pilot",
        "production_readiness": "Production readiness"
      },
      "targetDecisionHours": "Target decision time, hours",
      "successMetric": "Pilot success metric"
    },
    "alerts": {
      "title": "Critical Alerts",
      "toggleTitle": "Enable critical email alerts",
      "toggleHelp": "Alerts are sent only for critical exceptions after recipients are configured.",
      "recipients": "Alert recipients",
      "recipientsPlaceholder": "ops@example.com, logistics@example.com"
    },
    "weekly": {
      "title": "Weekly Pilot Summary",
      "toggleTitle": "Enable weekly summary emails",
      "toggleHelp": "Send a Monday pilot summary with imports, top risks, decisions, value, and alert delivery health.",
      "recipients": "Summary recipients",
      "recipientsPlaceholder": "ops@example.com, leadership@example.com",
      "lastStatus": "Last status: {{status}}",
      "lastSent": "Last sent {{date}}"
    },
    "team": {
      "title": "Team Members",
      "memberFallback": "Workspace member",
      "added": "Added {{date}}",
      "inviteTitle": "Invite teammate",
      "inviteHelp": "Track pilot invites here. Account acceptance can stay high-touch until the first paid pilot requires self-serve onboarding.",
      "inviteEmailLabel": "Invite email",
      "inviteEmailPlaceholder": "teammate@example.com",
      "inviteRoleLabel": "Invitation role",
      "saving": "Saving...",
      "createInvitation": "Create Invitation",
      "invitations": "Invitations",
      "sent": "Sent {{date}}",
      "emailStatus": "Email {{status}}",
      "sending": "Sending...",
      "resend": "Resend",
      "cancel": "Cancel",
      "noInvitations": "No invitations yet. Operational contact: {{email}}"
    },
    "readiness": {
      "title": "Pre-Pilot Readiness",
      "toggleTitle": "Tenant security review completed",
      "toggleHelp": "Use this only after tenant-scoped actions and data import handling have been reviewed.",
      "saving": "Saving...",
      "save": "Save Workspace Settings"
    },
    "roles": {
      "planner": "Planner",
      "viewer": "Viewer",
      "admin": "Admin"
    },
    "statuses": {
      "admin": "Admin",
      "planner": "Planner",
      "viewer": "Viewer",
      "owner": "Owner",
      "pending": "Pending",
      "accepted": "Accepted",
      "expired": "Expired",
      "cancelled": "Cancelled",
      "sent": "Sent",
      "queued": "Queued",
      "failed": "Failed",
      "scheduled": "Scheduled",
      "never_sent": "Never sent"
    },
    "messages": {
      "saved": "Workspace settings saved.",
      "saveFailed": "Could not save workspace settings.",
      "inviteSaved": "Invitation saved.",
      "inviteFailed": "Could not create invitation.",
      "inviteCancelled": "Invitation cancelled.",
      "inviteCancelFailed": "Could not cancel invitation.",
      "inviteResent": "Invitation email resent.",
      "inviteResendFailed": "Could not resend invitation email."
    }
  },
  "admin": {
    "sidebar": {
      "menuHeader": "MENU",
      "overview": "Overview",
      "pilotLeads": "Pilot Leads",
      "tenantHealth": "Tenant Health",
      "recommendations": "Recommendations",
      "users": "Users"
    }
  },
  "account": {
    "eyebrow": "Personal settings",
    "title": "Account",
    "intro": "Update your profile, language, theme, and account security settings.",
    "profile": {
      "title": "Profile",
      "email": "Email address",
      "username": "Username"
    },
    "preferences": {
      "title": "Preferences",
      "language": "Language",
      "languageHelp": "Used for the interface and language-detected emails when available.",
      "theme": "Theme",
      "themeHelp": "Dark by default. Switches the whole app instantly.",
      "themes": {
        "light": "Light",
        "dark": "Dark"
      }
    },
    "security": {
      "title": "Security",
      "passwordHelp": "Change your password by requesting a reset link to your email.",
      "changePassword": "Request password reset"
    },
    "danger": {
      "title": "Danger zone",
      "deleteHelp": "Permanently delete this account along with all workspace data you own.",
      "delete": "Delete account",
      "notWired": "Account deletion is not yet wired in this build. Open an issue or PR to add the action."
    }
  },
  "pilot": {
    "eyebrow": "Priority intake",
    "title": "Disruption Audit & Pilot Program",
    "intro": "Deploy RMRoads AI in your network for a 30-45 day controlled audit. Uncover hidden vulnerabilities, map recurring disruption vectors, and quantify the financial impact of missed recovery windows.",
    "metrics": {
      "protected": {
        "label": "At-Risk Shipments Protected",
        "value": "14.2%",
        "detail": "Average identified in baseline audits"
      },
      "value": {
        "label": "Protected Value",
        "value": "$2.4M",
        "detail": "Modeled annualized exposure per pilot"
      }
    },
    "benefits": {
      "network": {
        "title": "Live network mirroring",
        "text": "Import historical or active shipment data to simulate your operational risk without changing live systems."
      },
      "vulnerability": {
        "title": "Vulnerability mapping",
        "text": "Identify lanes, ports, carriers, and customers where manual response windows close too quickly."
      },
      "approval": {
        "title": "Planner approval workflow",
        "text": "Compare recovery scenarios and keep every approve, defer, or reject decision in an audit trail."
      }
    },
    "openWorkspace": "Open Workspace",
    "backHome": "Back to Home",
    "form": {
      "title": "Request Audit Configuration",
      "subtitle": "Complete the parameters below to initiate the pilot provisioning workflow.",
      "fields": {
        "name": "Name",
        "workEmail": "Work Email",
        "company": "Company",
        "role": "Role",
        "shipmentVolume": "Monthly Shipment Volume",
        "shipmentVolumePlaceholder": "Example: 8,000 shipments/month",
        "currentTools": "Current TMS / Tools",
        "currentToolsPlaceholder": "SAP, Manhattan, Oracle, spreadsheets…",
        "disruptionPain": "Primary Disruption Pain Point",
        "disruptionPainPlaceholder": "Describe late detection, manual escalation, customer penalties, expedited freight, or planner workload.",
        "pilotGoal": "Primary Goal for Audit",
        "pilotGoalPlaceholder": "What specific KPI or workflow should the pilot improve?"
      },
      "submit": "Submit Audit Request",
      "submitting": "Submitting…",
      "dataNote": "Data is used only to qualify the pilot workflow."
    },
    "submitFailed": "Could not submit the pilot request."
  },
  "dashboard": {
    "loading": "Loading RMRoads workspace…",
    "loadError": "Could not load the RMRoads workspace. Check the server logs and database connection.",
    "empty": {
      "title": "No shipment data yet",
      "body": "Load the demo workspace or import a shipment CSV to start the workbench.",
      "loadDemo": "Load Demo Workspace"
    },
    "sideRail": {
      "opsCenter": "OPS CENTER",
      "activeNodes": "Active nodes: {{count}}",
      "refreshSim": "Refresh Simulation",
      "newSim": "New Simulation",
      "csvTemplate": "CSV Template",
      "importShipments": "Import Shipments",
      "disruptions": "Disruptions",
      "settings": "Settings"
    },
    "signal": {
      "title": "Signals",
      "help": "Create active pilot signals that affect risk scoring.",
      "typeLabel": "Signal type",
      "affected": "Affected lane, carrier, or place",
      "severity": "Severity",
      "confidence": "Confidence",
      "starts": "Starts",
      "expires": "Expires",
      "add": "Add Signal",
      "saved": "Signal saved.",
      "saveFailed": "Could not save signal.",
      "archive": "Archive",
      "now": "Now",
      "open": "Open",
      "none": "No active signals."
    },
    "contextBar": {
      "title": "Exception Queue",
      "critical": "{{count}} Critical",
      "actionable": "{{count}} Actionable",
      "activeSignals": "{{count}} Active Signals",
      "metrics": {
        "decisions": "Decisions",
        "avgResponse": "Avg Response",
        "valueProtected": "Value Protected"
      },
      "refresh": "Refresh",
      "summary": "Summary"
    },
    "queue": {
      "searchAria": "Search exceptions",
      "searchPlaceholderShort": "Search customer, lane, carrier…",
      "searchPlaceholderLong": "Search customer, shipment, lane, carrier…",
      "filters": {
        "owner": "Owner",
        "status": "Status",
        "risk": "Risk",
        "mode": "Mode",
        "carrier": "Carrier"
      },
      "cols": {
        "shipment": "Shipment / ID",
        "lane": "Lane",
        "riskFactor": "Risk Factor",
        "valueAtRisk": "Value At Risk",
        "status": "Status"
      },
      "unassigned": "Unassigned",
      "noMatch": "No exceptions match the current filters.",
      "noShipments": "No shipments yet. Use the side rail to load demo data or import a CSV — the exception queue will populate once shipments are scored."
    },
    "filterOptions": {
      "all": "All",
      "unassigned": "Unassigned",
      "new": "New",
      "approved": "Approved",
      "deferred": "Deferred",
      "rejected": "Rejected",
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "critical": "Critical"
    },
    "riskLevels": {
      "low": "low",
      "medium": "medium",
      "high": "high",
      "critical": "critical"
    },
    "detail": {
      "carrierPrefix": "Carrier:",
      "origin": "Origin",
      "destination": "Destination",
      "eta": "ETA",
      "riskFactor": "Risk Factor",
      "valueAtRisk": "Value at Risk",
      "priorityShipment": "{{priority}} priority shipment",
      "scenarioEngine": "AI Scenario Engine",
      "recommended": "Recommended",
      "costLabel": "Cost:",
      "selectPrompt": "Select an exception to inspect risk and compare scenarios."
    },
    "decision": {
      "noteLabel": "Decision note",
      "notePlaceholder": "Add the operational reason for the decision.",
      "noteRequired": "Decision note is required for deferred or rejected recommendations.",
      "execute": "Execute Recommendation",
      "defer": "Defer",
      "rejectTitle": "Reject AI suggestion",
      "verbs": {
        "approved": "Approved",
        "deferred": "Deferred",
        "rejected": "Rejected"
      },
      "recorded": "Recorded {{action}} for {{customer}}.",
      "saveFailed": "Decision could not be saved"
    },
    "outcome": {
      "title": "Decision outcome",
      "aiLabel": "AI · {{provider}}",
      "help": "Track whether the approved response worked during pilot review.",
      "notePlaceholder": "Add actual result, customer impact, or follow-up notes.",
      "save": "Save Outcome",
      "saved": "Outcome saved.",
      "savedToast": "Outcome saved",
      "saveFailed": "Could not save outcome",
      "markedAs": "Marked as {{status}}.",
      "statuses": {
        "pending": "Pending",
        "monitoring": "Monitoring",
        "successful": "Successful",
        "failed": "Failed"
      }
    },
    "scenarioActions": {
      "watch": "watch",
      "wait": "wait",
      "notify": "notify",
      "reroute": "reroute",
      "split": "split",
      "expedite": "expedite"
    },
    "import": {
      "summary": "Imported {{accepted}} shipments. {{rejected}} rows rejected, {{duplicates}} duplicates.",
      "failed": "CSV import failed.",
      "issuesTitle": "Import issues to fix",
      "cols": {
        "row": "Row",
        "shipment": "Shipment",
        "issue": "Issue"
      }
    },
    "toasts": {
      "demoLoaded": {
        "title": "Demo data loaded",
        "description": "Sample shipments and signals are now in the workspace."
      },
      "demoFailed": {
        "title": "Could not load demo data"
      },
      "unknownError": "Unknown error"
    }
  },
  "auth": {
    "login": {
      "noAccount": "Don't have an account yet? <signupLink>go to signup</signupLink>.",
      "forgotPassword": "Forgot your password? <resetLink>reset it</resetLink>."
    },
    "signup": {
      "haveAccount": "I already have an account (<loginLink>go to login</loginLink>)."
    },
    "passwordReset": {
      "allOkay": "If everything is okay, <loginLink>go to login</loginLink>"
    },
    "emailVerification": {
      "allOkay": "If everything is okay, <loginLink>go to login</loginLink>"
    }
  },
  "invitations": {
    "eyebrow": "Workspace access",
    "title": "Invitations",
    "intro": "Review pending RMRoads AI workspace invitations connected to your sign-in email.",
    "accountNote": "Pilot accounts use one active workspace. Accept the intended invitation before creating sample data or configuring a new workspace.",
    "openWorkspace": "Open Workspace",
    "loading": "Loading invitations...",
    "loadError": "Could not load invitations.",
    "empty": {
      "title": "No pending invitations",
      "body": "If a teammate invited you, make sure you signed in with the same email address used for the invitation."
    },
    "role": "Role",
    "invitedBy": "Invited by",
    "sent": "Sent",
    "accepting": "Accepting...",
    "accept": "Accept Invitation",
    "accepted": "Invitation accepted. You can now open the workspace.",
    "acceptFailed": "Could not accept invitation."
  },
  "legal": {
    "eyebrow": "Legal",
    "lastUpdatedLabel": "Last updated",
    "placeholderNotice": "Placeholder content — final policy copy will replace this before launch.",
    "privacy": {
      "title": "Privacy policy",
      "updated": "May 2026",
      "intro": "RMRoads AI is a disruption response workbench for supply-chain teams. This policy describes what we collect, how we use it, and the controls planners have over their data.",
      "sections": {
        "collect": {
          "heading": "What we collect",
          "body": "Account details (name, email), shipment data you import to the workspace, and basic usage telemetry needed to operate the product."
        },
        "use": {
          "heading": "How we use it",
          "body": "To run your workspace, rank exception risk, surface recovery options, and send the alerts and weekly summaries you configure."
        },
        "sharing": {
          "heading": "Sharing",
          "body": "We do not sell personal data. We share data with sub-processors strictly required to deliver the service (email delivery, hosting, error monitoring)."
        },
        "choices": {
          "heading": "Your choices",
          "body": "You can request export or deletion of your workspace data at any time by contacting the operator. Planners control which workspace members see which shipments."
        },
        "contact": {
          "heading": "Contact",
          "body": "Questions about this policy go to the workspace owner during the pilot. A dedicated privacy contact will be published before paid launch."
        }
      }
    },
    "terms": {
      "title": "Terms of service",
      "updated": "May 2026",
      "intro": "By using RMRoads AI you agree to these terms. They cover acceptable use, your account responsibilities, and the boundary between decision support and autonomous execution.",
      "sections": {
        "using": {
          "heading": "Using RMRoads AI",
          "body": "RMRoads AI ranks shipment exceptions and surfaces recovery options. Decisions remain yours — the product is decision support, not autonomous execution."
        },
        "account": {
          "heading": "Your account",
          "body": "You are responsible for keeping your credentials safe and for the activity of workspace members you invite. Notify us immediately if you suspect unauthorized access."
        },
        "acceptable": {
          "heading": "Acceptable use",
          "body": "Do not import data you are not authorized to share, attempt to bypass tenant isolation, or use the service to violate applicable law or the rights of others."
        },
        "availability": {
          "heading": "Service availability",
          "body": "During the pilot the service is provided as-is, without a formal SLA. We aim to give reasonable notice of planned maintenance and breaking changes."
        },
        "contact": {
          "heading": "Contact",
          "body": "Questions about these terms go to the workspace owner during the pilot. Formal terms will be published before paid launch."
        }
      }
    },
    "cookies": {
      "title": "Cookie settings",
      "updated": "May 2026",
      "intro": "RMRoads AI uses a minimal set of cookies. We do not use cross-site advertising trackers.",
      "sections": {
        "necessary": {
          "heading": "Strictly necessary",
          "body": "Session cookies keep you signed in and remember which workspace you have open. The product does not function without them."
        },
        "preferences": {
          "heading": "Preferences",
          "body": "Local storage remembers your language choice and light/dark theme. These never leave your browser."
        },
        "analytics": {
          "heading": "Analytics",
          "body": "Aggregate usage telemetry is anonymized and used only to improve the product. No analytics cookies are set during the pilot."
        },
        "manage": {
          "heading": "Managing preferences",
          "body": "Clear site data in your browser to reset all cookies and local storage. Re-opening the site will re-create only the strictly necessary entries."
        }
      }
    }
  }
}
;
