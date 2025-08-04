# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InvApp** is a React Native inventory management application built with Expo. It provides comprehensive inventory, sales, client, and provider management for businesses. The app supports both mobile (Android/iOS) and web platforms.

## Development Commands

```bash
# Start development server
npm start
npx expo start

# Platform-specific development
npm run android          # Launch on Android
npm run ios             # Launch on iOS  
npm run web             # Launch in browser

# Testing and Quality
npm test                # Run Jest tests
npm run lint            # Run Expo linter

# Utilities
npm run reset-project   # Reset to blank project structure
```

## Architecture Overview

### Technology Stack
- **Framework**: React Native 0.79.2 + Expo 53.0.9
- **Routing**: Expo Router 5.0.7 (file-based routing)
- **Language**: TypeScript 5.3.3 with strict mode
- **State**: React hooks + Context API (AuthContext, AlertContext)
- **API**: REST API with JWT authentication using fetchApi client
- **Charts**: React Native Chart Kit 6.12.0
- **Navigation**: React Navigation 7.0.14

### Project Structure (Updated 2024)
```
app/                    # Expo Router pages (file-based routing)
├── (auth)/            # Authentication group (login, register)
├── (tabs)/            # Main tabbed navigation (dashboard, more)
├── almacenes/         # Warehouse management
├── clientes/          # Client management  
├── gastos/            # Expense management
├── inventarios/       # Inventory management
├── lotes/             # Batch management
├── pagos/             # Payment management
├── pedidos/           # Order management (proyecciones)
├── productos/         # Product management
├── proveedores/       # Provider management
├── reportes/          # Reports and analytics
├── usuarios/          # User management
└── ventas/            # Sales management

components/            # Reusable UI components
├── buttons/          # Button components (ActionButtons, etc.)
├── dashboard/        # Dashboard-specific components
├── data/            # Data display components (EnhancedDataTable, etc.)
├── dialogs/         # Modal dialogs (ConfirmationDialog)
├── form/            # Form components (FormField, FormSelect, etc.)
├── layout/          # Layout components (ScreenContainer)
└── ui/              # Base UI components (Badge, IconSymbol)

hooks/                 # Custom React hooks (Refactored Architecture)
├── core/             # Core reusable hooks (useErrorHandler, etc.)
├── crud/             # Legacy CRUD hooks (being phased out)
├── pedidos/          # Pedidos specialized hooks
│   ├── usePedidoItem.ts      # Main composite hook
│   ├── usePedidoOptions.ts   # Form data & filtering
│   ├── usePedidoForm.ts      # Form state management
│   └── usePedidoCRUD.ts      # API operations & conversion
├── ventas/           # Ventas specialized hooks
│   ├── useVentaItem.ts       # Main composite hook
│   ├── useVentaOptions.ts    # Form data & filtering
│   ├── useVentaForm.ts       # Form state management
│   ├── useVentaCRUD.ts       # API operations
│   └── useVentaCalculations.ts # Business logic
└── reportes/         # Report-specific hooks

services/             # API services (Refactored)
├── core/            # Core API infrastructure
│   ├── apiClient.ts # fetchApi client implementation
│   └── types.ts     # Common API types
├── entities/        # Entity-specific services
│   ├── ventaService.ts     # Venta operations
│   ├── pedidoService.ts    # Pedido operations
│   └── ...         # Other entity services
└── index.ts         # Service exports

models/             # TypeScript data models
context/            # React context providers
utils/              # Utility functions
styles/             # Theme and styling (centralized Theme.ts)
```

### Data Models
Core entities managed by the application:
- **Products** & **Presentaciones**: Product catalog with different presentations/sizes
- **Inventory**: Stock tracking by warehouse and batch
- **Sales** & **Payments**: Transaction management with payment tracking
- **Clients** & **Providers**: Contact and relationship management
- **Orders**: Order processing and conversion to sales
- **Expenses**: Business expense tracking
- **Users**: Multi-role user management (admin/manager/user)
- **Batches**: Product batch tracking for traceability

### API Integration
- Base URL configured in `services/appBaseConfig.ts`
- JWT-based authentication via `services/auth.ts`
- RESTful API with pagination, filtering, and sorting
- File upload support for receipts and product images
- Role-based access control (admin/manager/user)

### Key Architecture Patterns (Updated 2024)

