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
    sideOffset?: number;
    delayDuration?: number;
    disabled?: boolean;
    triggerClass?: string;
    contentClass?: string;
  }>(),
  {
    side: "top",
    sideOffset: 4,
    delayDuration: 0,
    disabled: false,
  },
);
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip :disabled="disabled" data-slot="framework-tooltip">
      <TooltipTrigger :disabled="disabled" :class="triggerClass">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipContent
        :side="side"
        :side-offset="sideOffset"
        :class="['max-w-xs break-words text-balance', contentClass]"
        data-slot="framework-tooltip-content"
      >
        <slot name="content">{{ content }}</slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
