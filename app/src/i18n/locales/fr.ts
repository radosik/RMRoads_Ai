export default {
  "common": {
    "loading": "Chargement…",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "openWorkspace": "Ouvrir l'espace de travail"
  },
  "nav": {
    "product": "Produit",
    "pilot": "Pilote",
    "workspace": "Espace de travail",
    "settings": "Paramètres",
    "tenantHealth": "État des locataires",
    "recommendations": "Recommandations",
    "pilotLeads": "Demandes de pilote",
    "login": "Connexion",
    "languageMenuLabel": "Langue"
  },
  "footer": {
    "tagline": "Poste de travail pour la réponse aux perturbations à destination des planificateurs d'expéditions. Hiérarchisez le risque, comparez les options de récupération et approuvez la réponse avant que les retards n'atteignent les clients.",
    "systemsActive": "Tous les systèmes actifs",
    "columns": {
      "product": "Produit",
      "resources": "Ressources",
      "legal": "Mentions légales",
      "admin": "Administration",
      "workspace": "Espace de travail"
    },
    "links": {
      "howItWorks": "Comment ça marche",
      "workbenchPreview": "Aperçu du poste de travail",
      "trustControl": "Confiance et contrôle",
      "pilotAudit": "Audit pilote",
      "blog": "Blog",
      "docs": "Documentation",
      "pilotBrief": "Brief pilote",
      "privacy": "Confidentialité",
      "terms": "Conditions d'utilisation",
      "cookies": "Paramètres des cookies",
      "workspaceLink": "Espace de travail",
      "settingsLink": "Paramètres",
      "pendingInvitations": "Invitations en attente",
      "tenantHealth": "État des locataires",
      "recommendationsLog": "Journal des recommandations",
      "pilotLeads": "Demandes de pilote"
    },
    "copyright": "{{year}} RMRoads AI · Poste de travail pour la réponse aux perturbations · Open source",
    "disclaimer": "Les recommandations sont une aide à la décision. L'approbation d'un planificateur est requise."
  },
  "landing": {
    "hero": {
      "systemActive": "Système actif",
      "headline": "Hiérarchisez le risque, comparez les options de récupération.",
      "subtitle": "Approuvez les actions de réponse avant que les retards n'atteignent vos clients. Les opérations logistiques à enjeux élevés exigent de la précision, pas des alertes fragmentées.",
      "ctaPrimary": "Réserver un audit de perturbation",
      "ctaSecondary": "Voir le flux de travail"
    },
    "problem": {
      "tag": "Le point de douleur",
      "headline": "Les perturbations ne sont pas la difficulté. Décider quoi faire ensuite, si.",
      "subtitle": "Congestion portuaire, retards de transporteurs, météo et problèmes douaniers apparaissent dans trop d'endroits et trop tard. Le temps que l'équipe s'accorde sur une réponse, le client ressent déjà le retard.",
      "stats": {
        "detect": {
          "unit": "min",
          "label": "Temps moyen pour détecter aujourd'hui une exception d'expédition",
          "detail": "Les planificateurs scrutent portails transporteurs, tableurs et fils d'e-mails pour repérer le risque."
        },
        "tools": {
          "unit": "outils",
          "label": "Systèmes touchés avant une décision de récupération",
          "detail": "TMS, ERP, CRM client, e-mails fournisseurs et notes hors ligne pèsent tous dans la balance."
        },
        "audit": {
          "unit": "audit",
          "label": "Décisions capturées avec leur justification pour la prochaine revue",
          "detail": "Les résultats se perdent dans les fils de discussion — il n'y a pas de système de référence pour la réponse."
        }
      }
    },
    "finalCta": {
      "title": "Utilisez le pilote pour prouver la vitesse de décision.",
      "body": "Commencez par un audit de perturbation de 30 à 45 jours sur les expéditions actives, puis examinez chaque semaine les décisions et la valeur protégée.",
      "cta": "Réserver un audit de perturbation"
    },
    "workflow": {
      "title": "Un workflow pilote ciblé qui prouve la valeur rapidement.",
      "subtitle": "Le MVP cible les décisions avant l'automatisation : identifier les expéditions à risque, recommander une réponse et tracer l'approbation.",
      "steps": {
        "import": {
          "title": "Importer les expéditions",
          "text": "Démarrez avec un CSV issu du processus actuel. Aucune intégration transporteur ou ERP n'est requise pour le premier pilote."
        },
        "detect": {
          "title": "Détecter l'exposition",
          "text": "Croisez les expéditions avec des signaux manuels : congestion portuaire, retards transporteurs, météo, douane."
        },
        "rank": {
          "title": "Hiérarchiser les exceptions",
          "text": "Faites remonter les expéditions à forte valeur et urgence, avec des explications de risque rapides à examiner."
        },
        "compare": {
          "title": "Comparer les scénarios",
          "text": "Évaluez attendre, notifier, dérouter, scinder, accélérer — coût, ETA, risque client et complexité."
        },
        "approve": {
          "title": "Approuver l'action",
          "text": "Le planificateur garde le contrôle. Chaque approbation, report ou refus est tracé avec des notes d'audit."
        },
        "review": {
          "title": "Examiner la valeur du pilote",
          "text": "Exportez des résumés hebdomadaires : décisions, valeur protégée, principaux risques, santé des alertes."
        }
      }
    },
    "preview": {
      "exceptionQueue": "File d'exceptions",
      "shipmentDetail": "Détail expédition",
      "scenarioComparison": "Comparaison scénarios",
      "cols": {
        "shipment": "Expédition",
        "lane": "Liaison",
        "riskReason": "Motif de risque",
        "value": "Valeur",
        "risk": "Risque"
      },
      "reasons": {
        "portCongestion": "Congestion portuaire",
        "carrierDelay": "Retard transporteur",
        "customsHold": "Blocage douane"
      },
      "detail": {
        "customer": "Client",
        "carrier": "Transporteur",
        "eta": "ETA",
        "value": "Valeur"
      },
      "scenarioCols": {
        "action": "Action",
        "cost": "Coût",
        "eta": "ETA",
        "customerRisk": "Risque client"
      },
      "scenarios": {
        "wait": { "action": "Attendre", "cost": "Sans coût direct", "eta": "+1–2 jours", "customerRisk": "Élevé" },
        "notify": { "action": "Notifier", "cost": "Faible", "eta": "Aucune récup.", "customerRisk": "Moyen" },
        "reroute": { "action": "Dérouter", "cost": "Moyen", "eta": "−1 jour", "customerRisk": "Moyen" },
        "split": { "action": "Scinder", "cost": "Moyen", "eta": "Protéger une partie", "customerRisk": "Faible" },
        "expedite": { "action": "Accélérer", "cost": "Élevé", "eta": "Récupération max.", "customerRisk": "Faible" }
      }
    },
    "controlLayer": {
      "approval": {
        "title": "Approbation humaine",
        "text": "Les recommandations sont une aide à la décision. Le planificateur approuve, reporte ou rejette chaque action."
      },
      "scoring": {
        "title": "Scoring explicable",
        "text": "Les motifs de risque restent visibles à côté de la recommandation, pour challenger les hypothèses."
      },
      "tenant": {
        "title": "Données par locataire",
        "text": "Les données de l'espace sont liées à l'organisation, avec réglages admin et revue d'accès pré-pilote."
      }
    }
  },
  "preview": {
    "header": {
      "title": "Renseignement risque · Direct",
      "active": "{{count}} actifs"
    },
    "cols": {
      "shipment": "Expédition",
      "lane": "Liaison",
      "reason": "Motif",
      "risk": "Risque"
    },
    "customers": {
      "northstar": "Northstar Retail",
      "atlas": "Atlas Medical",
      "foundry": "Foundry Parts",
      "helix": "Helix Coffee"
    },
    "reasons": {
      "portCongestion": "Congestion portuaire",
      "carrierDelay": "Retard transporteur",
      "customsHold": "Blocage douane",
      "weather": "Risque météo"
    },
    "scenario": {
      "ready": "Scénario prêt · {{id}}",
      "approvalRequired": "Approbation requise",
      "defer": "Reporter",
      "approve": "Approuver"
    },
    "scenarioActions": {
      "wait": "Attendre",
      "reroute": "Dérouter",
      "expedite": "Accélérer"
    }
  },
  "settings": {
    "eyebrow": "Préparation de l'espace",
    "title": "Paramètres RMRoads",
    "intro": "Configurez l'organisation, l'objectif pilote, les destinataires d'alertes, les invitations et les contrôles de préparation avant d'importer des données réelles.",
    "backToWorkspace": "Retour à l'espace",
    "loading": "Chargement des paramètres…",
    "loadError": "Impossible de charger les paramètres.",
    "organization": {
      "title": "Organisation",
      "workspaceName": "Nom de l'espace",
      "workspaceSlug": "Slug de l'espace"
    },
    "pilot": {
      "title": "Configuration pilote",
      "mode": "Mode pilote",
      "modes": {
        "demo": "Espace démo",
        "paid_pilot": "Pilote payant",
        "production_readiness": "Prêt pour production"
      },
      "targetDecisionHours": "Délai cible de décision, h",
      "successMetric": "Indicateur de succès"
    },
    "alerts": {
      "title": "Alertes critiques",
      "toggleTitle": "Activer les alertes e-mail critiques",
      "toggleHelp": "Les alertes ne sont envoyées que pour les exceptions critiques, une fois les destinataires configurés.",
      "recipients": "Destinataires d'alertes",
      "recipientsPlaceholder": "ops@example.com, logistique@example.com"
    },
    "weekly": {
      "title": "Résumé pilote hebdomadaire",
      "toggleTitle": "Activer les résumés hebdomadaires",
      "toggleHelp": "Résumé du lundi : imports, principaux risques, décisions, valeur et santé des alertes.",
      "recipients": "Destinataires du résumé",
      "recipientsPlaceholder": "ops@example.com, direction@example.com",
      "lastStatus": "Dernier statut : {{status}}",
      "lastSent": "Dernier envoi {{date}}"
    },
    "team": {
      "title": "Membres de l'équipe",
      "memberFallback": "Membre de l'espace",
      "added": "Ajouté le {{date}}",
      "inviteTitle": "Inviter un coéquipier",
      "inviteHelp": "Suivez les invitations pilote ici. L'acceptation reste manuelle jusqu'à ce qu'un pilote payant exige l'onboarding self-service.",
      "inviteEmailLabel": "E-mail d'invitation",
      "inviteEmailPlaceholder": "coequipier@example.com",
      "inviteRoleLabel": "Rôle d'invitation",
      "saving": "Enregistrement…",
      "createInvitation": "Créer l'invitation",
      "invitations": "Invitations",
      "sent": "Envoyée le {{date}}",
      "emailStatus": "E-mail {{status}}",
      "sending": "Envoi…",
      "resend": "Renvoyer",
      "cancel": "Annuler",
      "noInvitations": "Aucune invitation. Contact opérationnel : {{email}}"
    },
    "readiness": {
      "title": "Préparation pré-pilote",
      "toggleTitle": "Revue de sécurité du locataire terminée",
      "toggleHelp": "À cocher uniquement après revue des actions limitées par locataire et de l'import de données.",
      "saving": "Enregistrement…",
      "save": "Enregistrer les paramètres"
    },
    "roles": {
      "planner": "Planificateur",
      "viewer": "Lecteur",
      "admin": "Admin"
    },
    "statuses": {
      "admin": "Admin",
      "planner": "Planificateur",
      "viewer": "Lecteur",
      "owner": "Propriétaire",
      "pending": "En attente",
      "accepted": "Acceptée",
      "expired": "Expirée",
      "cancelled": "Annulée",
      "sent": "Envoyée",
      "queued": "En file",
      "failed": "Échec",
      "scheduled": "Programmée",
      "never_sent": "Jamais envoyée"
    },
    "messages": {
      "saved": "Paramètres enregistrés.",
      "saveFailed": "Impossible d'enregistrer les paramètres.",
      "inviteSaved": "Invitation enregistrée.",
      "inviteFailed": "Impossible de créer l'invitation.",
      "inviteCancelled": "Invitation annulée.",
      "inviteCancelFailed": "Impossible d'annuler l'invitation.",
      "inviteResent": "Invitation renvoyée par e-mail.",
      "inviteResendFailed": "Impossible de renvoyer l'invitation."
    }
  },
  "admin": {
    "sidebar": {
      "menuHeader": "MENU",
      "overview": "Vue d'ensemble",
      "pilotLeads": "Demandes de pilote",
      "tenantHealth": "État des locataires",
      "recommendations": "Recommandations",
      "users": "Utilisateurs"
    },
    "overview": {
      "eyebrow": "Console opérateur",
      "title": "Vue d'ensemble admin RMRoads",
      "intro": "Demandes de pilote, état des locataires, journal des recommandations et gestion des utilisateurs.",
      "open": "Ouvrir",
      "tools": {
        "pilotLeads": {
          "title": "Demandes de pilote",
          "desc": "Examinez les demandes entrantes du formulaire marketing. Mettez à jour le statut, exportez CSV."
        },
        "tenantHealth": {
          "title": "État des locataires",
          "desc": "Compteurs par espace, mode pilote et blockers de préparation pré-pilote pour toutes les organisations."
        },
        "recommendations": {
          "title": "Recommandations",
          "desc": "Les 100 dernières décisions tous espaces confondus : source LLM, résumé, justification, latence."
        },
        "users": {
          "title": "Utilisateurs",
          "desc": "Tous les utilisateurs enregistrés — bascule du rôle admin, audit des connexions, support."
        }
      },
      "about": {
        "title": "À propos de ce build",
        "body": "RMRoads AI est open source sous licence MIT. Cette surface admin est volontairement minimale — elle expose uniquement ce qu'un opérateur utilise au quotidien.",
        "docs": "Source et docs :"
      }
    }
  },
  "account": {
    "eyebrow": "Paramètres personnels",
    "title": "Compte",
    "intro": "Mettez à jour votre profil, votre langue, votre thème et la sécurité du compte.",
    "profile": {
      "title": "Profil",
      "email": "Adresse e-mail",
      "username": "Nom d'utilisateur"
    },
    "preferences": {
      "title": "Préférences",
      "language": "Langue",
      "languageHelp": "Utilisée pour l'interface et les e-mails localisés lorsque disponibles.",
      "theme": "Thème",
      "themeHelp": "Sombre par défaut. Bascule toute l'application instantanément.",
      "themes": {
        "light": "Clair",
        "dark": "Sombre"
      }
    },
    "security": {
      "title": "Sécurité",
      "passwordHelp": "Changez votre mot de passe en demandant un lien de réinitialisation par e-mail.",
      "changePassword": "Demander la réinitialisation"
    },
    "danger": {
      "title": "Zone de danger",
      "deleteHelp": "Supprime définitivement ce compte et les données des espaces dont vous êtes le seul propriétaire. Les espaces avec d'autres membres restent — seule votre adhésion est retirée.",
      "delete": "Supprimer le compte",
      "confirmTitle": "Cette action est irréversible.",
      "confirmHelp": "Saisissez l'e-mail de votre compte ({{email}}) pour confirmer. Toutes les expéditions, décisions et signaux des espaces uniques seront supprimés.",
      "confirmInput": "Votre e-mail",
      "confirmDelete": "Supprimer définitivement",
      "deleting": "Suppression…",
      "cancel": "Annuler",
      "deleteFailed": "Impossible de supprimer le compte."
    }
  },
  "pilot": {
    "eyebrow": "Accueil prioritaire",
    "title": "Audit de perturbation & programme pilote",
    "intro": "Déployez RMRoads AI dans votre réseau pour un audit contrôlé de 30 à 45 jours. Mettez à jour des vulnérabilités cachées, cartographiez les vecteurs récurrents et chiffrez l'impact financier des fenêtres de récupération manquées.",
    "metrics": {
      "protected": {
        "label": "Expéditions à risque protégées",
        "value": "14,2 %",
        "detail": "Moyenne identifiée lors des audits initiaux"
      },
      "value": {
        "label": "Valeur protégée",
        "value": "2,4 M$",
        "detail": "Exposition annuelle modélisée par pilote"
      }
    },
    "benefits": {
      "network": {
        "title": "Miroir réseau en direct",
        "text": "Importez des données d'expédition historiques ou actives pour simuler votre risque opérationnel sans toucher aux systèmes en production."
      },
      "vulnerability": {
        "title": "Cartographie des vulnérabilités",
        "text": "Repérez liaisons, ports, transporteurs et clients où les fenêtres de réponse manuelle se ferment trop vite."
      },
      "approval": {
        "title": "Workflow d'approbation",
        "text": "Comparez les scénarios de récupération et tracez chaque approbation, report ou rejet."
      }
    },
    "openWorkspace": "Ouvrir l'espace",
    "backHome": "Retour à l'accueil",
    "form": {
      "title": "Demande de configuration d'audit",
      "subtitle": "Complétez les paramètres ci-dessous pour lancer le provisionnement du pilote.",
      "fields": {
        "name": "Nom",
        "workEmail": "E-mail professionnel",
        "company": "Société",
        "role": "Rôle",
        "shipmentVolume": "Volume mensuel d'expéditions",
        "shipmentVolumePlaceholder": "Exemple : 8 000 expéditions/mois",
        "currentTools": "TMS / outils actuels",
        "currentToolsPlaceholder": "SAP, Manhattan, Oracle, tableurs…",
        "disruptionPain": "Principal point de douleur",
        "disruptionPainPlaceholder": "Décrivez détection tardive, escalades manuelles, pénalités, fret express ou charge des planificateurs.",
        "pilotGoal": "Objectif principal de l'audit",
        "pilotGoalPlaceholder": "Quel KPI ou workflow le pilote doit-il améliorer ?"
      },
      "submit": "Envoyer la demande",
      "submitting": "Envoi…",
      "dataNote": "Les données ne servent qu'à qualifier le workflow pilote."
    },
    "submitFailed": "Impossible d'envoyer la demande pilote."
  },
  "dashboard": {
    "loading": "Chargement de l'espace…",
    "loadError": "Espace impossible à charger. Vérifiez les logs serveur et la connexion à la base.",
    "empty": {
      "title": "Pas encore de données d'expédition",
      "body": "Chargez l'espace démo ou importez un CSV d'expéditions pour démarrer.",
      "loadDemo": "Charger la démo"
    },
    "sideRail": {
      "opsCenter": "CENTRE OPS",
      "activeNodes": "Nœuds actifs : {{count}}",
      "refreshSim": "Rafraîchir la simulation",
      "newSim": "Nouvelle simulation",
      "csvTemplate": "Modèle CSV",
      "importShipments": "Importer expéditions",
      "disruptions": "Perturbations",
      "settings": "Paramètres"
    },
    "signal": {
      "title": "Signaux",
      "help": "Créer des signaux pilote actifs qui affectent le score de risque.",
      "typeLabel": "Type de signal",
      "affected": "Liaison, transporteur ou lieu touchés",
      "severity": "Gravité",
      "confidence": "Confiance",
      "starts": "Début",
      "expires": "Fin",
      "add": "Ajouter le signal",
      "saved": "Signal enregistré.",
      "saveFailed": "Signal impossible à enregistrer.",
      "archive": "Archiver",
      "now": "Maintenant",
      "open": "Ouvert",
      "none": "Aucun signal actif."
    },
    "contextBar": {
      "title": "File d'exceptions",
      "critical": "{{count}} critiques",
      "actionable": "{{count}} à traiter",
      "activeSignals": "{{count}} signaux actifs",
      "metrics": {
        "decisions": "Décisions",
        "avgResponse": "Réponse moy.",
        "valueProtected": "Valeur protégée"
      },
      "refresh": "Rafraîchir",
      "summary": "Résumé"
    },
    "queue": {
      "searchAria": "Rechercher des exceptions",
      "searchPlaceholderShort": "Client, liaison, transporteur…",
      "searchPlaceholderLong": "Rechercher client, expédition, liaison, transporteur…",
      "filters": {
        "owner": "Propriétaire",
        "status": "Statut",
        "risk": "Risque",
        "mode": "Mode",
        "carrier": "Transporteur"
      },
      "cols": {
        "shipment": "Expédition / ID",
        "lane": "Liaison",
        "riskFactor": "Motif de risque",
        "valueAtRisk": "Valeur en risque",
        "status": "Statut"
      },
      "unassigned": "Non attribué",
      "noMatch": "Aucune exception ne correspond aux filtres.",
      "noShipments": "Pas encore d'expéditions. Utilisez la barre latérale pour charger des données démo ou importer un CSV — la file se remplira après scoring."
    },
    "filterOptions": {
      "all": "Tous",
      "unassigned": "Non attribué",
      "new": "Nouveau",
      "approved": "Approuvé",
      "deferred": "Reporté",
      "rejected": "Rejeté",
      "low": "Faible",
      "medium": "Moyen",
      "high": "Élevé",
      "critical": "Critique"
    },
    "riskLevels": {
      "low": "faible",
      "medium": "moyen",
      "high": "élevé",
      "critical": "critique"
    },
    "detail": {
      "carrierPrefix": "Transporteur :",
      "origin": "Origine",
      "destination": "Destination",
      "eta": "ETA",
      "riskFactor": "Motif de risque",
      "valueAtRisk": "Valeur en risque",
      "priorityShipment": "Expédition priorité {{priority}}",
      "scenarioEngine": "Moteur de scénarios IA",
      "recommended": "Recommandé",
      "costLabel": "Coût :",
      "selectPrompt": "Sélectionnez une exception pour inspecter le risque et comparer les scénarios."
    },
    "decision": {
      "noteLabel": "Note de décision",
      "notePlaceholder": "Ajouter la raison opérationnelle de la décision.",
      "noteRequired": "Une note est requise pour reporter ou rejeter.",
      "execute": "Exécuter la recommandation",
      "defer": "Reporter",
      "rejectTitle": "Rejeter la suggestion IA",
      "verbs": {
        "approved": "Approuvée",
        "deferred": "Reportée",
        "rejected": "Rejetée"
      },
      "recorded": "{{action}} enregistré pour {{customer}}.",
      "saveFailed": "Décision impossible à enregistrer"
    },
    "outcome": {
      "title": "Résultat de la décision",
      "aiLabel": "IA · {{provider}}",
      "help": "Suivre si la réponse approuvée a fonctionné lors de la revue pilote.",
      "notePlaceholder": "Ajouter résultat, impact client ou notes de suivi.",
      "save": "Enregistrer le résultat",
      "saved": "Résultat enregistré.",
      "savedToast": "Résultat enregistré",
      "saveFailed": "Résultat impossible à enregistrer",
      "markedAs": "Marqué comme {{status}}.",
      "statuses": {
        "pending": "En attente",
        "monitoring": "Surveillance",
        "successful": "Réussi",
        "failed": "Échec"
      }
    },
    "scenarioActions": {
      "watch": "surveiller",
      "wait": "attendre",
      "notify": "notifier",
      "reroute": "dérouter",
      "split": "scinder",
      "expedite": "accélérer"
    },
    "import": {
      "summary": "{{accepted}} expéditions importées. {{rejected}} lignes rejetées, {{duplicates}} doublons.",
      "failed": "Import CSV échoué.",
      "issuesTitle": "Problèmes d'import à corriger",
      "cols": {
        "row": "Ligne",
        "shipment": "Expédition",
        "issue": "Problème"
      }
    },
    "toasts": {
      "demoLoaded": {
        "title": "Données démo chargées",
        "description": "Expéditions et signaux d'exemple sont dans l'espace."
      },
      "demoFailed": {
        "title": "Données démo impossibles à charger"
      },
      "unknownError": "Erreur inconnue"
    }
  },
  "auth": {
    "login": {
      "noAccount": "Pas encore de compte ? <signupLink>aller à l'inscription</signupLink>.",
      "forgotPassword": "Mot de passe oublié ? <resetLink>le réinitialiser</resetLink>."
    },
    "signup": {
      "haveAccount": "J'ai déjà un compte (<loginLink>aller à la connexion</loginLink>)."
    },
    "passwordReset": {
      "allOkay": "Si tout est bon, <loginLink>aller à la connexion</loginLink>"
    },
    "emailVerification": {
      "allOkay": "Si tout est bon, <loginLink>aller à la connexion</loginLink>"
    }
  },
  "invitations": {
    "eyebrow": "Accès à l'espace",
    "title": "Invitations",
    "intro": "Examinez les invitations en attente liées à votre adresse de connexion.",
    "accountNote": "Les comptes pilotes utilisent un seul espace actif. Acceptez l'invitation voulue avant de créer des données d'exemple.",
    "openWorkspace": "Ouvrir l'espace",
    "loading": "Chargement des invitations…",
    "loadError": "Impossible de charger les invitations.",
    "empty": {
      "title": "Aucune invitation en attente",
      "body": "Si un coéquipier vous a invité, vérifiez que vous êtes connecté avec la même adresse e-mail."
    },
    "role": "Rôle",
    "invitedBy": "Invité par",
    "sent": "Envoyée",
    "accepting": "Acceptation…",
    "accept": "Accepter l'invitation",
    "accepted": "Invitation acceptée. Vous pouvez ouvrir l'espace.",
    "acceptFailed": "Impossible d'accepter l'invitation."
  },
  "legal": {
    "eyebrow": "Mentions légales",
    "lastUpdatedLabel": "Dernière mise à jour",
    "placeholderNotice": "Contenu provisoire — le texte définitif remplacera ce paragraphe avant le lancement.",
    "privacy": {
      "title": "Politique de confidentialité",
      "updated": "Mai 2026",
      "intro": "RMRoads AI est un poste de travail pour la réponse aux perturbations des chaînes d'approvisionnement. Cette politique décrit ce que nous collectons, comment nous l'utilisons et les contrôles dont disposent les planificateurs sur leurs données.",
      "sections": {
        "collect": {
          "heading": "Ce que nous collectons",
          "body": "Les détails du compte (nom, e-mail), les données d'expédition que vous importez dans l'espace de travail et la télémétrie d'usage indispensable au fonctionnement du produit."
        },
        "use": {
          "heading": "Comment nous l'utilisons",
          "body": "Pour faire fonctionner votre espace de travail, hiérarchiser les risques d'exception, présenter les options de récupération et envoyer les alertes et les résumés hebdomadaires que vous configurez."
        },
        "sharing": {
          "heading": "Partage",
          "body": "Nous ne vendons pas de données personnelles. Nous ne partageons des données qu'avec les sous-traitants strictement nécessaires à la fourniture du service (envoi d'e-mails, hébergement, surveillance des erreurs)."
        },
        "choices": {
          "heading": "Vos choix",
          "body": "Vous pouvez demander à tout moment l'export ou la suppression des données de votre espace de travail. Les planificateurs contrôlent qui voit quelles expéditions."
        },
        "contact": {
          "heading": "Contact",
          "body": "Pendant le pilote, les questions sur cette politique sont adressées au propriétaire de l'espace de travail. Un contact dédié à la vie privée sera publié avant le lancement payant."
        }
      }
    },
    "terms": {
      "title": "Conditions d'utilisation",
      "updated": "Mai 2026",
      "intro": "En utilisant RMRoads AI vous acceptez ces conditions. Elles couvrent l'usage acceptable, les responsabilités liées à votre compte et la limite entre l'aide à la décision et l'exécution autonome.",
      "sections": {
        "using": {
          "heading": "Utilisation de RMRoads AI",
          "body": "RMRoads AI classe les exceptions d'expédition et présente des options de récupération. Les décisions vous appartiennent — le produit est une aide à la décision, pas une exécution autonome."
        },
        "account": {
          "heading": "Votre compte",
          "body": "Vous êtes responsable de la confidentialité de vos identifiants et de l'activité des membres que vous invitez. Avertissez-nous immédiatement en cas d'accès non autorisé."
        },
        "acceptable": {
          "heading": "Usage acceptable",
          "body": "N'importez pas de données que vous n'êtes pas autorisé à partager, ne tentez pas de contourner l'isolement des locataires et n'utilisez pas le service pour enfreindre la loi ou les droits d'autrui."
        },
        "availability": {
          "heading": "Disponibilité du service",
          "body": "Pendant le pilote, le service est fourni en l'état, sans SLA formel. Nous nous efforçons d'annoncer raisonnablement la maintenance planifiée et les changements impactants."
        },
        "contact": {
          "heading": "Contact",
          "body": "Pendant le pilote, les questions sur ces conditions sont adressées au propriétaire de l'espace de travail. Des conditions formelles seront publiées avant le lancement payant."
        }
      }
    },
    "cookies": {
      "title": "Paramètres des cookies",
      "updated": "Mai 2026",
      "intro": "RMRoads AI utilise un nombre minimal de cookies. Nous n'utilisons pas de traqueurs publicitaires intersites.",
      "sections": {
        "necessary": {
          "heading": "Strictement nécessaires",
          "body": "Les cookies de session vous maintiennent connecté et mémorisent l'espace de travail ouvert. Le produit ne fonctionne pas sans eux."
        },
        "preferences": {
          "heading": "Préférences",
          "body": "Le stockage local retient votre choix de langue et le thème clair/sombre. Ces valeurs ne quittent pas votre navigateur."
        },
        "analytics": {
          "heading": "Analyse",
          "body": "La télémétrie d'usage agrégée est anonymisée et ne sert qu'à améliorer le produit. Aucun cookie analytique n'est posé pendant le pilote."
        },
        "manage": {
          "heading": "Gérer les préférences",
          "body": "Effacez les données du site dans votre navigateur pour réinitialiser tous les cookies et le stockage local. À la prochaine visite, seules les entrées strictement nécessaires seront recréées."
        }
      }
    }
  }
}
;
