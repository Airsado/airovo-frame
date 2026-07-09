# @airovo/design

Branded design tokens + a built-in demo page for the airovo-frame
ecosystem.

## What it provides

- **`tokens`** — a frozen `tokens` object that all packages can import.
  Includes brand, accent, surface, semantic, spacing, radius, shadow,
  font, and z-index scales.
- **`Demo.vue`** — a bespoke design-system showcase (hero, full color
  ramps, type scale, foundational primitives, and feature pillars) driven
  entirely by `tokens`. Drop into a business app as a live token reference.

## Usage

```ts
import { tokens } from '@airovo/design'
console.log(tokens.brand[500]) // '#3461f0'
```

```vue
<script setup>
import Demo from '@airovo/design/demo'
</script>

<template>
    <Demo />
</template>
```
