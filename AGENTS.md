<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Specific conventions in this version:
- **Middleware / Proxy**: Routing middleware is defined in `src/proxy.ts` (or `proxy.ts` in root) instead of `middleware.ts`. It must export a function named `proxy(request: NextRequest)`. This is the standard mechanism for route interception and protection in this project.
<!-- END:nextjs-agent-rules -->
