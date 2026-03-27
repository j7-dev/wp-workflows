# 測試撰寫與驗證

## 測試工具

- **框架**：Vitest（搭配 Vite）或 Jest
- **渲染工具**：@testing-library/react
- **使用者互動**：@testing-library/user-event

## 測試原則

1. 測試行為而非實作細節
2. 使用 `screen.getByRole` 等語意化查詢
3. 避免測試 snapshot（除非有明確需求）

## 元件測試範例

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ProductCard', () => {
  it('應在點擊刪除按鈕時呼叫 onDelete', async () => {
    const mockOnDelete = vi.fn()
    const product: TProduct = {
      id: 1,
      name: '測試商品',
      price: 100,
      status: 'publish',
    }

    render(<ProductCard product={product} onDelete={mockOnDelete} />)

    const deleteButton = screen.getByRole('button', { name: /刪除/ })
    await userEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('應在 showActions 為 false 時隱藏操作按鈕', () => {
    render(
      <ProductCard
        product={mockProduct}
        onDelete={vi.fn()}
        showActions={false}
      />,
    )

    expect(screen.queryByRole('button', { name: /刪除/ })).not.toBeInTheDocument()
  })
})
```

## Hook 測試範例

```typescript
import { renderHook, waitFor } from '@testing-library/react'

describe('useProducts', () => {
  it('應回傳商品列表', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: TestWrapper, // 包含必要的 Provider
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toHaveLength(3)
  })
})
```

## 測試檔案路徑慣例

```
js/src/hooks/useProducts.ts
  →  js/src/hooks/__tests__/useProducts.test.ts

js/src/components/product/ProductCard.tsx
  →  js/src/components/product/__tests__/ProductCard.test.tsx
```

---

## 交付前必做步驟

完成功能開發後，**必須**為新增或修改的功能撰寫對應的測試：

- **單元測試**：針對 Custom Hook、工具函式、資料轉換邏輯
- **元件測試**：針對互動元件使用 `@testing-library/react` 撰寫行為測試
- **測試涵蓋範圍**：至少涵蓋主要流程（happy path）與關鍵的錯誤場景（error path）

> 禁止跳過：沒有測試的代碼不得提交審查。若功能性質確實無法撰寫單元測試（如純樣式調整），需在提交審查時說明原因。

### 執行測試清單

在呼叫 reviewer agent 之前，**必須**執行以下測試並確認全數通過：

```bash
# 1. 型別檢查
npx tsc --noEmit

# 2. 代碼風格檢查
npx eslint src/ --ext .ts,.tsx

# 3. 格式化檢查
npx prettier --check "src/**/*.{ts,tsx}"

# 4. 單元測試 / 元件測試
npm test
# 或
npx vitest run
```

> 只有當所有測試全數通過時，才可以進入下一步呼叫 reviewer agent。
