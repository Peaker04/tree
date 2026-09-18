# Testing Strategy

## Current Foundation Checks

- Formatting: Prettier
- Lint: ESLint flat config
- Typecheck: TypeScript
- Mobile build smoke: Expo Android export

## Next Test Layers

- Unit tests for contracts/config validators.
- Component tests for mobile primitives and major screens.
- Integration tests for backend API once `apps/api` exists.
- End-to-end tests for login, staff task completion, manager approval, and logout.
