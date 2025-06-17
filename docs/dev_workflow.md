# Development Workflows

## Code Quality Checks

Before committing, run these checks:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run check

# Run all tests
npm run test
```

## Testing

- **Unit tests**: `npm run test:unit` - Fast feedback during development
- **Watch mode**: `npm run test:unit:watch` - Continuous testing during development
- **E2E tests**: `npm run test:e2e` - Full integration testing
- **All tests**: `npm run test` - Run both unit and E2E tests
- **Code coverage**: `npm run test:coverage` - Generate coverage report

## Type Checking

- **One-time check**: `npm run check` - Verify all TypeScript and Svelte types
- **Watch mode**: `npm run check:watch` - Continuous type checking during development

## Build Variants

- **Development build**: `npm run build-debug` - Unminified with source maps for debugging
- **Production build**: `npm run build` - Optimized for deployment

## Common Development Tasks

### Adding a New Component

1. Create the component file in the appropriate directory (`/site/`, `/pages/`, or `/data-aware/`)
2. Follow the [naming conventions](component_architecture.md#naming-conventions)
3. Add `@component` JSDoc comment
4. Define `Props` interface with JSDoc documentation
5. Use `$props()` for prop destructuring
6. Add component-specific styles

### Debugging

- Use `npm run build-debug` for unminified builds with source maps
- Browser dev tools work normally with the development server
- Check browser console for runtime errors
- Use `npm run check:watch` for real-time type checking

### Performance Testing

- Use browser dev tools Performance tab
- Test on different devices and network conditions
- Monitor bundle size with `npm run build`
- Check for lazy loading effectiveness

## Troubleshooting

**If you encounter dependency issues after bumping package versions, try this first:**

```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors after dependency changes:**

```bash
npm run check
```

**Formatting inconsistencies:**

```bash
npm run format
```

**Test failures:**

```bash
npm run test:unit
```

**Build failures:**

```bash
npm run build-debug
```
