# Release Strategy Checklist

## Deployment Order

### Frontend/Backend Coordination
- [ ] **BE deploys first**: If FE depends on new BE API, is BE deployed first?
- [ ] **FE deploys first**: If BE removes old API, is FE updated first?
- [ ] **Simultaneous deployment required**: If changes are tightly coupled, is deployment coordinated?

### Database Migrations
- [ ] **Migration before code**: If code expects new schema, is migration applied first?
- [ ] **Code before migration**: If dropping columns, is code updated first?
- [ ] **Multi-step migration**: Is expand-contract pattern used for complex changes?

## Backward Compatibility

### API Compatibility
- [ ] **Additive change (safe)**: New fields/endpoints don't break existing clients?
- [ ] **Deprecation period**: Are deprecated endpoints still functional temporarily?
- [ ] **Version bumping**: Is API version incremented for breaking changes?

### Data Compatibility
- [ ] **Old data format supported**: Can new code read old data?
- [ ] **New data format backward compatible**: Can old code read new data?
- [ ] **Rollback safe**: If deployment fails, can we rollback without data loss?

## Rollout Strategy

### Gradual Rollout
- [ ] **Feature flag**: Is the change behind a feature flag for gradual rollout?
- [ ] **Canary deployment**: Is change tested on a subset of traffic first?
- [ ] **Quick rollback plan**: Is immediate rollback possible if issues arise?

### Monitoring
- [ ] **Health checks**: Are appropriate health checks in place?
- [ ] **Alerting**: Are alerts configured for potential failure scenarios?
- [ ] **Metrics**: Are key metrics being monitored for regression?

## Risk Assessment

### Impact Scope
- [ ] **User-facing impact**: Does this change affect end users directly?
- [ ] **Performance impact**: Are there performance implications?
- [ ] **Security impact**: Are there security considerations?

### Risk Level
- [ ] **High risk identified**: Major breaking changes, data migrations
- [ ] **Medium risk identified**: Logic changes, may affect behavior
- [ ] **Low risk identified**: Refactoring, no behavior change
