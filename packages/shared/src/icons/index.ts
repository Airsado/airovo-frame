import { addCollection } from '@iconify/vue'
import lucideCollection from './lucide.json'

let registered = false

export function registerLocalIcons(): void {
    if (registered) return
    addCollection(lucideCollection)
    registered = true
}

registerLocalIcons()

export { Icon } from '@iconify/vue'
