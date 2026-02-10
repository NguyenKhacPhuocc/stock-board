# Stock Board Frontend

This is the frontend application for Stock Board - a real-time stock market monitoring application built with React, TypeScript, and Vite.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Technology Stack

- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Vite 7.2.4** - Build tool with HMR
- **Redux Toolkit** - State management
- **React Router DOM** - Routing
- **React Intl** - Internationalization (English/Vietnamese)
- **Axios** - HTTP client
- **WebSocket** - Real-time market data
- **SASS** - Styling
- **Day.js** - Date/time utilities

## Project Structure

```
src/
├── app/           # Redux store, hooks, i18n configuration
├── components/    # Reusable UI components
├── features/      # Feature modules (auth, market)
├── pages/         # Page components
├── routes/        # Routing configuration
├── services/      # API and WebSocket services
├── locales/       # Translation files (en.json, vi.json)
└── styles/        # Global styles
```

## Features

- 🔐 User authentication
- 📊 Real-time stock market data via WebSocket
- 🌐 Bilingual support (English/Vietnamese)
- 📱 Responsive design
- ⚡ Fast refresh with Vite + SWC

## Development Notes

This project uses [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) for Fast Refresh. The React Compiler is currently not compatible with SWC (see [this issue](https://github.com/vitejs/vite-plugin-react/issues/428)).

For more information, see the [main project README](../README.md).