#### **Modular Hook Architecture**
- **Composite Hooks**: Main entity hooks (e.g., `useVentaItem`, `usePedidoItem`) that combine specialized hooks
- **Specialized Hooks**: Focused hooks for specific concerns:
  - `*Options.ts`: Form data loading and filtering (replaces form-data endpoints)
  - `*Form.ts`: Form state management and validation
  - `*CRUD.ts`: API operations (create, read, update, delete)
  - `*Calculations.ts`: Business logic and calculations
- **Core Hooks**: Reusable hooks like `useErrorHandler` for cross-cutting concerns

#### **API Integration Patterns**
- **Unified fetchApi Client**: All services use `fetchApi` from `services/core/apiClient.ts`
- **Form Data Endpoints**: Both ventas and pedidos use `/entity/form-data` for loading form options
- **ISO 8601 Date Format**: All dates converted to `YYYY-MM-DDTHH:mm:ssZ` format for API compliance
- **Granular Loading States**: Separate loading states for different UI sections (e.g., `isLoadingPresentaciones`)

#### **Entity Conversion Pattern**
- **Pedido to Venta Conversion**: Uses standard venta creation endpoint for simplicity
- **Data Transformation**: Automatic mapping between different entity structures
- **Status Management**: Automatic status updates after successful operations

#### **UI/UX Patterns**
- **Granular Loading**: Loading indicators only for specific sections, not entire screens
- **Error Boundary**: Comprehensive error handling with user-friendly messages
- **Permission-based UI**: Admin vs user features controlled by role checks
- **Responsive Design**: Mobile-first design with web platform support

## Important Notes

### API Configuration
The app connects to a remote API at `https://api.manngo.lat/`. API configuration is in `services/appBaseConfig.ts`. The API uses JWT tokens with role-based permissions.

**Key Endpoints:**
- `/ventas/form-data?almacen_id=X` - Load venta form data with warehouse-specific presentations
- `/pedidos/form-data` - Load pedido form data (shows all products, no inventory filtering)
- `/ventas` - Standard CRUD operations for sales
- `/pedidos` - Standard CRUD operations for orders
- `/pedidos/{id}/convertir-a-venta` - Convert pedido to venta (alternative to direct conversion)

### Authentication Flow
Users authenticate via `services/auth.ts` which manages JWT tokens and user session. The AuthContext provides global authentication state with role-based access control (admin/manager/user).

### Image Handling
Product images and payment receipts are uploaded to AWS S3. Image URLs are handled via `API_CONFIG.getImageUrl()` in `services/api.ts`.

### Data Flow Architecture
1. **Form Data Loading**: Use entity-specific form-data endpoints
2. **Warehouse Filtering**: Admin users can switch warehouses, triggering new API calls
3. **Real-time Updates**: Presentations update based on selected warehouse
4. **Error Handling**: Centralized error handling with user feedback

### Expo Configuration
- **EAS Project ID**: be67618e-9c1d-4fee-a0fa-c604b075eac6
- **Package**: com.yordev.invApp (Android)
- **Version**: 1.3.0+ (Current development)
- **Updates**: Enabled with OTA updates

### Development Workflow (Updated)
1. **File-based Routing**: Create new pages in `app/` directory using Expo Router
2. **Hook Composition**: Use modular hooks pattern - combine specialized hooks in composite hooks
3. **Service Layer**: All new API calls should use `fetchApi` client in `services/entities/`
4. **TypeScript First**: Strict typing with interfaces defined in `models/`
5. **Component Organization**: Place components in appropriate subdirectories with clear separation of concerns

### Recent Refactoring (2024)
- **Hook Architecture**: Migrated from monolithic CRUD hooks to modular specialized hooks
- **API Client**: Standardized on `fetchApi` client across all services
- **Date Handling**: Fixed ISO 8601 format compliance for all date fields
- **Loading States**: Implemented granular loading for better UX
- **Error Handling**: Centralized error handling with `useErrorHandler`

### Testing
- Jest is configured for unit testing
- Test files should use `.test.tsx` or `.test.ts` extension
- Snapshots are stored in `__tests__/__snapshots__/`

### Common Pitfalls & Solutions
- **Date Formats**: Always convert dates to ISO 8601 with timezone (`YYYY-MM-DDTHH:mm:ssZ`)
- **Loading States**: Use granular loading states, avoid blocking entire screens
- **API Calls**: Use form-data endpoints for loading form options, regular endpoints for CRUD
- **Role Permissions**: Check user role before API calls and UI rendering
- **Error Handling**: Use `useErrorHandler` for consistent error management
- **Type Safety**: Import types from `models/` directory, avoid `any` types