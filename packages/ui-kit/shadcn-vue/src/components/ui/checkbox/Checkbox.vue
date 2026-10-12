<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { CheckIcon } from '@radix-icons/vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
const props=defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>();const emits=defineEmits<CheckboxRootEmits>();const forwarded=useForwardPropsEmits(reactiveOmit(props,'class'))
</script><template><CheckboxRoot data-slot="checkbox" v-bind="forwarded" :class="cn('border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 size-4 shrink-0 rounded-[4px] border shadow-xs outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',props.class)"><CheckboxIndicator data-slot="checkbox-indicator" class="flex items-center justify-center text-current"><slot><CheckIcon class="size-3.5" /></slot></CheckboxIndicator></CheckboxRoot></template>
