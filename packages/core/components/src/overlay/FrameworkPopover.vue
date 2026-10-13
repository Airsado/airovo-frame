<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@airovo/uikit-shadcnui/components/ui/popover";

defineOptions({ name: "FrameworkPopover" });

const props = withDefaults(
  defineProps<{
    open?: boolean;
    defaultOpen?: boolean;
    modal?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    alignOffset?: number;
    disabled?: boolean;
    triggerClass?: string;
    contentClass?: string;
  }>(),
  {
    modal: false,
    side: "bottom",
    align: "center",
    sideOffset: 4,
    alignOffset: 0,
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
}>();

function updateOpen(value: boolean): void {
  emit("update:open", value);
}
</script>

<template>
  <Popover
    v-if="props.open !== undefined"
    :open="props.open"
    :modal="props.modal"
    @update:open="updateOpen"
  >
    <PopoverTrigger as-child
      ><button
        type="button"
        :disabled="props.disabled"
        :class="['inline-flex', props.triggerClass]"
      >
        <slot name="trigger" /></button
    ></PopoverTrigger>
    <PopoverContent
      :side="props.side"
      :align="props.align"
      :side-offset="props.sideOffset"
      :align-offset="props.alignOffset"
      :class="[
        'w-72 gap-2.5 rounded-lg border-0 p-2.5 shadow-md ring-1 ring-foreground/10',
        props.contentClass,
      ]"
      data-slot="framework-popover-content"
      ><slot
    /></PopoverContent>
  </Popover>
  <Popover
    v-else
    :default-open="props.defaultOpen"
    :modal="props.modal"
    @update:open="updateOpen"
  >
    <PopoverTrigger as-child
      ><button
        type="button"
        :disabled="props.disabled"
        :class="['inline-flex', props.triggerClass]"
      >
        <slot name="trigger" /></button
    ></PopoverTrigger>
    <PopoverContent
      :side="props.side"
      :align="props.align"
      :side-offset="props.sideOffset"
      :align-offset="props.alignOffset"
      :class="[
        'w-72 gap-2.5 rounded-lg border-0 p-2.5 shadow-md ring-1 ring-foreground/10',
        props.contentClass,
      ]"
      data-slot="framework-popover-content"
      ><slot
    /></PopoverContent>
  </Popover>
</template>
