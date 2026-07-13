<script setup lang="ts">
/**
 * Tree — hierarchical tree with expand/collapse.
 * TODO(v5): recursive expand/collapse, keyboard nav, drag-and-drop.
 */
defineOptions({ name: 'AirovoTree' })
export interface TreeNode {
    id: string | number
    label: string
    children?: TreeNode[]
    [key: string]: any
}
withDefaults(defineProps<{
    data: TreeNode[]
    nodeKey?: string
    childrenKey?: string
    selectable?: boolean
}>(), { nodeKey: 'id', childrenKey: 'children', selectable: true })
</script>
<template>
    <ul class="space-y-0.5 text-sm">
        <li
            v-for="node in data"
            :key="node[nodeKey]"
            class="rounded px-2 py-1 hover:bg-muted/40"
        >
            {{ node.label }}
            <Tree
                v-if="node[childrenKey]?.length"
                :data="node[childrenKey]"
                :node-key="nodeKey"
                :children-key="childrenKey"
                class="ml-3 mt-0.5 border-l pl-2"
            />
        </li>
    </ul>
</template>
