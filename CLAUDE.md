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
- **API**: REST API with JWT authentication
- **Charts**: React Native Chart Kit 6.12.0
- **Navigation**: React Navigation 7.0.14

### Project Structure
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
├── pedidos/           # Order management
├── productos/         # Product management
├── proveedores/       # Provider management
├── reportes/          # Reports and analytics
├── usuarios/          # User management
└── ventas/            # Sales management

components/            # Reusable UI components
├── buttons/          # Button components
├── dashboard/        # Dashboard-specific components
├── data/            # Data display components (tables, lists)
├── dialogs/         # Modal dialogs
├── form/            # Form components
├── layout/          # Layout components
└── ui/              # Base UI components

hooks/               # Custom React hooks
├── crud/           # CRUD operation hooks
└── reportes/       # Report-specific hooks

models/             # TypeScript data models
services/           # API services and configuration
context/            # React context providers
utils/              # Utility functions
constants/          # App constants
styles/             # Theme and styling
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

### Key Patterns
- **CRUD Hooks**: Standardized hooks in `hooks/crud/` for entity operations
- **Form Handling**: Centralized form logic with `useForm` hook
- **API Resource Pattern**: Generic `useApiResource` for API operations
- **Context Pattern**: Global state via AuthContext and AlertContext
- **File-based Routing**: Expo Router with grouped routes

## Important Notes

### API Configuration
The app connects to a remote API at `https://api.manngo.lat/`. API configuration is in `services/appBaseConfig.ts`. The API uses JWT tokens with role-based permissions.

### Authentication Flow
Users authenticate via `services/auth.ts` which manages JWT tokens and user session. The AuthContext provides global authentication state.

### Image Handling
Product images and payment receipts are uploaded to AWS S3. Image URLs are handled via `API_CONFIG.getImageUrl()` in `services/api.ts`.

### Expo Configuration
- **EAS Project ID**: be67618e-9c1d-4fee-a0fa-c604b075eac6
- **Package**: com.yordev.invApp (Android)
- **Version**: 1.2.1 (versionCode 9)
- **Updates**: Enabled with OTA updates

### Development Workflow
1. The app uses file-based routing - create new pages in `app/` directory
2. All API calls should use existing hooks in `hooks/crud/` when possible
3. Follow the established pattern for new CRUD entities
4. Use TypeScript strictly - types are defined in `models/`
5. UI components should be placed in appropriate `components/` subdirectories

### Testing
- Jest is configured for unit testing
- Test files should use `.test.tsx` or `.test.ts` extension
- Snapshots are stored in `__tests__/__snapshots__/`

### Common Pitfalls
- Always check user permissions before API calls (roles: admin/manager/user)
- Handle offline scenarios gracefully
- Use proper TypeScript types from `models/` directory
- Images must be handled through the S3 upload flow
- Dates should use dayjs for consistent formatting