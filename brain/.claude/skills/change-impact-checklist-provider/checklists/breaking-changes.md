# Breaking Changes Checklist

## API Signature Changes

### Function/Method Signatures
- [ ] **Required argument added**: Does any existing caller need to update their call?
- [ ] **Argument removed**: Are there callers using this argument?
- [ ] **Argument type changed**: Do all callers pass the correct type?
- [ ] **Return type changed**: Do all callers handle the new return type?
- [ ] **Exception/Error type changed**: Do all callers handle errors correctly?

### Interface/Type Definitions
- [ ] **Property added (required)**: Do all implementers provide this property?
- [ ] **Property removed**: Do all consumers stop using this property?
- [ ] **Property type changed**: Are all usages compatible?
- [ ] **Generic constraint changed**: Are all usages still valid?

## Database Schema Changes

### Schema Modifications
- [ ] **Column added (NOT NULL)**: Is there a migration to populate existing rows?
- [ ] **Column removed**: Is the column no longer referenced in code?
- [ ] **Column type changed**: Is data migration required?
- [ ] **Index added/removed**: Are performance implications considered?
- [ ] **Foreign key changed**: Are relationships still valid?

### Data Integrity
- [ ] **Constraint added**: Does existing data satisfy the constraint?
- [ ] **Cascade rule changed**: Are delete/update behaviors still correct?

## Logic/Behavior Changes

### Behavioral Modifications
- [ ] **Default value changed**: Do callers relying on old default work correctly?
- [ ] **Validation rule changed**: Are existing inputs still valid?
- [ ] **Business logic changed**: Are all use cases still satisfied?
- [ ] **Side effects changed**: Are dependent systems aware of the change?

## External Dependencies

### Third-party Changes
- [ ] **Library version updated**: Are there breaking changes in the library?
- [ ] **API endpoint changed**: Are all clients updated?
- [ ] **Environment variable changed**: Are all environments updated?
