# 無障礙（a11y）審查項

延伸檢查項。與主清單互補，PR 涉及 UI 變更時一律納入審查。

---

## 核心 checklist

### Semantic HTML

- [ ] 是否使用語意化標籤（`<button>`、`<nav>`、`<main>`、`<header>`、`<article>`）而非全用 `<div>`（🟠）
- [ ] `<button>` vs `<a>`：觸發動作用 `button`、導航用 `a`（🟠）
- [ ] 表單欄位是否有對應 `<label>` 或 `aria-label`（🟠）
- [ ] heading 層級是否連續（h1 → h2 → h3，不跳級）（🟡）

### 鍵盤可用性

- [ ] 所有可互動元件是否可用 Tab 聚焦（🟠）
- [ ] `tabIndex` 是否只在必要時使用（禁止 `tabIndex={-1}` 隱藏可互動元件）（🟠）
- [ ] Modal / Drawer 是否有 focus trap（開啟時聚焦移入，關閉時還原）（🟠）
- [ ] 自訂元件（如 dropdown、accordion）是否支援鍵盤操作（Enter / Space / Arrow）（🟠）

### ARIA 屬性

- [ ] 動態內容更新是否有 `aria-live`（🟡）
- [ ] 圖示按鈕是否有 `aria-label`（🟠）
- [ ] 狀態類元件是否有 `aria-expanded` / `aria-selected` / `aria-checked`（🟡）
- [ ] `role` 屬性是否正確使用（禁止濫用覆蓋原生語意）（🟠）

### 視覺輔助

- [ ] 文字與背景的色彩對比是否達 WCAG AA（4.5:1 正文、3:1 大字）（🟡）
- [ ] 重要資訊是否僅用色彩呈現（應搭配圖示或文字）（🟠）
- [ ] 圖片是否有 `alt`，裝飾圖是否 `alt=""`（🟠）
- [ ] 按鈕 / 連結的 focus outline 是否保留或取代（禁止 `outline: none` 無替代方案）（🟠）

---

## Before / After 範例

### 圖示按鈕 aria-label

```tsx
// 誤用：僅圖示無文字
<Button icon={<DeleteOutlined />} onClick={handleDelete} />

// 正確
<Button icon={<DeleteOutlined />} onClick={handleDelete} aria-label="刪除商品" />
```

### Modal focus trap（Ant Design 已內建）

```tsx
// Ant Design Modal 預設支援 focus trap，但需確保第一個 focusable element 合理
<Modal open={open} onCancel={onClose}>
  <Input autoFocus placeholder="輸入商品名稱" />  {/* 明確 autoFocus */}
</Modal>
```

### 狀態僅用色彩的陷阱

```tsx
// 誤用：色盲使用者看不出
<Tag color="red">錯誤</Tag>
<Tag color="green">成功</Tag>

// 正確：色彩 + 圖示 + 文字
<Tag color="red" icon={<CloseCircleOutlined />}>錯誤</Tag>
<Tag color="green" icon={<CheckCircleOutlined />}>成功</Tag>
```

### focus outline 保留

```css
/* 誤用 */
button:focus { outline: none; }

/* 正確：自訂但保留視覺回饋 */
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## 常見 Ant Design a11y 注意事項

| 元件 | 注意點 |
|------|--------|
| `Table` | 複雜表格加 `caption` 或 `aria-label`，篩選器需鍵盤可操作 |
| `Form.Item` | `label` 必填；隱藏 label 時用 `label={<span className="sr-only">...</span>}` |
| `Modal` | 確認開啟時 focus 進入 Modal，關閉時還原；`keyboard={true}` 允許 ESC |
| `Dropdown` | 自訂 trigger 時確保 `aria-haspopup` / `aria-expanded` 正確 |
| `Tooltip` | 僅視覺提示不應承載關鍵資訊（螢幕閱讀器使用者看不到） |

---

## 工具

- 手動：鍵盤完整走一次 PR 新增的互動流程
- 自動：`eslint-plugin-jsx-a11y`、Chrome Lighthouse、axe DevTools
- 螢幕閱讀器：macOS VoiceOver、Windows NVDA
