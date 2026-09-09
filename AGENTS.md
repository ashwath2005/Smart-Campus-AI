# Development Guidelines & Agent Workflow

## DESIGN
- Use **Google Stitch** as the primary UI design source when a Stitch design exists.
- Preserve Stitch typography, colors, spacing, layout, and component structure.
- Do not randomly redesign the interface or invent arbitrary styles.
- Build clean, reusable UI components rather than monolithic templates.

## DOCUMENTATION
- Prefer current official documentation for frameworks, libraries, and tools.
- Never guess APIs or props when documentation and type definitions can be verified.

## IMPLEMENTATION
- Inspect the existing codebase before modifying it.
- Reuse existing architecture and component conventions.
- Do not rewrite or modify unrelated code.
- Keep components modular, decoupled, and maintainable.
- Use TypeScript where applicable.
- Follow the project's existing framework and package manager conventions.

## TESTING
- After implementation, start the local development server.
- Use **Playwright MCP** to automate and test the rendered application.
- Validate critical user flows, interactions, and form submissions.
- Check browser console messages for errors and warnings.
- Check failed network requests where relevant.
- Test both desktop and mobile viewports.
- Fix all discovered functional and layout issues.

## VISUAL QA
- Compare the rendered UI against Stitch designs when available.
- Verify and refine spacing, typography, sizing, alignment, and responsive behavior.
- Do not consider a task complete merely because the code compiles or tests pass.

## SECURITY
- Never expose API keys, tokens, or credentials.
- Never commit secrets to Git.
- Never print secrets or sensitive credentials in terminal output.
