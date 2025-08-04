# TODO - InvApp Pending Tasks

## High Priority Issues

### 1. Fix Pedidos Presentation Data Loading 🔥
**Status:** Pending  
**Priority:** High  
**Description:** Pedidos form is not showing presentation data correctly. Unlike ventas (which shows inventory-filtered presentations), pedidos should show ALL products since it doesn't require inventory validation.

**Technical Details:**
- Pedidos should use `/pedidos/form-data` endpoint without warehouse filtering
- Should display all available presentations/products regardless of stock
- Current issue: `usePedidoOptions.ts` may be filtering presentations incorrectly
- Need to differentiate between venta presentation loading (with stock) vs pedido presentation loading (all products)

**Files to Review:**
- `hooks/pedidos/usePedidoOptions.ts:21-51` - `filterPresentacionesByAlmacen` function
- `services/entities/pedidoService.ts:88-94` - `getFormData` method
- `app/pedidos/create.tsx:250-268` - Presentation display logic

**Expected Behavior:**
- When entering pedidos create/edit, should load ALL presentations
- Warehouse change should not filter presentations (unlike ventas)
- Should show product catalog without inventory constraints

---

## Medium Priority Enhancements

### 2. Implement Global Search Functionality 🔍
**Status:** Pending  
**Priority:** Medium  
**Description:** Add search capabilities to clients table and all other data tables throughout the application.

**Scope:**
- **Clients Table:** Search by name, phone, email, address
- **Products Table:** Search by name, code, description
- **Providers Table:** Search by name, contact info
- **Sales Table:** Search by client name, date range, amount
- **Orders Table:** Search by client name, status, delivery date
- **Users Table:** Search by name, email, role
- **Warehouses Table:** Search by name, location
- **Expenses Table:** Search by description, category, date

**Technical Implementation:**
- Add search input component to `EnhancedDataTable`
- Implement debounced search with `useState` and `useEffect`
- Update API services to support search query parameters
- Add search filters to existing list hooks

**Components to Update:**
- `components/data/EnhancedDataTable.tsx` - Add search input
- All list screens (`app/*/index.tsx`) - Enable search functionality
- Corresponding hooks (`hooks/crud/use*List.tsx`) - Add search parameters

---

### 3. Client Debt Management System 💰
**Status:** Pending  
**Priority:** Medium  
**Description:** Implement comprehensive client debt tracking and management system.

**Features Required:**

#### 3.1 Debt Summary Display
- Show individual client pending balance (`saldo_pendiente`)
- Display total debt amount across all clients
- Real-time debt calculations

#### 3.2 Debt Details Modal
- Clickable debt amount opens modal
- Show all unpaid/partially paid sales for the client
- Display debt breakdown by sale:
  - Sale ID (clickable link to sale detail)
  - Sale date
  - Total amount
  - Paid amount
  - Pending amount
  - Payment status

#### 3.3 Navigation Integration
- Debt amount becomes clickable link/button
- Modal shows list of associated unpaid sales
- Each sale entry links to detailed sale view (`app/ventas/[id].tsx`)

**Technical Implementation:**

**Database/API Requirements:**
- Ensure `clientes` table has accurate `saldo_pendiente` field
- API endpoint: `GET /clientes/{id}/deudas` - List unpaid sales for client
- API endpoint: `GET /deudas/total` - Total debt across all clients

**Frontend Components:**
- `components/DebtSummaryModal.tsx` - Modal showing client debt details
- `components/DebtAmount.tsx` - Clickable debt amount component
- Update `app/clientes/index.tsx` - Add debt summary and clickable amounts
- Update `app/clientes/[id].tsx` - Show detailed debt information

**State Management:**
- Add debt loading states to client hooks
- Implement debt calculation utilities
- Add debt-related error handling

**UI/UX Specifications:**
- Debt amounts shown in currency format
- Color coding: Green (no debt), Yellow (low debt), Red (high debt)
- Loading states for debt calculations
- Easy navigation between debt modal and sale details

---

## Technical Debt & Improvements

### 4. Standardize Search Patterns
**Status:** Pending  
**Priority:** Low  
**Description:** Create reusable search components and patterns for consistent search experience across all tables.

**Implementation:**
- `components/search/SearchInput.tsx` - Reusable search component
- `hooks/core/useSearch.ts` - Generic search hook with debouncing
- Standardize search API parameter naming

### 5. Enhanced Error Handling
**Status:** Pending  
**Priority:** Low  
**Description:** Improve error handling for debt-related operations and search functionality.

**Implementation:**
- Add specific error messages for debt calculations
- Handle search timeout scenarios
- Implement retry mechanisms for failed debt queries

---

## Notes for Implementation

### Development Priority Order:
1. **Fix Pedidos Presentation Loading** - Critical for basic functionality
2. **Client Debt Management** - High business value feature  
3. **Global Search** - User experience improvement
4. **Technical Debt Items** - Code quality and maintainability

### Testing Requirements:
- Unit tests for debt calculation logic
- Integration tests for search functionality
- E2E tests for debt modal navigation

### Performance Considerations:
- Implement pagination for debt details modal
- Add caching for frequently accessed debt data
- Optimize search queries with proper indexing

---

*Last Updated: January 2025*  
*Next Review: After completing high priority items*