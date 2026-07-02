import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationItem {
    id: string
    title: string
    description?: string
    icon?: string
    type: NotificationType
    read: boolean
    createdAt: number
    meta?: Record<string, unknown>
}

export const useNotificationStore = defineStore('notification', () => {
    const items = ref<NotificationItem[]>([])

    const unreadCount = computed(() => items.value.filter((i) => !i.read).length)

    function add(item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): void {
        items.value.unshift({
            ...item,
            id: crypto.randomUUID(),
            read: false,
            createdAt: Date.now(),
        })
    }

    function markRead(id: string): void {
        const item = items.value.find((i) => i.id === id)
        if (item) item.read = true
    }

    function markAllRead(): void {
        items.value.forEach((i) => (i.read = true))
    }

    function remove(id: string): void {
        const idx = items.value.findIndex((i) => i.id === id)
        if (idx >= 0) items.value.splice(idx, 1)
    }

    function clear(): void {
        items.value = []
    }

    return { items, unreadCount, add, markRead, markAllRead, remove, clear }
})
