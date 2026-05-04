// Admin editor feature for the service questions framework.
// The reusable building blocks (types, helpers, renderers) live in:
//   - @/shared/lib/questions
//   - @/shared/components/question-renderers
// Anything imported from those paths can be consumed by other features
// (service-hire, future onboarding flows, etc.) without crossing feature
// boundaries.
export * from './schemas';
export { saveServiceQuestions } from './actions/save-questions';
