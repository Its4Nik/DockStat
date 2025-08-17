# Package Pull Request

## Description

Please provide a brief description of the changes to the package(s).

## Package(s) Affected

Please check all that apply:

- [ ] sqlite-wrapper
- [ ] db
- [ ] typings

## Type of Change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Type safety improvement
- [ ] API enhancement
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Test improvements
- [ ] Build system changes

## Related Issues

Closes #(issue number)
Fixes #(issue number)
Related to #(issue number)

## Changes Made

Please provide a detailed list of changes:

- 
- 
- 

## API Changes

If applicable, describe any API changes:

- [ ] No API changes
- [ ] New public methods/functions added
- [ ] Existing methods/functions modified
- [ ] Methods/functions deprecated
- [ ] Methods/functions removed

### New API Surface
```typescript
// New APIs introduced
```

### Modified API Surface
```typescript
// APIs that were changed
```

## Type Safety Impact

For TypeScript packages, describe type changes:

- [ ] No type changes
- [ ] New types added
- [ ] Existing types improved
- [ ] Breaking type changes
- [ ] Generic constraints updated
- [ ] Export structure changed

## Breaking Changes

If this PR introduces breaking changes, please describe them:

- 
- 

### Migration Guide

Provide migration instructions for breaking changes:

```typescript
// Before
const oldCode = example();

// After
const newCode = example();
```

## Testing

Please describe the testing you've performed:

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Type checking passes
- [ ] Manual testing completed
- [ ] Added new tests for new functionality
- [ ] Existing tests updated for changes
- [ ] Performance tests completed

### Test Commands
```bash
# Add commands used for testing
npm test
npm run test:unit
npm run test:integration
npm run check-types
```

## Package Build & Distribution

- [ ] Package builds successfully
- [ ] Type declarations generated correctly
- [ ] Bundle size impact assessed
- [ ] Exports are properly configured
- [ ] Dependencies are correctly specified

### Build Commands
```bash
npm run build
npm run check-types
npm pack --dry-run
```

## Version Impact

- [ ] Patch version (bug fixes, no breaking changes)
- [ ] Minor version (new features, no breaking changes)
- [ ] Major version (breaking changes)
- [ ] No version change needed

## Performance Impact

Please describe any performance implications:

- [ ] No performance impact
- [ ] Performance improvement (provide metrics)
- [ ] Memory usage optimization
- [ ] Bundle size reduction
- [ ] Runtime performance improvement
- [ ] Potential performance regression (please explain)

## Dependencies

- [ ] No dependency changes
- [ ] New dependencies added
- [ ] Dependencies updated
- [ ] Dependencies removed
- [ ] Peer dependencies updated

### Dependency Changes
```json
{
  "added": {},
  "updated": {},
  "removed": []
}
```

## Bundle Analysis

If applicable, provide bundle analysis:

- [ ] Bundle size impact analyzed
- [ ] Tree-shaking compatibility verified
- [ ] No unnecessary dependencies included
- [ ] Polyfills impact assessed

## Backward Compatibility

- [ ] Fully backward compatible
- [ ] Backward compatible with deprecation warnings
- [ ] Breaking changes with migration path
- [ ] Major breaking changes

## Documentation

- [ ] API documentation updated
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Type documentation (JSDoc) updated
- [ ] Usage examples updated
- [ ] No documentation changes needed
- [ ] Documentation will be updated in a separate PR

## Package-Specific Testing

### For sqlite-wrapper:
- [ ] Tested with various SQLite operations
- [ ] Query builder functionality verified
- [ ] Type safety for database operations confirmed
- [ ] JSON column handling tested
- [ ] Transaction handling verified

### For db package:
- [ ] Database connection handling tested
- [ ] Migration functionality verified
- [ ] Performance with large datasets tested
- [ ] Concurrent operation handling verified
- [ ] Backup/restore functionality tested

### For typings package:
- [ ] Type definitions compile without errors
- [ ] Type inference works correctly
- [ ] Generic constraints function properly
- [ ] Export structure is correct
- [ ] Compatibility with consuming packages verified

## Security Considerations

- [ ] No security implications
- [ ] Input validation implemented/updated
- [ ] No sensitive data exposed
- [ ] Dependencies scanned for vulnerabilities
- [ ] SQL injection prevention verified (for database packages)

## Release Checklist

Before publishing to npm:

- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated
- [ ] Build artifacts are clean
- [ ] All tests pass in CI
- [ ] Documentation is up to date
- [ ] Breaking changes are clearly documented
- [ ] Migration guide provided (if needed)

## Package-Specific Checklist

Please ensure all items are completed:

- [ ] Package builds without errors
- [ ] Type definitions are generated correctly
- [ ] All public APIs are properly typed
- [ ] JSDoc comments are complete and accurate
- [ ] Examples in README work correctly
- [ ] Package can be imported in both CommonJS and ESM environments
- [ ] No circular dependencies introduced
- [ ] Tree-shaking works correctly
- [ ] Bundle size is reasonable

## Publishing Notes

Any special considerations for publishing:

- 
- 

## Additional Notes

Add any other context or notes for reviewers:

---

**Reviewer Notes:**
- Please verify type safety and API design
- Check for potential breaking changes
- Ensure documentation is clear and complete
- Test package installation and usage
- Verify bundle size impact