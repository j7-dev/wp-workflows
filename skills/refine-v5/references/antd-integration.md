# Refine v5 Ant Design Integration Reference

> Source: https://refine.dev/core/docs/ui-integrations/ant-design/
> Package: `@refinedev/antd` ^6.x

## Table of Contents

- [Setup](#setup)
- [useTable](#usetable)
- [useForm](#useform)
- [useModalForm](#usemodalform)
- [useDrawerForm](#usedrawerform)
- [useStepsForm](#usestepsform)
- [useEditableTable](#useeditabletable)
- [useSelect](#useselect)
- [useSimpleList](#usesimplelist)
- [View Components](#view-components)
- [Button Components](#button-components)
- [Field Components](#field-components)
- [Layout Components](#layout-components)
- [Other Hooks](#other-hooks)

---

## Setup

```tsx
import "@refinedev/antd/dist/reset.css";  // Required CSS reset
import { ConfigProvider, App as AntdApp } from "antd";
import { RefineThemes, useNotificationProvider, ThemedLayout } from "@refinedev/antd";

<ConfigProvider theme={RefineThemes.Blue}>
  <AntdApp>
    <Refine
      notificationProvider={useNotificationProvider}
      // ...
    >
      <Routes>
        <Route element={<ThemedLayout><Outlet /></ThemedLayout>}>
          {/* routes */}
        </Route>
      </Routes>
    </Refine>
  </AntdApp>
</ConfigProvider>
```

Available themes: `RefineThemes.Blue`, `RefineThemes.Green`, etc.

---

## useTable

Returns Ant Design `<Table>` compatible props. Extends core `useTable`.

```tsx
import { useTable, List, getDefaultSortOrder, FilterDropdown } from "@refinedev/antd";
import { Table, Select, Input, Space, Button } from "antd";

const { tableProps, searchFormProps, sorters, filters, tableQuery } = useTable<
  IProduct, HttpError, ISearchVars
>({
  resource: "products",
  syncWithLocation: true,
  pagination: { currentPage: 1, pageSize: 20 },
  sorters: { initial: [{ field: "createdAt", order: "desc" }] },
  filters: {
    initial: [{ field: "status", operator: "eq", value: "active" }],
    permanent: [{ field: "tenantId", operator: "eq", value: tenantId }],
  },
  onSearch: (values) => [
    { field: "title", operator: "contains", value: values.title },
    { field: "category", operator: "eq", value: values.category },
  ],
});
```

**Return Values:**

| Property | Type | Description |
|----------|------|-------------|
| `tableProps` | `TableProps<TData>` | Spread onto `<Table>`: dataSource, loading, pagination, onChange |
| `searchFormProps` | `FormProps` | Spread onto search `<Form>` for `onSearch` |
| `tableQuery` | `QueryObserverResult` | Raw query result |
| `sorters` | `CrudSorting` | Current sort state |
| `setSorters` | `fn` | Update sort state |
| `filters` | `CrudFilters` | Current filter state |
| `setFilters` | `fn` | Update filter state (merge or replace) |
| `currentPage` / `setCurrentPage` | `number` / `fn` | Pagination |
| `pageSize` / `setPageSize` | `number` / `fn` | Page size |
| `pageCount` | `number` | Total pages |

**Usage with Table:**

```tsx
<List>
  <Table {...tableProps} rowKey="id">
    <Table.Column dataIndex="id" title="ID" sorter
      defaultSortOrder={getDefaultSortOrder("id", sorters)} />
    <Table.Column dataIndex="name" title="Name" sorter />
    <Table.Column dataIndex="category" title="Category"
      filterDropdown={(props) => (
        <FilterDropdown {...props}>
          <Select
            mode="multiple"
            options={categoryOptions}
            placeholder="Filter by category"
          />
        </FilterDropdown>
      )} />
    <Table.Column title="Actions"
      render={(_, record) => (
        <Space>
          <EditButton hideText size="small" recordItemId={record.id} />
          <ShowButton hideText size="small" recordItemId={record.id} />
          <DeleteButton hideText size="small" recordItemId={record.id} />
        </Space>
      )} />
  </Table>
</List>
```

---

## useForm

Manages Ant Design Form state. Extends core `useForm`.

```tsx
import { useForm, Edit } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

const { formProps, saveButtonProps, form, query, mutation, formLoading } = useForm<
  IProduct, HttpError, IFormValues
>({
  action: "edit",        // "create" | "edit" | "clone"
  resource: "products",
  id: productId,
  redirect: "show",
  mutationMode: "optimistic",
  warnWhenUnsavedChanges: true,
  autoSave: { enabled: true, debounce: 2000 },
  defaultFormValues: async () => {
    // fetch initial values
    return { status: "draft" };
  },
});
```

**Return Values:**

| Property | Type | Description |
|----------|------|-------------|
| `formProps` | `FormProps` | Spread onto `<Form>`: onFinish, initialValues, etc. |
| `saveButtonProps` | `ButtonProps` | Spread onto `<SaveButton>`: disabled, loading, onClick |
| `form` | `FormInstance` | Ant Design form instance for direct manipulation |
| `query` | `QueryObserverResult` | Fetched record data (edit/clone) |
| `mutation` | `UseMutationResult` | Mutation state |
| `formLoading` | `boolean` | Loading state |
| `id` / `setId` | `BaseKey` / setter | Record ID management |
| `autoSaveProps` | `{ status, data?, error? }` | Auto-save state |
| `defaultFormValuesLoading` | `boolean` | Async defaults loading |

**Usage:**

```tsx
<Edit saveButtonProps={saveButtonProps}>
  <Form {...formProps} layout="vertical">
    <Form.Item label="Name" name="name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Category" name="categoryId">
      <Select {...categorySelectProps} />
    </Form.Item>
  </Form>
</Edit>
```

---

## useModalForm

Form in Modal. Extends `useForm`.

```tsx
import { useModalForm } from "@refinedev/antd";
import { Modal, Form, Input } from "antd";

const {
  modalProps,      // title, visible, onOk, onCancel, width, forceRender
  formProps,       // onFinish, initialValues
  show,            // show() for create, show(id) for edit
  close,
  open,            // boolean
  form,
  saveButtonProps,
} = useModalForm<IProduct>({
  action: "create",
  autoSubmitClose: true,   // close after submit (default: true)
  autoResetForm: true,     // reset after submit (default: true)
  syncWithLocation: true,  // sync open/close with URL
});

// Trigger
<Button onClick={() => show()}>Create</Button>
<Button onClick={() => show(record.id)}>Edit</Button>

// Modal
<Modal {...modalProps}>
  <Form {...formProps} layout="vertical">
    <Form.Item name="name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
  </Form>
</Modal>
```

---

## useDrawerForm

Form in Drawer. Extends `useForm`.

```tsx
import { useDrawerForm } from "@refinedev/antd";
import { Drawer, Form, Input } from "antd";

const {
  drawerProps,     // width, onClose, open, forceRender
  formProps,
  show,
  close,
  saveButtonProps,
  deleteButtonProps,
} = useDrawerForm<IProduct>({
  action: "edit",
  resource: "products",
  syncWithLocation: true,
});

<Drawer {...drawerProps}>
  <Edit saveButtonProps={saveButtonProps} deleteButtonProps={deleteButtonProps}>
    <Form {...formProps} layout="vertical">
      <Form.Item name="name"><Input /></Form.Item>
    </Form>
  </Edit>
</Drawer>
```

---

## useStepsForm

Multi-step form. Extends `useForm`.

```tsx
import { useStepsForm, Create, SaveButton } from "@refinedev/antd";
import { Form, Input, Steps, Button } from "antd";

const {
  current,         // current step index (0-based)
  gotoStep,        // (step: number) => void
  stepsProps,      // Ant Design Steps props
  formProps,
  saveButtonProps,
  form,
} = useStepsForm<IProduct>({
  defaultCurrent: 0,
  isBackValidate: false,  // validate when going back
  autoSave: { enabled: true, debounce: 1000 },
});

const formSteps = [
  <Form.Item name="title" label="Title"><Input /></Form.Item>,
  <Form.Item name="content" label="Content"><Input.TextArea /></Form.Item>,
];

<Create
  footerButtons={
    <>
      {current > 0 && <Button onClick={() => gotoStep(current - 1)}>Previous</Button>}
      {current < formSteps.length - 1 && <Button onClick={() => gotoStep(current + 1)}>Next</Button>}
      {current === formSteps.length - 1 && <SaveButton {...saveButtonProps} />}
    </>
  }
>
  <Steps {...stepsProps}>
    <Steps.Step title="About" />
    <Steps.Step title="Content" />
  </Steps>
  <Form {...formProps} layout="vertical">
    {formSteps[current]}
  </Form>
</Create>
```

---

## useEditableTable

Inline table editing. Extends `useTable` + form management.

```tsx
import { useEditableTable, List, SaveButton } from "@refinedev/antd";
import { Table, Form, Input, Space, Button } from "antd";

const {
  tableProps,
  formProps,
  isEditing,         // (id: BaseKey) => boolean
  setId,             // (id: BaseKey | undefined) => void -- set editing row
  saveButtonProps,
  cancelButtonProps,
  editButtonProps,   // (id: BaseKey) => ButtonProps
} = useEditableTable<IPost>();

<List>
  <Form {...formProps}>
    <Table {...tableProps} rowKey="id"
      onRow={(record) => ({ onClick: () => { if (!isEditing(record.id)) setId(record.id); } })}
    >
      <Table.Column dataIndex="title" title="Title"
        render={(value, record) =>
          isEditing(record.id) ? (
            <Form.Item name="title" style={{ margin: 0 }}>
              <Input />
            </Form.Item>
          ) : value
        } />
      <Table.Column title="Actions"
        render={(_, record) =>
          isEditing(record.id) ? (
            <Space>
              <SaveButton {...saveButtonProps} size="small" />
              <Button {...cancelButtonProps} size="small">Cancel</Button>
            </Space>
          ) : (
            <EditButton {...editButtonProps(record.id)} size="small" />
          )
        } />
    </Table>
  </Form>
</List>
```

---

## useSelect

Ant Design `<Select>` integration. Extends core `useSelect`.

```tsx
import { useSelect } from "@refinedev/antd";
import { Select } from "antd";

const { selectProps, query } = useSelect<ICategory>({
  resource: "categories",
  optionLabel: "title",
  optionValue: "id",
  defaultValue: [1, 2],
  debounce: 300,
  onSearch: (value) => [
    { field: "title", operator: "contains", value },
  ],
  pagination: { pageSize: 50 },
});

<Select
  placeholder="Select category"
  style={{ width: 300 }}
  {...selectProps}
/>
```

Returns `selectProps` (Ant Design Select compatible) instead of raw `options`.

---

## useSimpleList

List display without table (cards, tiles). Returns Ant Design `<List>` props.

```tsx
import { useSimpleList } from "@refinedev/antd";
import { List as AntdList } from "antd";

const { listProps, query, currentPage, setCurrentPage } = useSimpleList<IProduct>({
  resource: "products",
  pagination: { pageSize: 12 },
  sorters: { initial: [{ field: "createdAt", order: "desc" }] },
});

<AntdList {...listProps}
  renderItem={(item) => (
    <AntdList.Item>
      <Card title={item.name}>{item.description}</Card>
    </AntdList.Item>
  )}
/>
```

---

## View Components

CRUD page containers with built-in buttons and breadcrumbs.

### List

```tsx
import { List } from "@refinedev/antd";

<List
  title="Products"                    // custom title
  canCreate={true}                    // show create button
  createButtonProps={{ size: "large" }}
  breadcrumb={<CustomBreadcrumb />}
  headerButtons={[<CustomButton />]}
>
  <Table />
</List>
```

### Show

```tsx
import { Show } from "@refinedev/antd";

<Show
  title="Product Details"
  canEdit={true}              // show edit button
  canDelete={true}            // show delete button
  isLoading={isLoading}
>
  {/* content */}
</Show>
```

### Edit

```tsx
import { Edit } from "@refinedev/antd";

<Edit
  saveButtonProps={saveButtonProps}
  deleteButtonProps={deleteButtonProps}
  isLoading={formLoading}
  canDelete={true}
>
  <Form />
</Edit>
```

### Create

```tsx
import { Create } from "@refinedev/antd";

<Create saveButtonProps={saveButtonProps}>
  <Form />
</Create>
```

---

## Button Components

Pre-built action buttons with access control integration.

```tsx
import {
  CreateButton, EditButton, DeleteButton, ShowButton, CloneButton,
  ListButton, RefreshButton, SaveButton, ExportButton, ImportButton,
} from "@refinedev/antd";

// All buttons accept:
//   resource?: string
//   recordItemId?: BaseKey
//   hideText?: boolean
//   accessControl?: { enabled?: boolean; hideIfUnauthorized?: boolean }

<EditButton recordItemId={record.id} />
<DeleteButton recordItemId={record.id} />
<ShowButton recordItemId={record.id} hideText size="small" />
<CreateButton resource="products" />
<CloneButton recordItemId={record.id} />
<RefreshButton recordItemId={record.id} />
<ListButton resource="products" />
<SaveButton {...saveButtonProps} />
<ExportButton onClick={triggerExport} loading={isExporting} />
<ImportButton {...importInputProps} />
```

---

## Field Components

Display-only components for show pages.

```tsx
import {
  TextField, NumberField, BooleanField, DateField,
  EmailField, UrlField, MarkdownField, TagField,
  FileField, ImageField,
} from "@refinedev/antd";

<TextField value={record.name} />
<NumberField value={record.price} options={{ style: "currency", currency: "USD" }} />
<BooleanField value={record.isActive} />
<DateField value={record.createdAt} format="YYYY-MM-DD HH:mm" />
<EmailField value={record.email} />
<UrlField value={record.website} />
<MarkdownField value={record.description} />
<TagField value="Published" color="green" />
<FileField src={record.fileUrl} title="Download" />
<ImageField value={record.imageUrl} width={200} />
```

---

## Layout Components

```tsx
import {
  ThemedLayout,   // Full layout with sider, header, content
  ThemedSider,    // Sidebar navigation
  ThemedHeader,   // Header with title and user info
  ThemedTitle,    // App title component
} from "@refinedev/antd";

// Default usage
<ThemedLayout>
  <Outlet />
</ThemedLayout>

// Customized
<ThemedLayout
  Sider={() => <CustomSider />}
  Header={() => <CustomHeader />}
  Title={({ collapsed }) => <CustomTitle collapsed={collapsed} />}
  Footer={() => <CustomFooter />}
  OffLayoutArea={() => <FloatingWidget />}
>
  <Outlet />
</ThemedLayout>
```

---

## Other Hooks

### useCheckboxGroup

```tsx
import { useCheckboxGroup } from "@refinedev/antd";
const { checkboxGroupProps } = useCheckboxGroup({ resource: "tags" });
<Checkbox.Group {...checkboxGroupProps} />
```

### useRadioGroup

```tsx
import { useRadioGroup } from "@refinedev/antd";
const { radioGroupProps } = useRadioGroup({ resource: "categories" });
<Radio.Group {...radioGroupProps} />
```

### useImport

```tsx
import { useImport } from "@refinedev/antd";
const { inputProps, isLoading } = useImport({ resource: "products" });
<ImportButton {...inputProps} loading={isLoading} />
```

### useModal / useDrawer

```tsx
import { useModal, useDrawer } from "@refinedev/antd";
const { modalProps, show, close } = useModal();
const { drawerProps, show: showDrawer, close: closeDrawer } = useDrawer();
```

### getDefaultSortOrder

Helper for Table column `defaultSortOrder`.

```tsx
import { getDefaultSortOrder } from "@refinedev/antd";

<Table.Column
  dataIndex="name"
  sorter
  defaultSortOrder={getDefaultSortOrder("name", sorters)}
/>
```

### FilterDropdown

Wrapper for Table column filter dropdowns.

```tsx
import { FilterDropdown } from "@refinedev/antd";

<Table.Column
  dataIndex="status"
  filterDropdown={(props) => (
    <FilterDropdown {...props}>
      <Select options={statusOptions} style={{ minWidth: 200 }} />
    </FilterDropdown>
  )}
/>
```
