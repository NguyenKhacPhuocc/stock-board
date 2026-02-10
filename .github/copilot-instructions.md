# GitHub Copilot Instructions for Stock Board Project

## Project Overview

This is a **Stock Board** application - a real-time stock market monitoring web application built with React, TypeScript, and Vite.

## Tech Stack

- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4 with SWC for fast refresh
- **State Management**: Redux Toolkit 2.11.2
- **Routing**: React Router DOM 7.12.0
- **API Communication**: Axios 1.13.2
- **Real-time Data**: WebSocket
- **Internationalization**: React Intl 8.1.1 (supports English and Vietnamese)
- **Styling**: SASS
- **Date/Time**: Day.js

## Project Structure

```
front-end/src/
├── app/               # Redux store configuration, hooks, and app-wide setup
├── components/        # Reusable React components
│   └── market/       # Market-specific components
├── features/          # Feature-based modules (Redux slices, types, selectors)
│   ├── auth/         # Authentication feature
│   └── market/       # Market data feature
├── pages/            # Page-level components
│   ├── login/        # Login page
│   └── market/       # Market page
├── routes/           # Routing configuration
├── services/         # External service integrations
│   ├── apiClient.ts  # Axios HTTP client configuration
│   └── websocket.ts  # WebSocket service for real-time data
├── locales/          # i18n translation files (en.json, vi.json)
└── styles/           # Global styles and SASS files
```

## Code Conventions

### Language and Localization
- The application supports both **English** and **Vietnamese**
- Use React Intl for all user-facing strings
- Translation files are in `src/locales/` (en.json, vi.json)
- Comments and documentation can be in English

### TypeScript
- Use strict TypeScript types
- Define types in feature-specific `*Types.ts` files
- Use type inference where appropriate
- Avoid `any` type

### React Components
- Use functional components with hooks
- Follow React 19 best practices
- Use React Redux hooks (`useAppSelector`, `useAppDispatch`) from `app/hooks.ts`
- Component files should be named in PascalCase (e.g., `MarketBoard.tsx`)

### Redux State Management
- Use Redux Toolkit for state management
- Feature-based organization (slices in `features/`)
- Create selectors in `*Selectors.ts` files
- Use `createSlice` and `createAsyncThunk` from Redux Toolkit

### Styling
- Use SASS for styling
- Keep component-specific styles close to components
- Use `clsx` utility for conditional class names

### File Organization
- Group by feature, not by type
- Each feature should have its slice, types, selectors, and related files
- Shared components go in `components/`
- Page components go in `pages/`

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Important Notes

- The project uses **Vite** with **SWC** for Fast Refresh (not Babel)
- The app has real-time features via WebSocket - consider connection stability
- Authentication is implemented - respect auth flow in new features
- Always test with both English and Vietnamese locales
- The build process runs TypeScript compiler before Vite build (`tsc -b && vite build`)

## When Adding New Features

1. Create feature slice in `features/` directory
2. Define types in `*Types.ts`
3. Create selectors in `*Selectors.ts`
4. Add API calls in `services/` or feature directory
5. Create components in `components/` or `pages/`
6. Add translations to both `en.json` and `vi.json`
7. Update routing in `routes/` if needed
8. Run linter before committing

## API and WebSocket

- **HTTP Client**: Configure in `services/apiClient.ts` (uses Axios)
- **WebSocket**: Configure in `services/websocket.ts`
- Market data is fetched via WebSocket for real-time updates
- Authentication endpoints are in `features/auth/authApi.ts`

## Best Practices for This Project

- Keep components small and focused
- Use custom hooks for reusable logic
- Leverage Redux Toolkit's built-in features (no need for action creators)
- Use Day.js for date/time formatting
- Implement error handling for API calls and WebSocket connections
- Consider mobile responsiveness in all UI changes
- Test real-time features thoroughly

## ESLint Configuration

The project uses ESLint 9 with flat config format (`eslint.config.js`). The configuration includes:
- React hooks rules
- React refresh rules
- TypeScript ESLint rules
- Global variables configuration

When making changes, ensure code passes linting with `npm run lint`.
