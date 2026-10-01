# @airovo/components

框架级通用组件。这里承载页面容器、数据面板、表格、指标卡、状态徽章，以及基于 new-api 交互封装的 SelectBox、SearchSelect、DatePicker、Drawer 和 FacetedFilter；基础 shadcn-vue 控件仍由 `@airovo/uikit-shadcnui` 原样提供，应用级组合组件放在 `app-ui`。

目录边界保持扁平：`src/date-picker`、`src/drawer`、`src/faceted-filter` 和 `src/toast` 是框架组合组件；`src/select` 是 SelectBox/SearchSelect 组合组件。`src/components/ui` 这类 shadcn registry primitive 只允许出现在 `packages/ui-kit/shadcn-vue`，应通过 shadcn-vue CLI 添加，不在本包复制一份。

布局骨架和主题插槽由 `@airovo/layouts` 提供；通用页面与数据组件只从本包导入，不在布局包保留副本。

## 通知宿主

`FrameworkToaster` 是框架默认的 Sonner 宿主，按 new-api 的根布局约定使用顶部居中、5 秒自动关闭、关闭按钮和彩色语义状态：

```vue
<script setup lang="ts">
import { FrameworkToaster } from '@airovo/components'
</script>

<template>
  <FrameworkToaster />
</template>
```

页面或 composable 通过 `@airovo/composables` 的 `useToast()` 发送提示：

```ts
import { useToast } from '@airovo/composables'

const toast = useToast()
toast.success('保存成功')
toast.error('保存失败')
```
