import type { RouteRecordRaw } from 'vue-router'
import type { AgnosticRouteRecord } from './types'

/**
 * Convert an `AgnosticRouteRecord` into a vue-router `RouteRecordRaw`.
 * The `component` lazy-loader is cast to vue-router's `RouteComponent`
 * type — the actual imported module is a `.vue` file whose default
 * export is a Vue component.
 */
function toVueRoute(record: AgnosticRouteRecord): RouteRecordRaw {
    const route: RouteRecordRaw = {
        path: record.path,
        meta: record.meta,
    } as RouteRecordRaw

    if (record.name) route.name = record.name
    if (record.redirect) route.redirect = record.redirect
    if (record.component) {
        route.component = record.component as RouteRecordRaw['component']
    }
    if (record.children) route.children = record.children.map(toVueRoute)

    return route
}

/**
 * Convert an array of agnostic route records to vue-router format.
 */
export function toVueRoutes(records: AgnosticRouteRecord[]): RouteRecordRaw[] {
    return records.map(toVueRoute)
}
