# Migration Plan: Legacy Agents → Unified Marketplace System

## Executive Summary

**Goal:** Migrate legacy Python agents to use the new marketplace tables WITHOUT breaking functionality.

**Strategy:** Dual-table support with gradual migration path.

**Risk:** LOW - We'll maintain backward compatibility during transition.

---

## Current State

### Legacy Agents (5 agents):
1. **crypto-daily** - Crypto research reports (7:05 AM PT)
2. **medical-daily** - Medical news digest (6:45 AM PT)
3. **arxiv-research** - arXiv paper summaries (7:30 AM PT)
4. **air** - AI Research personalized reports (Daily)
5. **recruiting** - Recruiting candidate discovery (Daily)

### Current Architecture:
```
agent_subscriptions table
├── subscriber_id (UUID)
├── agent_slug (text) ← "crypto-daily", "medical-daily", etc.
├── active (boolean)
├── last_sent_at (timestamp)
└── preferences (jsonb)
```

### New Marketplace Architecture:
```
agents table
├── id (UUID) ← Primary key
├── name, slug, description
├── status (draft/approved)
├── current_version_id

subscriptions table
├── agent_id (UUID) ← References agents(id)
├── user_id, phone_number
├── status (active/paused)
├── is_paid, payment info
```

---

## Migration Strategy

### Phase 1: Dual-Table Support (No Breaking Changes)

#### Step 1: Create Agent Records for Legacy Agents

Migration SQL to create agent entries:

```sql
-- Create legacy agents in new agents table
INSERT INTO agents (id, name, slug, description, category, status, is_featured, is_paid, creator_user_id, created_at, approved_at)
VALUES
  (gen_random_uuid(), 'Crypto Daily', 'crypto-daily', 
   'Daily cryptocurrency research and market analysis', 
   'Finance', 'approved', true, false, NULL, NOW(), NOW()),
   
  (gen_random_uuid(), 'Medical Daily', 'medical-daily', 
   'Daily medical research news and breakthroughs', 
   'Health', 'approved', true, false, NULL, NOW(), NOW()),
   
  (gen_random_uuid(), 'arXiv Research', 'arxiv-research', 
   'Latest AI/ML papers from arXiv', 
   'Research', 'approved', true, false, NULL, NOW(), NOW()),
   
  (gen_random_uuid(), 'AI Research (Personalized)', 'air', 
   'Personalized AI research reports', 
   'Research', 'approved', false, false, NULL, NOW(), NOW()),
   
  (gen_random_uuid(), 'Recruiting Agent', 'recruiting', 
   'Automated candidate discovery and screening', 
   'Recruiting', 'approved', false, false, NULL, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Create placeholder versions (since they use Python, not workflows)
INSERT INTO agent_versions (id, agent_id, version, definition_jsonb, created_at, changelog)
SELECT 
  gen_random_uuid(),
  a.id,
  1,
  jsonb_build_object(
    'type', 'legacy_python_agent',
    'execution', 'python_script',
    'description', a.description
  ),
  NOW(),
  'Initial migration from legacy system'
FROM agents a
WHERE a.slug IN ('crypto-daily', 'medical-daily', 'arxiv-research', 'air', 'recruiting')
ON CONFLICT DO NOTHING;

-- Update current_version_id
UPDATE agents a
SET current_version_id = av.id
FROM agent_versions av
WHERE av.agent_id = a.id 
  AND a.slug IN ('crypto-daily', 'medical-daily', 'arxiv-research', 'air', 'recruiting')
  AND a.current_version_id IS NULL;
```

#### Step 2: Migrate Existing Subscriptions

```sql
-- Migrate agent_subscriptions to new subscriptions table
INSERT INTO subscriptions (
  id, 
  user_id, 
  phone_number, 
  agent_id, 
  status, 
  is_paid, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.supabase_id,
  s.phone_number,
  a.id,
  CASE WHEN asub.active THEN 'active' ELSE 'cancelled' END,
  false,
  asub.subscribed_at,
  NOW()
FROM agent_subscriptions asub
JOIN sms_subscribers s ON s.id = asub.subscriber_id
JOIN agents a ON a.slug = asub.agent_slug
WHERE a.slug IN ('crypto-daily', 'medical-daily', 'arxiv-research', 'air', 'recruiting')
ON CONFLICT (phone_number, agent_id) DO NOTHING;
```

#### Step 3: Update Code to Support Both Tables

