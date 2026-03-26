# KÓRA v1.2 "Unified CRUD" - Release Gate Checklist

## Pre-Release Validation (Team C)

### C-1: Final CI Run Validation ⏳
- [ ] Trigger CI run on `main` branch
- [ ] Verify lint check passes
- [ ] Verify type-check passes
- [ ] Verify unit tests pass (coverage ≥95% UI, ≥90% services)
- [ ] Verify e2e tests pass (all specs)
- [ ] Verify RBAC validation passes (0 violations)
- [ ] Download CI artifact logs
- [ ] Archive logs in `docs/ci-logs/v1.2/`

**Owner**: Quinn  
**Deadline**: EOD Day 1  
**Status**: Awaiting Team A & B merge

---

### C-2: QA Documentation Publication ⏳
- [ ] Verify `QA_TESTING_FRAMEWORK.md` is complete
- [ ] Create Wiki page: Confluence > KÓRA > QATestingFramework
- [ ] Add link to documentation in Wiki
- [ ] Take screenshot of Wiki page
- [ ] Save screenshot as `docs/wiki-link-snapshot.png`
- [ ] Commit screenshot to repository

**Owner**: Rita  
**Deadline**: EOD Day 1  
**Status**: Documentation ready, awaiting Wiki access

---

### C-3: Release Tag Creation ⏳
**Prerequisites (MUST BE GREEN):**
- [ ] CI pipeline passes on `main`
- [ ] UI coverage ≥95% AND Services coverage ≥90%
- [ ] RBAC validation reports 0 violations
- [ ] Smoke video confirmed by Team A
- [ ] All Team A & B PRs merged

**Actions:**
- [ ] Create annotated tag: `git tag -a v1.2-unified-crud -m "Release v1.2 - Unified CRUD"`
- [ ] Push tag: `git push origin v1.2-unified-crud`
- [ ] Draft GitHub Release
- [ ] Auto-generate changelog from merged JIRA tickets
- [ ] Attach smoke video to release
- [ ] Attach coverage reports to release
- [ ] Publish GitHub Release

**Owner**: Victor  
**Deadline**: EOD Day 2  
**Status**: Blocked - awaiting green CI + smoke video

---

### C-4: Ops Deployment Notification ⏳
**Prerequisites:**
- [ ] Release tag created
- [ ] GitHub Release published
- [ ] Smoke video available

**Actions:**
- [ ] Post to Slack `#kora-ops`:
  ```
  🚀 KÓRA v1.2 "Unified CRUD" Ready for Staging Deployment
  
  Release Tag: v1.2-unified-crud
  Release Notes: [GitHub Release URL]
  Smoke Video: [Video URL]
  
  Key Changes:
  - Complete role-based UI wiring (5 roles)
  - Full CRUD for Clients, Bookings, Services, Staff, Payments
  - 95%+ test coverage
  - RBAC security validation
  
  Please deploy to staging and confirm health check.
  ```
- [ ] Create Ops ticket: `DEPLOY-STG-V1.2`
- [ ] Assign to Ops team
- [ ] Link release notes and smoke video

**Owner**: Wendy  
**Deadline**: EOD Day 2  
**Status**: Blocked - awaiting release tag

---

## Cross-Team Integration Validation

### Integration Checklist (Run after all PRs merged):
1. [ ] Pull fresh `main` on clean workstation
2. [ ] Run `npm ci && npm run build && npm run start`
3. [ ] Verify app starts without warnings
4. [ ] Execute full Cypress suite: `npx cypress run --spec "cypress/e2e/**/*.cy.ts"`
5. [ ] Verify all specs pass (clients, bookings, payments, auth, sidebar, AI-insight)
6. [ ] Run `npm run test:coverage`
7. [ ] Confirm UI ≥95% and Services ≥90%
8. [ ] Run `node scripts/validate-rbac.js`
9. [ ] Verify output: "All routes have RequireRole - PASS"
10. [ ] Review smoke video (client → staff → admin)
11. [ ] Verify UI updates shown in video

**If any step fails**: Open blocker bug, assign to responsible team immediately.

---

## Communication Schedule

### Daily Stand-up Posts (Slack `#kora-ui-project`):
- **09:00 UTC**: Morning status update
- **15:00 UTC**: Afternoon progress check

### Day 1 Updates:
- Morning: "Team C ready for final CI validation. Awaiting Team A & B PRs."
- Afternoon: "CI validation [status]. Documentation [status]. Blockers: [list]."

### Day 2 Updates:
- Morning: "Release tag preparation. Prerequisites: [checklist status]."
- Afternoon: "Release v1.2 [TAGGED/BLOCKED]. Ops notification [SENT/PENDING]."

---

## Final Sign-Off Criteria

### Must be ✅ before release:
- [ ] Green CI badge on repository
- [ ] Coverage summary ≥95% UI, ≥90% services
- [ ] Staging deployment ticket created
- [ ] Release notes attached
- [ ] Smoke video attached
- [ ] Ops confirms staging health check
- [ ] All roles tested: client, business_admin, staff, operations, kora_admin
- [ ] Manual booking workflow verified on staging

### Release Announcement Template:
```
🎉 KÓRA v1.2 "Unified CRUD" - RELEASED

We're excited to announce the release of KÓRA v1.2, featuring:
✅ Complete role-based UI wiring for 5 user roles
✅ Full CRUD operations for all core modules
✅ 95%+ test coverage with comprehensive CI pipeline
✅ RBAC security validation
✅ Production-ready quality gates

Release Notes: [GitHub Release URL]
Documentation: [Wiki URL]

Epic: KORA-UI-WIRING-V1.2 → DONE
```

---

## Team C Status: READY FOR GATE ENFORCEMENT

All QA infrastructure complete. Standing by for Team A & B deliverables to execute final validation and release.