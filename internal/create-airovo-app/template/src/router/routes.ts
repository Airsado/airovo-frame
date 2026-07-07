import type { RouteRecordRaw } from 'vue-router'

/**
 * Static glob of route modules.
 *
 * Vite requires a literal first argument; keep this file at the route
 * layer so Vite can statically analyse the pattern.
 */
export default import.meta.glob<RouteRecordRaw>(
    './routes/modules/*.ts',
    { eager: false },
)
