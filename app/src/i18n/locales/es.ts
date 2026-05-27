export default {
  "common": {
    "loading": "Cargando…",
    "save": "Guardar",
    "cancel": "Cancelar",
    "openWorkspace": "Abrir espacio de trabajo"
  },
  "nav": {
    "product": "Producto",
    "pilot": "Piloto",
    "workspace": "Espacio de trabajo",
    "settings": "Ajustes",
    "tenantHealth": "Estado de inquilinos",
    "recommendations": "Recomendaciones",
    "pilotLeads": "Solicitudes de piloto",
    "login": "Iniciar sesión",
    "languageMenuLabel": "Idioma"
  },
  "footer": {
    "tagline": "Mesa de trabajo de respuesta a interrupciones para planificadores de envíos. Priorice el riesgo de excepciones, compare opciones de recuperación y apruebe la respuesta antes de que los retrasos lleguen al cliente.",
    "systemsActive": "Todos los sistemas activos",
    "columns": {
      "product": "Producto",
      "resources": "Recursos",
      "legal": "Legal",
      "admin": "Administración",
      "workspace": "Espacio de trabajo"
    },
    "links": {
      "howItWorks": "Cómo funciona",
      "workbenchPreview": "Vista previa de la mesa de trabajo",
      "trustControl": "Confianza y control",
      "pilotAudit": "Auditoría piloto",
      "blog": "Blog",
      "docs": "Documentación",
      "pilotBrief": "Resumen del piloto",
      "privacy": "Privacidad",
      "terms": "Términos del servicio",
      "cookies": "Ajustes de cookies",
      "workspaceLink": "Espacio de trabajo",
      "settingsLink": "Ajustes",
      "pendingInvitations": "Invitaciones pendientes",
      "tenantHealth": "Estado de inquilinos",
      "recommendationsLog": "Registro de recomendaciones",
      "pilotLeads": "Solicitudes de piloto"
    },
    "copyright": "{{year}} RMRoads AI · Mesa de trabajo de respuesta a interrupciones · Código abierto",
    "disclaimer": "Las recomendaciones son apoyo a la decisión. Se requiere aprobación del planificador."
  },
  "landing": {
    "hero": {
      "systemActive": "Sistema activo",
      "headline": "Priorice el riesgo del envío, compare opciones de recuperación.",
      "subtitle": "Apruebe las acciones de respuesta antes de que los retrasos lleguen al cliente. Las operaciones logísticas críticas exigen precisión, no alertas fragmentadas.",
      "ctaPrimary": "Reservar auditoría de interrupciones",
      "ctaSecondary": "Ver el flujo de trabajo"
    },
    "problem": {
      "tag": "El punto de dolor",
      "headline": "La interrupción no es lo difícil. Decidir qué hacer a continuación, sí.",
      "subtitle": "La congestión portuaria, los retrasos de transportistas, el clima y los problemas aduaneros aparecen en demasiados sitios y demasiado tarde. Cuando el equipo se pone de acuerdo en una respuesta, el cliente ya está sufriendo el retraso.",
      "stats": {
        "detect": {
          "unit": "min",
          "label": "Tiempo medio para detectar hoy una excepción de envío",
          "detail": "Los planificadores revisan portales de transportistas, hojas de cálculo y correos para detectar riesgo."
        },
        "tools": {
          "unit": "sistemas",
          "label": "Sistemas tocados antes de tomar una decisión de recuperación",
          "detail": "TMS, ERP, CRM del cliente, correos de proveedores y notas fuera de línea influyen todos."
        },
        "audit": {
          "unit": "audit",
          "label": "Decisiones registradas con su razonamiento para la próxima revisión",
          "detail": "Los resultados se pierden en los hilos de chat — no hay sistema de registro para la respuesta."
        }
      }
    },
    "finalCta": {
      "title": "Use el piloto para demostrar velocidad de decisión.",
      "body": "Empiece con una auditoría de interrupciones de 30 a 45 días sobre envíos activos y revise cada semana las decisiones y el valor protegido.",
      "cta": "Reservar auditoría de interrupciones"
    },
    "workflow": {
      "title": "Un workflow piloto acotado que prueba el valor rápido.",
      "subtitle": "El MVP se centra en decisiones antes de automatizar: detectar envíos expuestos, recomendar una respuesta y guardar el rastro de aprobación.",
      "steps": {
        "import": {
          "title": "Importar envíos activos",
          "text": "Empieza con un CSV del proceso actual. No se requiere integración de transportistas ni ERP para el primer piloto."
        },
        "detect": {
          "title": "Detectar exposición",
          "text": "Cruza envíos con señales manuales: congestión portuaria, retrasos de transportistas, clima y aduana."
        },
        "rank": {
          "title": "Priorizar excepciones",
          "text": "Sube los envíos de alto valor y urgencia al principio, con explicaciones de riesgo claras para los planificadores."
        },
        "compare": {
          "title": "Comparar escenarios",
          "text": "Evalúa esperar, notificar, redirigir, dividir y acelerar: coste, ETA, riesgo del cliente y complejidad."
        },
        "approve": {
          "title": "Aprobar la acción",
          "text": "El humano decide. Cada aprobación, aplazamiento o rechazo se guarda con notas para auditoría."
        },
        "review": {
          "title": "Revisar valor del piloto",
          "text": "Exporta resúmenes semanales: decisiones, valor protegido, riesgos principales y salud de alertas."
        }
      }
    },
    "preview": {
      "exceptionQueue": "Cola de excepciones",
      "shipmentDetail": "Detalle de envío",
      "scenarioComparison": "Comparación de escenarios",
      "cols": {
        "shipment": "Envío",
        "lane": "Ruta",
        "riskReason": "Motivo de riesgo",
        "value": "Valor",
        "risk": "Riesgo"
      },
      "reasons": {
        "portCongestion": "Congestión portuaria",
        "carrierDelay": "Retraso transportista",
        "customsHold": "Bloqueo aduana"
      },
      "detail": {
        "customer": "Cliente",
        "carrier": "Transportista",
        "eta": "ETA",
        "value": "Valor"
      },
      "scenarioCols": {
        "action": "Acción",
        "cost": "Coste",
        "eta": "ETA",
        "customerRisk": "Riesgo cliente"
      },
      "scenarios": {
        "wait": { "action": "Esperar", "cost": "Sin coste directo", "eta": "+1–2 días", "customerRisk": "Alto" },
        "notify": { "action": "Notificar", "cost": "Bajo", "eta": "Sin recuperación", "customerRisk": "Medio" },
        "reroute": { "action": "Redirigir", "cost": "Medio", "eta": "−1 día", "customerRisk": "Medio" },
        "split": { "action": "Dividir", "cost": "Medio", "eta": "Proteger parte", "customerRisk": "Bajo" },
        "expedite": { "action": "Acelerar", "cost": "Alto", "eta": "Recuperación máx.", "customerRisk": "Bajo" }
      }
    },
    "controlLayer": {
      "approval": {
        "title": "Aprobación humana",
        "text": "Las recomendaciones son apoyo a la decisión. El planificador aprueba, aplaza o rechaza cada acción."
      },
      "scoring": {
        "title": "Puntuación explicable",
        "text": "Los motivos de riesgo se ven junto a la recomendación para que el equipo cuestione supuestos erróneos."
      },
      "tenant": {
        "title": "Datos por inquilino",
        "text": "Los datos del espacio están ligados a la organización, con ajustes solo de admin y revisión de acceso prepiloto."
      }
    }
  },
  "preview": {
    "header": {
      "title": "Inteligencia de riesgo · En vivo",
      "active": "{{count}} activos"
    },
    "cols": {
      "shipment": "Envío",
      "lane": "Ruta",
      "reason": "Motivo",
      "risk": "Riesgo"
    },
    "customers": {
      "northstar": "Northstar Retail",
      "atlas": "Atlas Medical",
      "foundry": "Foundry Parts",
      "helix": "Helix Coffee"
    },
    "reasons": {
      "portCongestion": "Congestión portuaria",
      "carrierDelay": "Retraso transportista",
      "customsHold": "Bloqueo aduana",
      "weather": "Riesgo climático"
    },
    "scenario": {
      "ready": "Escenario listo · {{id}}",
      "approvalRequired": "Aprobación requerida",
      "defer": "Aplazar",
      "approve": "Aprobar"
    },
    "scenarioActions": {
      "wait": "Esperar",
      "reroute": "Redirigir",
      "expedite": "Acelerar"
    }
  },
  "settings": {
    "eyebrow": "Preparación del espacio",
    "title": "Ajustes de RMRoads",
    "intro": "Configura la organización, el objetivo del piloto, destinatarios de alertas, invitaciones y controles de preparación antes de importar datos reales.",
    "backToWorkspace": "Volver al espacio",
    "loading": "Cargando ajustes…",
    "loadError": "No se pudieron cargar los ajustes.",
    "organization": {
      "title": "Organización",
      "workspaceName": "Nombre del espacio",
      "workspaceSlug": "Slug del espacio"
    },
    "pilot": {
      "title": "Configuración del piloto",
      "mode": "Modo piloto",
      "modes": {
        "demo": "Espacio demo",
        "paid_pilot": "Piloto pagado",
        "production_readiness": "Listo para producción"
      },
      "targetDecisionHours": "Tiempo objetivo de decisión, h",
      "successMetric": "Métrica de éxito del piloto"
    },
    "alerts": {
      "title": "Alertas críticas",
      "toggleTitle": "Activar alertas por correo",
      "toggleHelp": "Las alertas se envían solo para excepciones críticas tras configurar destinatarios.",
      "recipients": "Destinatarios de alertas",
      "recipientsPlaceholder": "ops@example.com, logistica@example.com"
    },
    "weekly": {
      "title": "Resumen semanal del piloto",
      "toggleTitle": "Activar resúmenes semanales",
      "toggleHelp": "Resumen del lunes: importaciones, riesgos principales, decisiones, valor y salud de alertas.",
      "recipients": "Destinatarios del resumen",
      "recipientsPlaceholder": "ops@example.com, direccion@example.com",
      "lastStatus": "Último estado: {{status}}",
      "lastSent": "Último envío {{date}}"
    },
    "team": {
      "title": "Miembros del equipo",
      "memberFallback": "Miembro del espacio",
      "added": "Añadido {{date}}",
      "inviteTitle": "Invitar a un compañero",
      "inviteHelp": "Lleva el seguimiento de invitaciones aquí. La aceptación queda manual hasta que un piloto pagado requiera onboarding autoservicio.",
      "inviteEmailLabel": "Correo de invitación",
      "inviteEmailPlaceholder": "companero@example.com",
      "inviteRoleLabel": "Rol de invitación",
      "saving": "Guardando…",
      "createInvitation": "Crear invitación",
      "invitations": "Invitaciones",
      "sent": "Enviada {{date}}",
      "emailStatus": "Correo {{status}}",
      "sending": "Enviando…",
      "resend": "Reenviar",
      "cancel": "Cancelar",
      "noInvitations": "Sin invitaciones. Contacto operativo: {{email}}"
    },
    "readiness": {
      "title": "Preparación prepiloto",
      "toggleTitle": "Revisión de seguridad del inquilino completada",
      "toggleHelp": "Actívalo solo tras revisar acciones limitadas por inquilino y la importación de datos.",
      "saving": "Guardando…",
      "save": "Guardar ajustes"
    },
    "roles": {
      "planner": "Planificador",
      "viewer": "Lector",
      "admin": "Admin"
    },
    "statuses": {
      "admin": "Admin",
      "planner": "Planificador",
      "viewer": "Lector",
      "owner": "Propietario",
      "pending": "Pendiente",
      "accepted": "Aceptada",
      "expired": "Caducada",
      "cancelled": "Cancelada",
      "sent": "Enviada",
      "queued": "En cola",
      "failed": "Falló",
      "scheduled": "Programada",
      "never_sent": "Nunca enviada"
    },
    "messages": {
      "saved": "Ajustes guardados.",
      "saveFailed": "No se pudieron guardar los ajustes.",
      "inviteSaved": "Invitación guardada.",
      "inviteFailed": "No se pudo crear la invitación.",
      "inviteCancelled": "Invitación cancelada.",
      "inviteCancelFailed": "No se pudo cancelar la invitación.",
      "inviteResent": "Invitación reenviada por correo.",
      "inviteResendFailed": "No se pudo reenviar la invitación."
    }
  },
  "admin": {
    "sidebar": {
      "menuHeader": "MENÚ",
      "overview": "Resumen",
      "pilotLeads": "Solicitudes de piloto",
      "tenantHealth": "Estado de inquilinos",
      "recommendations": "Recomendaciones",
      "users": "Usuarios"
    }
  },
  "account": {
    "eyebrow": "Ajustes personales",
    "title": "Cuenta",
    "intro": "Actualiza tu perfil, idioma, tema y seguridad de la cuenta.",
    "profile": {
      "title": "Perfil",
      "email": "Correo electrónico",
      "username": "Nombre de usuario"
    },
    "preferences": {
      "title": "Preferencias",
      "language": "Idioma",
      "languageHelp": "Se usa para la interfaz y los correos localizados cuando esté disponible.",
      "theme": "Tema",
      "themeHelp": "Oscuro por defecto. Cambia toda la app al instante.",
      "themes": {
        "light": "Claro",
        "dark": "Oscuro"
      }
    },
    "security": {
      "title": "Seguridad",
      "passwordHelp": "Cambia tu contraseña solicitando un enlace de restablecimiento por correo.",
      "changePassword": "Solicitar restablecimiento"
    },
    "danger": {
      "title": "Zona de peligro",
      "deleteHelp": "Eliminar permanentemente esta cuenta y todos los datos del espacio que posees.",
      "delete": "Eliminar cuenta",
      "notWired": "La eliminación de cuenta aún no está conectada en este build. Issue o PR bienvenidos."
    }
  },
  "pilot": {
    "eyebrow": "Admisión prioritaria",
    "title": "Auditoría de interrupciones y programa piloto",
    "intro": "Despliega RMRoads AI en tu red durante una auditoría controlada de 30 a 45 días. Descubre vulnerabilidades ocultas, mapea vectores de interrupción recurrentes y cuantifica el impacto de ventanas de recuperación perdidas.",
    "metrics": {
      "protected": {
        "label": "Envíos de riesgo protegidos",
        "value": "14,2 %",
        "detail": "Promedio identificado en auditorías base"
      },
      "value": {
        "label": "Valor protegido",
        "value": "2,4 M$",
        "detail": "Exposición anual modelada por piloto"
      }
    },
    "benefits": {
      "network": {
        "title": "Espejo de red en vivo",
        "text": "Importa datos de envíos históricos o activos para simular tu riesgo operativo sin tocar los sistemas reales."
      },
      "vulnerability": {
        "title": "Mapa de vulnerabilidades",
        "text": "Identifica rutas, puertos, transportistas y clientes donde las ventanas de respuesta manual se cierran demasiado rápido."
      },
      "approval": {
        "title": "Workflow de aprobación",
        "text": "Compara escenarios de recuperación y guarda cada aprobación, aplazamiento o rechazo en un rastro de auditoría."
      }
    },
    "openWorkspace": "Abrir espacio",
    "backHome": "Volver al inicio",
    "form": {
      "title": "Solicitar configuración de auditoría",
      "subtitle": "Completa los parámetros para iniciar el aprovisionamiento del piloto.",
      "fields": {
        "name": "Nombre",
        "workEmail": "Correo laboral",
        "company": "Empresa",
        "role": "Rol",
        "shipmentVolume": "Volumen mensual de envíos",
        "shipmentVolumePlaceholder": "Ejemplo: 8.000 envíos/mes",
        "currentTools": "TMS / herramientas actuales",
        "currentToolsPlaceholder": "SAP, Manhattan, Oracle, hojas de cálculo…",
        "disruptionPain": "Punto de dolor principal",
        "disruptionPainPlaceholder": "Describe detección tardía, escalado manual, penalizaciones, flete urgente o carga del planificador.",
        "pilotGoal": "Objetivo principal de la auditoría",
        "pilotGoalPlaceholder": "¿Qué KPI o workflow debe mejorar el piloto?"
      },
      "submit": "Enviar solicitud",
      "submitting": "Enviando…",
      "dataNote": "Los datos solo se usan para calificar el workflow piloto."
    },
    "submitFailed": "No se pudo enviar la solicitud del piloto."
  },
  "dashboard": {
    "loading": "Cargando espacio de trabajo…",
    "loadError": "No se pudo cargar el espacio. Revisa logs del servidor y la conexión a la base.",
    "empty": {
      "title": "Aún no hay datos de envíos",
      "body": "Carga el espacio demo o importa un CSV de envíos para empezar.",
      "loadDemo": "Cargar demo"
    },
    "sideRail": {
      "opsCenter": "CENTRO OPS",
      "activeNodes": "Nodos activos: {{count}}",
      "refreshSim": "Refrescar simulación",
      "newSim": "Nueva simulación",
      "csvTemplate": "Plantilla CSV",
      "importShipments": "Importar envíos",
      "disruptions": "Interrupciones",
      "settings": "Ajustes"
    },
    "signal": {
      "title": "Señales",
      "help": "Crea señales piloto activas que afecten la puntuación de riesgo.",
      "typeLabel": "Tipo de señal",
      "affected": "Ruta, transportista o lugar afectado",
      "severity": "Gravedad",
      "confidence": "Confianza",
      "starts": "Inicia",
      "expires": "Termina",
      "add": "Añadir señal",
      "saved": "Señal guardada.",
      "saveFailed": "No se pudo guardar la señal.",
      "archive": "Archivar",
      "now": "Ahora",
      "open": "Abierto",
      "none": "Sin señales activas."
    },
    "contextBar": {
      "title": "Cola de excepciones",
      "critical": "{{count}} críticas",
      "actionable": "{{count}} accionables",
      "activeSignals": "{{count}} señales activas",
      "metrics": {
        "decisions": "Decisiones",
        "avgResponse": "Resp. media",
        "valueProtected": "Valor protegido"
      },
      "refresh": "Refrescar",
      "summary": "Resumen"
    },
    "queue": {
      "searchAria": "Buscar excepciones",
      "searchPlaceholderShort": "Cliente, ruta, transportista…",
      "searchPlaceholderLong": "Buscar cliente, envío, ruta, transportista…",
      "filters": {
        "owner": "Propietario",
        "status": "Estado",
        "risk": "Riesgo",
        "mode": "Modo",
        "carrier": "Transportista"
      },
      "cols": {
        "shipment": "Envío / ID",
        "lane": "Ruta",
        "riskFactor": "Motivo de riesgo",
        "valueAtRisk": "Valor en riesgo",
        "status": "Estado"
      },
      "unassigned": "Sin asignar",
      "noMatch": "Ninguna excepción coincide con los filtros.",
      "noShipments": "Sin envíos aún. Usa la barra lateral para cargar demo o importar CSV — la cola se rellenará tras la puntuación."
    },
    "filterOptions": {
      "all": "Todos",
      "unassigned": "Sin asignar",
      "new": "Nuevo",
      "approved": "Aprobado",
      "deferred": "Aplazado",
      "rejected": "Rechazado",
      "low": "Bajo",
      "medium": "Medio",
      "high": "Alto",
      "critical": "Crítico"
    },
    "riskLevels": {
      "low": "bajo",
      "medium": "medio",
      "high": "alto",
      "critical": "crítico"
    },
    "detail": {
      "carrierPrefix": "Transportista:",
      "origin": "Origen",
      "destination": "Destino",
      "eta": "ETA",
      "riskFactor": "Motivo de riesgo",
      "valueAtRisk": "Valor en riesgo",
      "priorityShipment": "Envío prioridad {{priority}}",
      "scenarioEngine": "Motor de escenarios IA",
      "recommended": "Recomendado",
      "costLabel": "Coste:",
      "selectPrompt": "Selecciona una excepción para inspeccionar riesgo y comparar escenarios."
    },
    "decision": {
      "noteLabel": "Nota de decisión",
      "notePlaceholder": "Añade el motivo operativo de la decisión.",
      "noteRequired": "Se requiere nota para aplazar o rechazar.",
      "execute": "Ejecutar recomendación",
      "defer": "Aplazar",
      "rejectTitle": "Rechazar sugerencia IA",
      "verbs": {
        "approved": "Aprobada",
        "deferred": "Aplazada",
        "rejected": "Rechazada"
      },
      "recorded": "{{action}} registrado para {{customer}}.",
      "saveFailed": "No se pudo guardar la decisión"
    },
    "outcome": {
      "title": "Resultado de la decisión",
      "aiLabel": "IA · {{provider}}",
      "help": "Registra si la respuesta aprobada funcionó en la revisión del piloto.",
      "notePlaceholder": "Añade resultado real, impacto al cliente o notas de seguimiento.",
      "save": "Guardar resultado",
      "saved": "Resultado guardado.",
      "savedToast": "Resultado guardado",
      "saveFailed": "No se pudo guardar el resultado",
      "markedAs": "Marcado como {{status}}.",
      "statuses": {
        "pending": "Pendiente",
        "monitoring": "En seguimiento",
        "successful": "Exitoso",
        "failed": "Fallido"
      }
    },
    "scenarioActions": {
      "watch": "vigilar",
      "wait": "esperar",
      "notify": "notificar",
      "reroute": "redirigir",
      "split": "dividir",
      "expedite": "acelerar"
    },
    "import": {
      "summary": "{{accepted}} envíos importados. {{rejected}} filas rechazadas, {{duplicates}} duplicados.",
      "failed": "Import CSV fallido.",
      "issuesTitle": "Problemas de import a corregir",
      "cols": {
        "row": "Fila",
        "shipment": "Envío",
        "issue": "Problema"
      }
    },
    "toasts": {
      "demoLoaded": {
        "title": "Datos demo cargados",
        "description": "Los envíos y señales de muestra ya están en el espacio."
      },
      "demoFailed": {
        "title": "No se pudieron cargar los datos demo"
      },
      "unknownError": "Error desconocido"
    }
  },
  "auth": {
    "login": {
      "noAccount": "¿Aún no tienes cuenta? <signupLink>ir al registro</signupLink>.",
      "forgotPassword": "¿Olvidaste la contraseña? <resetLink>restablecer</resetLink>."
    },
    "signup": {
      "haveAccount": "Ya tengo una cuenta (<loginLink>ir al inicio de sesión</loginLink>)."
    },
    "passwordReset": {
      "allOkay": "Si todo está bien, <loginLink>ir al inicio de sesión</loginLink>"
    },
    "emailVerification": {
      "allOkay": "Si todo está bien, <loginLink>ir al inicio de sesión</loginLink>"
    }
  },
  "invitations": {
    "eyebrow": "Acceso al espacio",
    "title": "Invitaciones",
    "intro": "Revisa las invitaciones pendientes vinculadas a tu correo de acceso.",
    "accountNote": "Las cuentas piloto usan un único espacio activo. Acepta la invitación correcta antes de crear datos de muestra.",
    "openWorkspace": "Abrir espacio",
    "loading": "Cargando invitaciones…",
    "loadError": "No se pudieron cargar las invitaciones.",
    "empty": {
      "title": "Sin invitaciones pendientes",
      "body": "Si un compañero te invitó, asegúrate de iniciar sesión con el mismo correo de la invitación."
    },
    "role": "Rol",
    "invitedBy": "Invitado por",
    "sent": "Enviada",
    "accepting": "Aceptando…",
    "accept": "Aceptar invitación",
    "accepted": "Invitación aceptada. Ya puedes abrir el espacio.",
    "acceptFailed": "No se pudo aceptar la invitación."
  },
  "legal": {
    "eyebrow": "Legal",
    "lastUpdatedLabel": "Última actualización",
    "placeholderNotice": "Contenido provisional — el texto definitivo de la política reemplazará este párrafo antes del lanzamiento.",
    "privacy": {
      "title": "Política de privacidad",
      "updated": "mayo de 2026",
      "intro": "RMRoads AI es una mesa de trabajo de respuesta a interrupciones para equipos de cadena de suministro. Esta política describe qué recopilamos, cómo lo usamos y qué controles tienen los planificadores sobre sus datos.",
      "sections": {
        "collect": {
          "heading": "Qué recopilamos",
          "body": "Datos de cuenta (nombre, correo), datos de envío que importas al espacio de trabajo y telemetría de uso básica necesaria para operar el producto."
        },
        "use": {
          "heading": "Cómo lo usamos",
          "body": "Para operar tu espacio de trabajo, priorizar el riesgo de excepciones, mostrar opciones de recuperación y enviar las alertas y resúmenes semanales que configures."
        },
        "sharing": {
          "heading": "Compartición",
          "body": "No vendemos datos personales. Compartimos datos únicamente con subprocesadores estrictamente necesarios para prestar el servicio (envío de correo, hosting, monitorización de errores)."
        },
        "choices": {
          "heading": "Tus opciones",
          "body": "Puedes solicitar la exportación o eliminación de los datos de tu espacio de trabajo en cualquier momento. Los planificadores controlan qué miembros ven qué envíos."
        },
        "contact": {
          "heading": "Contacto",
          "body": "Durante el piloto, las preguntas sobre esta política se dirigen al propietario del espacio de trabajo. Antes del lanzamiento de pago se publicará un contacto específico de privacidad."
        }
      }
    },
    "terms": {
      "title": "Términos del servicio",
      "updated": "mayo de 2026",
      "intro": "Al usar RMRoads AI aceptas estos términos. Cubren el uso aceptable, las responsabilidades de tu cuenta y la frontera entre el apoyo a la decisión y la ejecución autónoma.",
      "sections": {
        "using": {
          "heading": "Uso de RMRoads AI",
          "body": "RMRoads AI prioriza excepciones de envío y muestra opciones de recuperación. Las decisiones son tuyas — el producto es apoyo a la decisión, no ejecución autónoma."
        },
        "account": {
          "heading": "Tu cuenta",
          "body": "Eres responsable de mantener seguras tus credenciales y de la actividad de los miembros que invitas. Avísanos de inmediato si sospechas de acceso no autorizado."
        },
        "acceptable": {
          "heading": "Uso aceptable",
          "body": "No importes datos que no estés autorizado a compartir, no intentes saltarte el aislamiento entre inquilinos y no uses el servicio para infringir la ley o los derechos de terceros."
        },
        "availability": {
          "heading": "Disponibilidad del servicio",
          "body": "Durante el piloto, el servicio se presta tal cual, sin un SLA formal. Procuramos avisar con tiempo razonable de mantenimientos planificados y cambios incompatibles."
        },
        "contact": {
          "heading": "Contacto",
          "body": "Durante el piloto, las preguntas sobre estos términos se dirigen al propietario del espacio de trabajo. Se publicarán términos formales antes del lanzamiento de pago."
        }
      }
    },
    "cookies": {
      "title": "Ajustes de cookies",
      "updated": "mayo de 2026",
      "intro": "RMRoads AI utiliza un conjunto mínimo de cookies. No empleamos rastreadores publicitarios entre sitios.",
      "sections": {
        "necessary": {
          "heading": "Estrictamente necesarias",
          "body": "Las cookies de sesión te mantienen conectado y recuerdan qué espacio de trabajo tienes abierto. El producto no funciona sin ellas."
        },
        "preferences": {
          "heading": "Preferencias",
          "body": "El almacenamiento local recuerda tu idioma y el tema claro/oscuro. Estos valores no salen de tu navegador."
        },
        "analytics": {
          "heading": "Analítica",
          "body": "La telemetría agregada de uso se anonimiza y solo sirve para mejorar el producto. Durante el piloto no se establecen cookies analíticas."
        },
        "manage": {
          "heading": "Gestionar preferencias",
          "body": "Borra los datos del sitio en tu navegador para reiniciar todas las cookies y el almacenamiento local. Al volver a abrirlo solo se recrearán las entradas estrictamente necesarias."
        }
      }
    }
  }
}
;
