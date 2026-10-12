<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
const props=defineProps<ToggleGroupRootProps & { class?: HTMLAttributes['class'] }>();const emits=defineEmits<ToggleGroupRootEmits>();const forwarded=useForwardPropsEmits(reactiveOmit(props,'class'))
</script><template><ToggleGroupRoot data-slot="toggle-group" v-bind="forwarded" :class="cn('flex items-center justify-center gap-1',props.class)"><slot/></ToggleGroupRoot></template>
