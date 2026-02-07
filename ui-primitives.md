我会把 `@fictjs/ui-primitives` 定位成 **“可访问性 + 交互行为 + 组合能力”的官方地基**（无样式/可控/SSR 友好），风格类似 Radix 的“compound primitives”：每个模块基本都提供 `Root/Trigger/Content/...` 这套结构，并且同时支持 **controlled / uncontrolled**（`open`/`defaultOpen`/`onOpenChange`、`value`/`defaultValue`/`onValueChange`）。

下面是我认为“官方 headless primitives **应该包含的完整组件集合**”，我按优先级分成 P0/P1/P2（全部都属于“官方范围”，只是落地顺序不同）。

---

## P0 必须先有（没有它们，后面所有 UI 都会重复造轮子/踩坑）

### 1) 基础与组合基建

- **Primitive / Polymorphic**（基础元素包装器：`as`/`asChild`）
- **Slot**（组合与透传 props 的 asChild 机制）
- **Presence**（mount/unmount + 过渡友好：避免动画被卸载打断）
- **Portal / PortalHost**（分层渲染与容器管理）
- **VisuallyHidden**（无障碍隐藏）
- **Separator**（语义分隔）
- **AccessibleIcon**（图标 aria-label 规范化，可选）

### 2) 焦点与“点外关闭”等交互原语（所有 Overlay 都依赖它们）

- **FocusScope / FocusTrap**（焦点圈定、恢复、tab 环）
- **DismissableLayer**（Escape 关闭、pointer/focus outside、层级 stack、嵌套 overlay 协调）
- **RovingFocusGroup**（方向键漫游焦点：Menu/TabList/RadioGroup 等都要用）
- **ScrollLock**（弹层打开时锁滚动 + iOS 兼容）
- **Announce / LiveRegion**（aria-live 播报，用于 toast/form error 等，推荐做成原语）

### 3) 定位原语

- **Popper / Floating**（Anchor/Content/Arrow：Popover/Tooltip/Menu 全部复用）

---

## P0 核心 Overlay 与 Menu（直接决定“能不能做真实应用”）

### 4) Overlay 家族

- **Dialog**（modal / non-modal）
- **AlertDialog**（强制决策弹窗：focus 管理 + 语义更严格）
- **Popover**
- **Tooltip**
- **HoverCard**（可选但强烈建议：比 Tooltip 更像“可交互提示”）

### 5) Menu 家族（务必用同一套 roving+dismiss+popper 地基）

- **DropdownMenu**
- **ContextMenu**
- **Menubar**（桌面应用/后台常用）
- （可选）**Submenu** 作为 DropdownMenu/ContextMenu 的子能力（但通常包含在模块里）

### 6) Toast（很多团队把它当“必须品”）

- **Toast / ToastProvider / ToastViewport**（队列、pause-on-hover、aria-live、手势关闭可选）

---

## P1 高优先级（大多数产品会立刻用到）

### 7) Disclosure / Navigation

- **Tabs**
- **Accordion**
- **Collapsible**（很多组件可由它组合：Disclosure、FAQ、侧边栏分组）
- **NavigationMenu**（如果你们目标是“应用框架级导航”；否则可降到 P2）

### 8) 表单控件（headless 但交互复杂，值得官方做）

- **Label**（与 FormField/Control 绑定更安全）
- **Checkbox**
- **RadioGroup**
- **Switch**
- **Toggle / ToggleGroup**（单选/多选按钮组）
- **Slider**（单值）
- **RangeSlider**（双值，建议直接做，不然后面会很痛）
- **Select**（原生 select 在移动端友好，但很多产品要自定义行为）
- **Combobox / Autocomplete**（搜索下拉，复杂但非常常用）

> 说明：`Input/Textarea` 这种“本质是原生元素”的东西通常不属于 primitives（更适合 shadcn 层做样式）。但 **TextField 原语**很值得提供：用来统一 label/description/error、aria-\*、id 生成、禁用/只读等状态。

### 9) Form 结构原语（强烈建议官方出）

- **Form / Field / Control / Description / Message**（对齐 a11y 与错误展示语义；上层 styled 组件全复用）

---

## P2 进阶与增强（不影响起步，但做出来生态会非常完整）

### 10) 滚动与布局交互

- **ScrollArea**（自定义滚动容器/可控滚动条）
- **ResizablePanel / Splitter**（后台系统很常见，但实现成本高）
- **AspectRatio**（媒体容器，偏轻量）

### 11) 其他可访问性与体验组件

- **Progress**
- **Meter**
- **Skeleton（偏上层，但也可做 headless：只负责 aria-busy 等）**
- **VisuallyHidden**（已在 P0）
- **FocusVisible / KeyboardModeProvider**（区分键鼠交互样式/行为，利于上层组件一致性）

### 12) 高级选择/时间类（除非你们目标是“内建应用套件”，否则可以放很后）

- **DatePicker / Calendar**（其实已经接近“组件库”，不再是纯 primitive）
- **CommandPalette**（类似 cmdk，属于“模式组件”，可选）

---

## 我建议的“官方导出面”规范（避免未来 API 乱）

对所有交互类 primitive，统一遵循这些设计约束：

- **Controlled / uncontrolled 一致**：`value/defaultValue/onValueChange`，`open/defaultOpen/onOpenChange`
- **`asChild` 一致**：所有 Trigger/Close/Item 都支持 Slot 化
- **SSR 稳定 ID**：统一 `useId()`/`id` 注入策略，避免 hydration mismatch
- **事件组合策略一致**：对外暴露 `onPointerDownOutside/onFocusOutside/onEscapeKeyDown` 等“可拦截”事件