Create a hybrid subscription module:

```typescript
// lib/agent-subscriptions-unified.ts

export async function getAgentSubscribers(
  agentSlug: string
): Promise<AgentSubscriber[]> {
  // Try new subscriptions table first
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('slug', agentSlug)
    .single();
    
  if (agent) {
    // Agent exists in new system - use new subscriptions table
    return getSubscribersFromNewTable(agent.id);
  } else {
    // Fallback to old agent_subscriptions table
    return getSubscribersFromLegacyTable(agentSlug);
  }
}

export async function subscribeToAgent(
  phoneNumber: string,
  agentSlug: string
): Promise<SubscribeResult> {
  // Check if agent exists in new system
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('slug', agentSlug)
    .single();
    
  if (agent) {
    // Use new subscriptions table
    return subscribeToNewSystem(phoneNumber, agent.id);
  } else {
    // Use legacy agent_subscriptions table
    return subscribeToLegacySystem(phoneNumber, agentSlug);
  }
}
```

---

### Phase 2: Gradual Transition

#### Benefits of This Approach:

1. **Zero Downtime** - Legacy agents continue working
2. **Gradual Migration** - Move agents one at a time
3. **Rollback Safe** - Can revert if issues arise
4. **Data Preserved** - All subscription history maintained
5. **Unified Marketplace** - All agents visible in one place

#### Migration Timeline:

**Week 1: Preparation**
- Run migration SQL to create agent records
- Deploy dual-table support code
- Test with crypto-daily (lowest risk)

**Week 2: Validation**
- Monitor crypto-daily for 7 days
- Verify all subscribers receive reports
- Check for any edge cases

**Week 3: Full Migration**
- Migrate remaining agents (medical-daily, arxiv-research, air, recruiting)
- Update all command handlers
- Deprecate old agent_subscriptions queries

**Week 4: Cleanup**
- Remove legacy table fallback code
- Archive agent_subscriptions table
- Update documentation

---

## Technical Implementation

### Files to Update:

1. **lib/agent-subscriptions-unified.ts** - New hybrid module
2. **agents/crypto-research/index.ts** - Update to use unified subscriptions
3. **agents/medical-daily/index.ts** - Update to use unified subscriptions
4. **agents/arxiv-research-graph/index.ts** - Update to use unified subscriptions
5. **agents/air-personalized/index.ts** - Update to use unified subscriptions
6. **agents/recruiting/index.ts** - Update to use unified subscriptions
7. **commands/*.ts** - Update all command handlers
8. **migrations/011_migrate_legacy_agents.sql** - Migration SQL

### Testing Strategy:

```bash
# 1. Test subscription lookup
npm run test:agent-lookup

# 2. Test daily broadcast
npm run test:crypto-broadcast

# 3. Test subscribe/unsubscribe
npm run test:subscription-flow

# 4. Test command handlers
npm run test:agent-commands
```

---

## Rollback Plan

If issues arise:

1. **Immediate:** Revert code to use agent_subscriptions table only
2. **Data Safe:** New subscriptions table is additive (doesn't delete old data)
3. **Quick Fix:** Toggle feature flag to disable new system

```typescript
const USE_NEW_SUBSCRIPTION_SYSTEM = process.env.USE_NEW_SUBSCRIPTIONS === 'true';
```

---

## Decision: Should We Migrate?

### ✅ Pros:
- **Unified system** - All agents in one marketplace
- **Better visibility** - Users can browse legacy agents too
- **Improved metrics** - Better tracking and analytics
- **Cleaner codebase** - Single subscription system
- **Marketplace ready** - Legacy agents appear in marketplace UI

### ⚠️ Cons:
- **Migration complexity** - Requires careful execution
- **Risk of bugs** - Potential for edge cases
- **Testing effort** - Need thorough validation
- **Code changes** - Multiple files to update

### 💡 Recommendation:

**YES, but do it carefully with dual-table support.**

This allows us to:
1. Test with one agent first (crypto-daily)
2. Monitor for issues
3. Gradually migrate others
4. Maintain rollback capability
5. Eventually have a unified system

---

## Next Steps

If you want to proceed:

1. I'll create the migration SQL
2. Create the unified subscription module
3. Update one agent (crypto-daily) as proof of concept
4. Test thoroughly
5. Migrate remaining agents if successful

**Estimated effort:** 4-6 hours of careful work + 1 week monitoring

Would you like me to proceed with Phase 1?
