---
name: agentes-habilidades
description: "Sistema de skills del agente: cómo leer skills existentes, crear nuevas, y mantener memoria persistente."
version: 1.0.0
---

# Skills del Agente

## Dónde están las skills
- **Globales**: `~/.openclaw/workspace/skills/<skill-name>/` (skills del sistema)
- **Proyecto**: `.agents/skills/<skill-name>.md` (skills del proyecto)

## Skills globales disponibles
| Skill | Propósito |
|-------|-----------|
| `agent-subagents-ui` | Patrones de UI enfocados en componentes |
| `proactivity` | Reverse prompting, autogestión, señales de oportunidad |
| `self-improving-agent` | Logging de correcciones, promoción a AGENTS.md |
| `self-improving` | Memoria por niveles (HOT/WARM/COLD), reflexión |
| `skill-vetter` | Vetting de seguridad antes de instalar código externo |
| `ui-ux-pro-max` | Design tokens, dark mode, tipografía, paletas |

## Formato de skill
```markdown
---
name: skill-name
description: "Breve descripción de cuándo usar esta skill."
version: 1.0.0
---

# Skill Name

## Reglas
- ...

## Comandos
- ...

## Patrones
- ...
```

## Cuándo crear una skill
- Un patrón se repite 3+ veces
- El usuario pide guardar algo
- Se descubre una solución no obvia a un problema recurrente
- Una corrección del usuario revela conocimiento que debe persistir

## Cuándo leer una skill
- Antes de empezar una tarea en un área nueva
- Cuando algo falla de manera que parece ya conocida
- Al inicio de una sesión en este proyecto
