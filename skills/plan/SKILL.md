---
description: Restate requirements, research risks, critique gaps, clarify ambiguities, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

# Plan Command

This command invokes the **planner** agent to create a comprehensive implementation plan before writing any code.

## What This Command Does

1. **Restate Requirements** - Clarify what needs to be built
2. **Research Known Risks** - Proactively surface pitfalls and known failure cases
3. **Critique for Gaps** - Check for missing context, error handling, constraints
4. **Clarify Ambiguities** - Ask targeted questions (only for gaps found)
5. **Create Step Plan** - Break down implementation into phases
6. **Wait for Confirmation** - MUST receive user approval before proceeding

## When to Use

Use `/plan` when:
- Starting a new feature
- Making significant architectural changes
- Working on complex refactoring
- Multiple files/components will be affected
- Requirements are unclear or ambiguous

## How It Works

The planner agent will execute these steps **sequentially without interruption** unless a clarification is needed:

### Step 1 — Restate
Analyze the request and restate requirements in clear terms: what is being built, who it serves, and what success looks like.

### Step 2 — Research (主動搜尋潛在風險)
Before planning, **proactively search** for:
- Known pitfalls and failure cases for this type of task
- Tool/library version compatibility issues
- Security or performance concerns reported by the community
- Any constraints inherent to the target tech stack

List found risks with their sources, flagging which ones are **not yet addressed** in the requirements.
> If no specific risks found, note "No additional known risks found" and continue.

### Step 3 — Critique (審視缺口)
Check each item — unresolved ones become clarification questions:
- [ ] **Context Scope** — project boundaries and affected components
- [ ] **Acceptance Criteria** — how do we know the task is complete?
- [ ] **Error Handling** — what happens when things go wrong?
- [ ] **Environment / OS** — deployment target or infrastructure constraints
- [ ] **Output Format** — expected artifacts (files, APIs, UI components)

### Step 4 — Clarify (針對缺口提問)
Ask **only** about the gaps found in Step 3. Provide option choices where possible and mark the recommended option:

**Q: Acceptance criteria?** (Recommended: A)
- A. All tests pass + task demonstrably works end-to-end
- B. Unit tests pass only
- C. Manual verification by user

**Q: Error handling strategy?** (Recommended: B)
- A. Fail Fast — stop immediately on first error
- B. Retry + Escalate — auto-retry 3×, then surface for manual review
- C. Skip & Continue — log error, proceed to next item
- D. Log Only — record errors, never interrupt

**Q: For large tasks — progress tracking?** (Recommended: B)
- A. Not needed, task is small enough to restart from scratch
- B. Write checkpoint to `.progress.json`, resume from last completed step on failure
- C. Log file only, manual checkpoint management

> Skip any question whose answer is already clear from the user's request.

### Step 5 — Plan
Break down implementation into phases with:
1. **Specific, actionable steps** per phase
2. **Dependencies** between phases and external services
3. **Risk rating** (HIGH / MEDIUM / LOW) with mitigation per risk
4. **Acceptance criteria** per phase
5. **Estimated complexity** (High / Medium / Low)
6. **Error handling spec** covering the most likely failure modes
7. **Constraints** — what this plan will NOT do

Then **present the plan and wait** for explicit confirmation.

## Plan Output Structure

```
# Implementation Plan: [Feature Name]

## Requirements Restatement
[Clear restatement of what's being built]

## Known Risks (from Research)
- RISK: [description] — Mitigation: [strategy]

## Implementation Phases

### Phase N: [Name]
Steps...
Acceptance criteria for this phase

## Dependencies
[External tools, services, libraries]

## Risks
- HIGH/MEDIUM/LOW: [risk] — [mitigation]

## Error Handling Strategy
[Selected approach from Step 4, and how it applies to this task]

## Constraints
[What this plan will NOT do; boundaries; forbidden approaches]

## Estimated Complexity: HIGH/MEDIUM/LOW

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## Example

```
User: /plan I need to add real-time notifications when markets resolve

Agent (planner):
# Implementation Plan: Real-Time Market Resolution Notifications

## Requirements Restatement
- Send notifications to users when markets they are watching resolve
- Support multiple notification channels (in-app, email, webhook)
- Ensure notifications are delivered reliably
- Include market outcome and user's position result

## Known Risks (from Research)
- RISK: Email deliverability requires SPF/DKIM — Mitigation: configure DNS before launch
- RISK: BullMQ requires Redis 6+ — Mitigation: verify Redis version in deployment env
- RISK: Supabase real-time has connection limits per plan — Mitigation: check plan tier

## Implementation Phases

### Phase 1: Database Schema
- Add notifications table: id, user_id, market_id, type, status, created_at
- Add user_notification_preferences table for channel preferences
- Create indexes on user_id and market_id for performance
- Acceptance: migrations run cleanly, schema matches spec

### Phase 2: Notification Service
- Create notification service in lib/notifications.ts
- Implement notification queue using BullMQ/Redis
- Add retry logic for failed deliveries (3x with exponential backoff)
- Create notification templates
- Acceptance: unit tests cover queue enqueue, retry, and failure paths

### Phase 3: Integration Points
- Hook into market resolution logic (when status changes to "resolved")
- Query all users with positions in market
- Enqueue notifications for each user
- Acceptance: integration test confirms notification enqueued on resolution

### Phase 4: Frontend Components
- Create NotificationBell component in header
- Add NotificationList modal
- Implement real-time updates via Supabase subscriptions
- Add notification preferences page
- Acceptance: Playwright E2E test — bell updates within 2s of resolution event

## Dependencies
- Redis 6+ (for queue)
- Email service (SendGrid/Resend)
- Supabase real-time subscriptions

## Risks
- HIGH: Email deliverability (SPF/DKIM required)
- MEDIUM: Performance with 1000+ users per market
- MEDIUM: Notification spam if markets resolve frequently
- LOW: Real-time subscription overhead

## Error Handling Strategy
Retry + Escalate — notification delivery retries 3x with exponential backoff;
after 3 failures, status set to "failed" and surfaced in admin dashboard.

## Constraints
- Will NOT implement push (mobile) notifications in this phase
- Will NOT build notification analytics or open-rate tracking

## Estimated Complexity: MEDIUM

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## Special Handling: Large-Scale Tasks

For tasks involving full-project refactors, bulk file modifications, or multi-stage pipelines, the plan **must include**:

- **Checkpointing** — split into batches (20 files or 1 module per batch); write progress state after each batch
- **State Preservation** — on crash or timeout, read `.progress.json` and resume from last checkpoint, skipping completed items
- **Verification Gate** — after each batch, run a verification step (e.g., `npm test`, `pytest`, `eslint`); block the next batch on failure

## Important Notes

**CRITICAL**: The planner agent will **NOT** write any code until you explicitly confirm the plan with "yes" or "proceed" or similar affirmative response.

If you want changes, respond with:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## Integration with Other Commands

After planning:
- Use `/tdd` to implement with test-driven development
- Use `/build-fix` if build errors occur
- Use `/code-review` to review completed implementation

## Related Agents

This command invokes the `planner` agent located at:
`~/.copilot/agents/planner.agent.md`
