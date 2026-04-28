# TailwindCSS v4 常用 Utility Classes 範例集

> 來源：https://tailwindcss.com/docs | v4.x

## 目錄
1. [顏色系統](#1-顏色系統)
2. [間距（Spacing）](#2-間距-spacing)
3. [排版（Typography）](#3-排版-typography)
4. [Flexbox](#4-flexbox)
5. [Grid](#5-grid)
6. [尺寸（Sizing）](#6-尺寸-sizing)
7. [邊框（Border）](#7-邊框-border)
8. [陰影（Shadow）](#8-陰影-shadow)
9. [背景（Background）](#9-背景-background)
10. [過渡與動畫（Transition & Animation）](#10-過渡與動畫-transition--animation)
11. [3D Transforms（v4 新增）](#11-3d-transforms-v4-新增)
12. [互動（Interaction）](#12-互動-interaction)
13. [Container Queries 實戰](#13-container-queries-實戰)
14. [常用 UI 模式](#14-常用-ui-模式)

---

## 1. 顏色系統

### 背景色

```html
<!-- 標準色板 -->
<div class="bg-blue-500"></div>
<div class="bg-red-600"></div>
<div class="bg-gray-100"></div>

<!-- 透明度修飾符 -->
<div class="bg-blue-500/50"></div>     <!-- 50% 透明度 -->
<div class="bg-blue-500/[0.35]"></div> <!-- 35% 透明度（任意值） -->

<!-- 任意值 -->
<div class="bg-[#1da1f2]"></div>
<div class="bg-[oklch(0.72_0.11_178)]"></div>

<!-- CSS 變數（v4 語法） -->
<div class="bg-(--brand-color)"></div>
```

### 文字色

```html
<p class="text-gray-900 dark:text-gray-100">正文</p>
<p class="text-blue-600 hover:text-blue-800">連結</p>
<p class="text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">漸層文字</p>
```

### 邊框色

```html
<div class="border border-gray-300 focus-within:border-blue-500">...</div>
```

### 漸層

```html
<!-- 線性漸層 -->
<div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
<div class="bg-gradient-to-br from-green-400 to-blue-600"></div>

<!-- 任意角度 -->
<div class="bg-[linear-gradient(45deg,#3b82f6,#8b5cf6)]"></div>

<!-- 帶透明度 -->
<div class="bg-gradient-to-b from-black/50 to-transparent"></div>
```

---

## 2. 間距（Spacing）

v4 間距系統：1 unit = 0.25rem（預設）。

### Margin

```html
<div class="m-4">          <!-- margin: 1rem --></div>
<div class="mx-auto">      <!-- margin-left/right: auto --></div>
<div class="mt-8 mb-4">   <!-- margin-top: 2rem, margin-bottom: 1rem --></div>
<div class="ms-2">         <!-- margin-inline-start（RTL 安全） --></div>
<div class="-mt-4">        <!-- margin-top: -1rem --></div>
```

### Padding

```html
<div class="p-4">          <!-- padding: 1rem --></div>
<div class="px-6 py-3">   <!-- 水平 1.5rem, 垂直 0.75rem --></div>
<div class="pt-12">        <!-- padding-top: 3rem --></div>
```

### Gap

```html
<div class="flex gap-4">          <!-- column-gap: 1rem --></div>
<div class="grid gap-x-8 gap-y-4"><!-- column-gap: 2rem, row-gap: 1rem --></div>
```

### Space Between

```html
<!-- 注意：v4 space-y 選擇器改為 :not(:last-child)，建議改用 gap -->
<div class="flex flex-col space-y-4">...</div>
```

---

## 3. 排版（Typography）

### 字體大小

```html
<p class="text-xs">12px</p>
<p class="text-sm">14px</p>
<p class="text-base">16px（預設）</p>
<p class="text-lg">18px</p>
<p class="text-xl">20px</p>
<p class="text-2xl">24px</p>
<p class="text-3xl">30px</p>
<p class="text-4xl">36px</p>
<p class="text-5xl md:text-7xl">響應式標題</p>
```

### 字體粗細

```html
<p class="font-thin">100</p>
<p class="font-light">300</p>
<p class="font-normal">400</p>
<p class="font-medium">500</p>
<p class="font-semibold">600</p>
<p class="font-bold">700</p>
<p class="font-extrabold">800</p>
<p class="font-black">900</p>
```

### 行高、字距、字型

```html
<p class="leading-tight">line-height: 1.25</p>
<p class="leading-normal">line-height: 1.5</p>
<p class="leading-loose">line-height: 2</p>
<p class="tracking-tight">letter-spacing: -0.025em</p>
<p class="tracking-wide">letter-spacing: 0.025em</p>
<p class="font-sans">無襯線</p>
<p class="font-serif">有襯線</p>
<p class="font-mono">等寬</p>
```

### 文字對齊與裝飾

```html
<p class="text-left">左對齊</p>
<p class="text-center">置中</p>
<p class="text-right">右對齊</p>
<p class="text-justify">兩端對齊</p>
<a class="underline decoration-blue-500 decoration-2">帶顏色底線</a>
<p class="line-through">刪除線</p>
<p class="no-underline">移除底線</p>
```

### 文字截斷

```html
<p class="truncate">超出截斷（單行）...</p>
<p class="line-clamp-3">多行截斷，超過 3 行...</p>
<p class="overflow-hidden text-ellipsis whitespace-nowrap">...</p>
```

### Typography Plugin（prose）

```html
<!-- 安裝：npm install -D @tailwindcss/typography -->
<!-- CSS：@plugin "@tailwindcss/typography"; -->

<article class="prose lg:prose-xl dark:prose-invert max-w-none">
  <!-- Markdown 渲染內容自動套用排版樣式 -->
</article>

<article class="prose prose-blue">
  <!-- 連結等元素使用藍色系 -->
</article>

<div class="prose">
  <h1>標題</h1>
  <div class="not-prose">
    <!-- 這個區塊不套用 prose 樣式 -->
  </div>
</div>
```

---

## 4. Flexbox

```html
<!-- 基礎 Flex 容器 -->
<div class="flex items-center justify-between gap-4">
  <span>左側</span>
  <span>右側</span>
</div>

<!-- 垂直排列 -->
<div class="flex flex-col items-stretch gap-2">
  <div>上</div>
  <div>下</div>
</div>

<!-- Flex 換行 -->
<div class="flex flex-wrap gap-3">
  <div class="basis-1/3">...</div>
  <div class="basis-1/3">...</div>
</div>

<!-- Flex 子項目控制 -->
<div class="flex">
  <div class="flex-1">彈性增長填充</div>    <!-- flex: 1 1 0% -->
  <div class="flex-none w-32">固定寬度</div>  <!-- flex: none -->
  <div class="shrink-0">不縮小</div>
  <div class="grow">可增長</div>
</div>

<!-- 排序 -->
<div class="flex">
  <div class="order-last">最後顯示</div>
  <div class="order-first">最先顯示</div>
  <div class="order-2">第二</div>
</div>

<!-- 對齊變體 -->
<div class="flex items-start">    <!-- align-items: flex-start --></div>
<div class="flex items-center">   <!-- align-items: center --></div>
<div class="flex items-end">      <!-- align-items: flex-end --></div>
<div class="flex justify-start">  <!-- justify-content: flex-start --></div>
<div class="flex justify-center"> <!-- justify-content: center --></div>
<div class="flex justify-end">    <!-- justify-content: flex-end --></div>
<div class="flex justify-around"> <!-- justify-content: space-around --></div>
<div class="flex justify-evenly"> <!-- justify-content: space-evenly --></div>
```

---

## 5. Grid

```html
<!-- 固定列數 -->
<div class="grid grid-cols-3 gap-4">
  <div>1</div><div>2</div><div>3</div>
</div>

<!-- 響應式 Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  ...
</div>

<!-- 跨列 -->
<div class="grid grid-cols-6 gap-4">
  <div class="col-span-4">佔 4 列</div>
  <div class="col-span-2">佔 2 列</div>
  <div class="col-start-2 col-span-3">從第 2 列開始佔 3 列</div>
</div>

<!-- 跨行 -->
<div class="grid grid-rows-3 grid-flow-col">
  <div class="row-span-2">跨 2 行</div>
  ...
</div>

<!-- Auto-fill / Auto-fit -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
  ...
</div>

<!-- 自動行列 -->
<div class="grid auto-cols-fr grid-flow-col">
  <div>自動列寬</div>
</div>

<!-- 子網格（subgrid） -->
<div class="grid grid-cols-4">
  <div class="col-span-3 grid grid-cols-subgrid">
    <div class="col-span-2">...</div>
  </div>
</div>
```

---

## 6. 尺寸（Sizing）

### 寬高

```html
<div class="w-64">        <!-- width: 16rem --></div>
<div class="w-full">      <!-- width: 100% --></div>
<div class="w-screen">    <!-- width: 100vw --></div>
<div class="w-1/2">       <!-- width: 50% --></div>
<div class="w-[240px]">   <!-- 任意值 --></div>
<div class="h-48">        <!-- height: 12rem --></div>
<div class="h-screen">    <!-- height: 100vh --></div>
<div class="h-dvh">       <!-- height: 100dvh（動態視口）--></div>
<div class="min-h-screen"><!-- min-height: 100vh --></div>
<div class="max-w-xl mx-auto"><!-- max-width: 36rem, 水平居中 --></div>

<!-- 比例尺寸 -->
<div class="aspect-video"><!-- 16:9 --></div>
<div class="aspect-square"><!-- 1:1 --></div>
<div class="aspect-[4/3]"> <!-- 4:3（任意值）--></div>
```

---

## 7. 邊框（Border）

```html
<!-- 邊框寬度 -->
<div class="border">          <!-- 1px --></div>
<div class="border-2">        <!-- 2px --></div>
<div class="border-t-4">      <!-- top: 4px --></div>
<div class="border-x">        <!-- left + right --></div>

<!-- 邊框顏色（v4 預設 currentColor，需明確設定） -->
<div class="border border-gray-300">灰色邊框</div>
<div class="border border-blue-500/50">半透明藍色邊框</div>

<!-- 圓角 -->
<div class="rounded">         <!-- 0.375rem --></div>
<div class="rounded-md">      <!-- 0.5rem --></div>
<div class="rounded-lg">      <!-- 0.5rem --></div>
<div class="rounded-xl">      <!-- 0.75rem --></div>
<div class="rounded-full">    <!-- 9999px（圓形）--></div>
<div class="rounded-t-lg">    <!-- 上方圓角 --></div>
<div class="rounded-[20px]">  <!-- 任意值 --></div>

<!-- Outline（焦點樣式） -->
<button class="outline-none focus-visible:outline-2 focus-visible:outline-blue-500">按鈕</button>

<!-- Ring（盒子陰影模擬邊框，適合焦點指示） -->
<input class="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

<!-- Divide（兄弟元素之間的分隔線） -->
<div class="divide-y divide-gray-200">
  <div class="py-3">第一行</div>
  <div class="py-3">第二行</div>
</div>
```

---

## 8. 陰影（Shadow）

v4 陰影整體縮小一級（`shadow-sm` = v3 `shadow`）：

```html
<div class="shadow-xs">   <!-- 最小陰影 --></div>
<div class="shadow-sm">   <!-- 小陰影（= v3 shadow）--></div>
<div class="shadow-md">   <!-- 中等陰影 --></div>
<div class="shadow-lg">   <!-- 大陰影 --></div>
<div class="shadow-xl">   <!-- 超大陰影 --></div>
<div class="shadow-2xl">  <!-- 最大陰影 --></div>
<div class="shadow-none"> <!-- 移除陰影 --></div>

<!-- 帶顏色陰影 -->
<div class="shadow-lg shadow-blue-500/50">藍色陰影</div>

<!-- 內嵌陰影 -->
<div class="inset-shadow-sm">...</div>

<!-- Drop Shadow（CSS filter） -->
<img class="drop-shadow-lg">
```

---

## 9. 背景（Background）

```html
<!-- 背景尺寸 -->
<div class="bg-cover">    <!-- background-size: cover --></div>
<div class="bg-contain">  <!-- background-size: contain --></div>

<!-- 背景位置 -->
<div class="bg-center">   <!-- background-position: center --></div>
<div class="bg-top">      <!-- background-position: top --></div>

<!-- 背景重複 -->
<div class="bg-no-repeat"></div>
<div class="bg-repeat-x"></div>

<!-- 背景固定 -->
<div class="bg-fixed">    <!-- parallax 效果 --></div>
<div class="bg-local"></div>

<!-- Blur 濾鏡 -->
<div class="blur-sm">背景模糊</div>
<div class="backdrop-blur-md">背景濾鏡模糊</div>

<!-- 圖片遮罩（mask-image） -->
<div class="mask-image-gradient-to-r">...</div>
```

---

## 10. 過渡與動畫（Transition & Animation）

### 過渡

```html
<!-- 預設過渡 -->
<button class="transition hover:scale-105">
  過渡（color, background-color, border-color, opacity, box-shadow, transform）
</button>

<!-- 僅過渡特定屬性 -->
<div class="transition-colors duration-200">顏色過渡</div>
<div class="transition-transform duration-300 ease-in-out">Transform 過渡</div>
<div class="transition-opacity duration-150">透明度過渡</div>
<div class="transition-all duration-500">全屬性過渡</div>

<!-- 過渡時間 -->
<div class="duration-75">75ms</div>
<div class="duration-150">150ms</div>
<div class="duration-300">300ms</div>
<div class="duration-500">500ms</div>
<div class="duration-700">700ms</div>
<div class="duration-1000">1000ms</div>

<!-- 緩動函數 -->
<div class="ease-linear">線性</div>
<div class="ease-in">加速</div>
<div class="ease-out">減速</div>
<div class="ease-in-out">先加速後減速</div>
```

### Transform

```html
<!-- 縮放 -->
<div class="hover:scale-105">放大 5%</div>
<div class="hover:scale-x-110">水平放大 10%</div>

<!-- 旋轉 -->
<div class="rotate-45">旋轉 45 度</div>
<div class="hover:-rotate-6">懸停逆時針 6 度</div>

<!-- 位移 -->
<div class="translate-x-4">水平位移 1rem</div>
<div class="hover:-translate-y-1">懸停上移 0.25rem</div>

<!-- Transform origin -->
<div class="origin-top-left scale-90">以左上角縮放</div>
```

### 動畫

```html
<div class="animate-spin">旋轉（載入中）</div>
<div class="animate-ping">脈衝（通知徽章）</div>
<div class="animate-pulse">淡入淡出（骨架屏）</div>
<div class="animate-bounce">彈跳（下滑提示）</div>

<!-- 動畫暫停 -->
<div class="animate-spin hover:paused">懸停暫停</div>

<!-- @starting-style 進場動畫（v4 新增） -->
<div class="transition-discrete starting:opacity-0 opacity-100 starting:scale-95 scale-100">
  進場動畫
</div>
```

---

## 11. 3D Transforms（v4 新增）

```html
<!-- 啟用 3D 空間 -->
<div class="perspective-distant transform-3d">
  <div class="rotate-x-45">X 軸旋轉</div>
</div>

<!-- perspective 值 -->
<div class="perspective-near">近（250px）</div>
<div class="perspective-normal">正常（500px）</div>
<div class="perspective-midrange">中（800px）</div>
<div class="perspective-distant">遠（1200px）</div>

<!-- 3D 旋轉 -->
<div class="rotate-x-12">X 軸旋轉 12 度</div>
<div class="rotate-y-6">Y 軸旋轉 6 度</div>
<div class="rotate-z-45">Z 軸旋轉（等同 rotate-45）</div>

<!-- 3D 縮放 -->
<div class="scale-z-150">Z 軸縮放 1.5 倍</div>

<!-- 3D 位移 -->
<div class="translate-z-8">Z 軸位移</div>

<!-- 翻轉卡片範例 -->
<div class="perspective-normal" style="perspective-origin: center;">
  <div class="transform-3d transition-transform duration-500 hover:rotate-y-180 relative">
    <div class="backface-hidden">正面</div>
    <div class="backface-hidden rotate-y-180 absolute inset-0">背面</div>
  </div>
</div>
```

---

## 12. 互動（Interaction）

```html
<!-- 游標 -->
<div class="cursor-pointer">手指游標</div>
<div class="cursor-not-allowed">禁止游標</div>
<div class="cursor-grab active:cursor-grabbing">抓取游標</div>

<!-- 使用者選取 -->
<div class="select-none">不可選取</div>
<div class="select-all">點擊全選</div>
<div class="select-text">可選取</div>

<!-- 指標事件 -->
<div class="pointer-events-none">不接收滑鼠事件</div>
<div class="pointer-events-auto">接收滑鼠事件（還原）</div>

<!-- Resize -->
<textarea class="resize-none">不可縮放</textarea>
<textarea class="resize-y">垂直縮放</textarea>

<!-- Scroll -->
<div class="overflow-auto">可捲動</div>
<div class="overflow-hidden">隱藏溢出</div>
<div class="overflow-x-scroll overflow-y-hidden">僅水平捲動</div>
<div class="scroll-smooth">平滑捲動</div>

<!-- Scroll Snap -->
<div class="overflow-x-scroll snap-x snap-mandatory">
  <div class="snap-start">第一個停點</div>
  <div class="snap-center">居中停點</div>
</div>

<!-- 顯示 / 可見性 -->
<div class="hidden">display: none</div>
<div class="invisible">visibility: hidden（佔位）</div>
<div class="visible">visibility: visible（還原）</div>
<div class="opacity-0">透明但存在</div>
```

---

## 13. Container Queries 實戰

```html
<!-- 基礎：根據容器寬度顯示不同列數 -->
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 gap-4">
    <div>卡片</div>
  </div>
</div>

<!-- 命名容器 -->
<aside class="@container/sidebar w-64">
  <nav class="flex flex-col @sm/sidebar:flex-row gap-2">
    <a href="#">連結</a>
  </nav>
</aside>

<!-- 巢狀容器 -->
<div class="@container/outer">
  <div class="@container/inner @sm/outer:flex">
    <p class="@xs/inner:text-lg">文字</p>
  </div>
</div>

<!-- 任意容器查詢值 -->
<div class="@container">
  <div class="@[720px]:grid-cols-3">...</div>
</div>

<!-- 最大寬度容器查詢 -->
<div class="@container">
  <div class="grid-cols-3 @max-lg:grid-cols-2 @max-sm:grid-cols-1">...</div>
</div>
```

---

## 14. 常用 UI 模式

### 卡片元件

```html
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
  <img class="w-full h-48 object-cover" src="...">
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">標題</h3>
    <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">描述文字</p>
    <button class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
      操作
    </button>
  </div>
</div>
```

### 表單輸入

```html
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-gray-700">標籤</label>
  <input
    class="px-3 py-2 border border-gray-300 rounded-lg text-sm
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
           invalid:border-red-500 invalid:ring-red-500
           disabled:opacity-50 disabled:cursor-not-allowed"
    type="email"
    placeholder="you@example.com"
  >
  <p class="text-xs text-red-500 hidden peer-invalid:block">格式不正確</p>
</div>
```

### 導覽列

```html
<nav class="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
  <a href="/" class="font-bold text-xl text-gray-900">Logo</a>
  <div class="hidden md:flex items-center gap-6">
    <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">首頁</a>
    <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">關於</a>
  </div>
  <button class="md:hidden p-2 rounded-md hover:bg-gray-100">
    <svg class="w-5 h-5">...</svg>
  </button>
</nav>
```

### Badge / 徽章

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  成功
</span>
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-600/20">
  <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
  進行中
</span>
```

### 骨架屏（Skeleton）

```html
<div class="animate-pulse flex flex-col gap-3">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-32 bg-gray-200 rounded"></div>
  <div class="flex gap-3">
    <div class="h-4 bg-gray-200 rounded flex-1"></div>
    <div class="h-4 bg-gray-200 rounded flex-1"></div>
  </div>
</div>
```

### 下拉選單

```html
<div class="relative group">
  <button class="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900">
    選單 <svg class="w-4 h-4 group-open:rotate-180 transition-transform">...</svg>
  </button>
  <div class="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-md border border-gray-200
              opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg">選項一</a>
    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg">選項二</a>
  </div>
</div>
```
