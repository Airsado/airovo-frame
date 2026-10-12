<script setup lang="ts">
import type { ToggleGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ToggleGroupItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
const props=defineProps<ToggleGroupItemProps & { class?: HTMLAttributes['class'] }>();const forwarded=useForwardProps(reactiveOmit(props,'class'))
</script><template><ToggleGroupItem data-slot="toggle-group-item" v-bind="forwarded" :class="cn('hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[state=on]:bg-accent data-[state=on]:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',props.class)"><slot/></ToggleGroupItem></template>
