<script setup lang="ts">
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@airovo/uikit-shadcnui";

defineOptions({ name: "FrameworkTooltip" });

withDefaults(
  defineProps<{
    content?: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    alignOffset?: number;
    delayDuration?: number;
    disabled?: boolean;
    triggerClass?: string;
    contentClass?: string;
  }>(),
  {
    side: "top",
    align: "center",
    sideOffset: 4,
    alignOffset: 0,
    delayDuration: 0,
    disabled: false,
  },
);
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip :disabled="disabled" data-slot="framework-tooltip">
      <TooltipTrigger as-child :disabled="disabled" :class="triggerClass">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :align-offset="alignOffset"
        :class="['inline-flex items-center gap-1.5 max-w-xs break-words text-balance', contentClass]"
        data-slot="framework-tooltip-content"
      >
        <slot name="content">{{ content }}</slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
