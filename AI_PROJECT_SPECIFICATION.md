# NULL PROTOCOL

## AI Project Specification Document

### Version 1.0

### Status: Active Development

---

## 1. PROJECT OVERVIEW

**Project Name:** Null Protocol  
**Type:** Open Source Educational Cybersecurity Simulation Framework  
**License:** MIT or Apache 2.0  
**Primary Language:** TypeScript (Strict Mode Mandatory)  
**Architecture Model:** Monorepo

Null Protocol is a deterministic, sandboxed cybersecurity simulation platform designed strictly for educational purposes.

It teaches offensive and defensive security concepts through simulated environments.

---

## 2. STRICT NON-GOALS

This project MUST NOT implement or support:

- Real network scanning
- Wi-Fi interaction
- NFC interception
- Packet sniffing
- Device access
- OS-level execution
- Brute force tooling
- Exploit automation
- Raw socket communication
- External system interaction

All behaviors are deterministic simulations executed within a controlled engine.

---

## 3. DESIGN PRINCIPLES

1. Deterministic simulation engine
2. Strict separation of concerns
3. Extensible scenario-driven architecture
4. Security-by-design
5. Legal and ethical compliance
6. Engineering-grade documentation
7. Robust testing coverage
8. Professional software standards

---

## 4. REPOSITORY STRUCTURE

```text
apps/
  web/
  docs/

packages/
  engine/
  scenario-kit/
  ui/
  content/
  auth/
  api/

tooling/
  ci/
  eslint/
  tsconfig/
```

Rules:

- Engine must NEVER depend on UI.
- UI depends on Engine.
- Scenario-kit validates content.
- API layer must be secure and validated.

---

## 5. TECHNOLOGY STACK

### Core

- Next.js (App Router)
- TypeScript (strict mode enabled)
- Turborepo
- Yarn workspaces
- Zod (schema validation)
- Zustand (state management)
- TailwindCSS
- Framer Motion (controlled usage)
- Prisma ORM
- PostgreSQL
- Redis (optional)
- Playwright (E2E testing)
- Jest or Vitest (unit testing)

---

## 6. ENGINE SPECIFICATION

The simulation engine must:

- Be deterministic
- Use event-driven state transitions
- Support replay functionality
- Maintain event logs
- Support scoring
- Reject invalid actions
- Validate scenario schema
- Operate without network access

Engine components:

- State Store
- Action Dispatcher
- Rule Evaluator
- Transition Resolver
- Event Log
- Scenario Validator

---

## 7. SCENARIO SYSTEM

Scenarios must:

- Follow strict Zod schema validation
- Include schemaVersion
- Define metadata
- Define initialState
- Define allowedActions
- Define transitions
- Define scoringRules
- Define completionConditions
- Define narrativeContent

Scenarios must NOT include:

- Exploit code
- Attack scripts
- Network commands
- System-level instructions

Scenarios simulate conceptual vulnerabilities such as:

- Weak configuration logic
- Improper access control
- Cryptographic misunderstandings
- Hardening processes
- Defensive mitigation

---

## 8. CAMPAIGN SYSTEM

Campaign system must support:

- Ordered scenarios
- Progressive difficulty
- Unlock conditions
- Achievement tracking
- Score aggregation
- Replay capability

Campaigns must be modular and extensible.

---

## 9. AUTHENTICATION REQUIREMENTS

Must support:

- Google OAuth
- Apple Sign In
- JWT sessions
- PKCE flow
- Secure cookies (httpOnly, SameSite=Strict)
- CSRF protection
- Token rotation

Protected routes must:

- Validate session
- Enforce rate limiting
- Log authentication events
- Validate payload schemas

---

## 10. API SPECIFICATION

Protected API routes:

- POST /api/auth/login
- POST /api/auth/logout
- GET /api/user/profile
- GET /api/campaigns
- POST /api/session/start
- POST /api/session/action
- GET /api/session/replay

API must:

- Validate inputs via schema
- Reject malformed payloads
- Log suspicious activity
- Implement rate limiting
- Avoid direct system-level access

---

## 11. UI DESIGN SPECIFICATION

Design philosophy:

- Terminal-inspired interface
- Hardware aesthetic
- Monochrome palette
- Grid background
- Data-dense layout
- Professional tone
- No glamorization of hacking

Core components:

- TerminalShell
- GridBackground
- DataPanel
- StatusStrip
- CampaignNavigator
- AsciiVisualizer

Accessibility requirements:

- WCAG AA compliance
- Keyboard navigation
- Reduced motion support

---

## 12. TESTING STRATEGY

Unit Tests:

- Engine logic
- Rule evaluation
- State transitions
- Scenario validation

Integration Tests:

- Action dispatch to UI rendering
- Authentication flows
- Session lifecycle

E2E Tests:

- Full scenario completion
- OAuth login
- Replay validation

Minimum coverage target: 85%

---

## 13. CI/CD REQUIREMENTS

GitHub Actions pipeline must include:

- Lint
- Typecheck
- Unit tests
- Integration tests
- E2E tests
- Build validation
- Dependency vulnerability scanning

Main branch must be protected.

---

## 14. SECURITY POLICY

Repository must include:

- SECURITY.md
- Responsible disclosure policy
- Ethical usage disclaimer
- Clear prohibition of misuse

Project must not include:

- Raw socket usage
- Dynamic eval
- External network access
- OS-level command execution

---

## 15. COMPLIANCE

Must align conceptually with:

- OWASP Top 10 (educational reference only)
- Secure session handling practices
- GDPR minimal data retention
- Privacy-first analytics approach

---

## 16. VERSIONING POLICY

Semantic Versioning required:

MAJOR.MINOR.PATCH

Scenario schema must include: schemaVersion.

Backward compatibility must be maintained.

---

## 17. CONTRIBUTION GUIDELINES

Contributors must:

- Follow strict TypeScript standards
- Include tests for new logic
- Validate scenario schema
- Pass CI checks
- Avoid operational exploit logic

Pull requests containing:

- Real attack code
- Network interaction logic
- Exploit scripts

Must be rejected.

---

## 18. EXPANSION ROADMAP

Future expansion may include:

- Advanced cryptographic simulation
- Access control lab
- Instructor dashboard
- Multiplayer simulated environment
- Enterprise analytics
- Certification system

All future modules must maintain sandbox simulation architecture.

---

## 19. CORE PHILOSOPHY

Null Protocol teaches:

Think like an attacker.  
Defend like an architect.  
Build like an engineer.

---

END OF SPECIFICATION
