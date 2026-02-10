# Stock Board - Bảng Theo Dõi Chứng Khoán

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### Overview

Stock Board is a real-time stock market monitoring application built with React, TypeScript, and Vite. It provides live stock market data, authentication features, and an intuitive interface for tracking stock prices.

### Features

- 🔐 **Authentication System**: Secure user login and authentication
- 📊 **Real-time Market Data**: Live stock market updates via WebSocket
- 🌐 **Internationalization**: Support for English and Vietnamese languages
- 🎨 **Modern UI**: Built with React 19 and TypeScript
- ⚡ **Fast Development**: Powered by Vite with Hot Module Replacement (HMR)
- 📱 **Responsive Design**: Works on desktop and mobile devices

### Tech Stack

- **Frontend Framework**: React 19.2.0
- **Language**: TypeScript
- **Build Tool**: Vite 7.2.4
- **State Management**: Redux Toolkit 2.11.2
- **Routing**: React Router DOM 7.12.0
- **HTTP Client**: Axios 1.13.2
- **Internationalization**: React Intl 8.1.1
- **Styling**: SASS
- **Date/Time**: Day.js

### Project Structure

```
stock-board/
├── front-end/              # Frontend application
│   ├── src/
│   │   ├── app/           # Redux store configuration
│   │   ├── components/    # Reusable React components
│   │   ├── features/      # Feature-based modules (auth, market)
│   │   ├── pages/         # Page components (login, market)
│   │   ├── routes/        # Routing configuration
│   │   ├── services/      # API and WebSocket services
│   │   ├── locales/       # i18n translation files
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
└── README.md              # This file
```

### Getting Started

#### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/NguyenKhacPhuocc/stock-board.git
cd stock-board
```

2. Navigate to the front-end directory:
```bash
cd front-end
```

3. Install dependencies:
```bash
npm install
```

#### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port shown in the terminal).

#### Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist/` directory.

#### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

#### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

This project is private and proprietary.

---

## Tiếng Việt

### Tổng Quan

Stock Board là ứng dụng theo dõi thị trường chứng khoán thời gian thực được xây dựng với React, TypeScript và Vite. Ứng dụng cung cấp dữ liệu thị trường chứng khoán trực tiếp, tính năng xác thực và giao diện trực quan để theo dõi giá cổ phiếu.

### Tính Năng

- 🔐 **Hệ Thống Xác Thực**: Đăng nhập và xác thực người dùng an toàn
- 📊 **Dữ Liệu Thị Trường Thời Gian Thực**: Cập nhật thị trường chứng khoán trực tiếp qua WebSocket
- 🌐 **Đa Ngôn Ngữ**: Hỗ trợ tiếng Anh và tiếng Việt
- 🎨 **Giao Diện Hiện Đại**: Được xây dựng với React 19 và TypeScript
- ⚡ **Phát Triển Nhanh**: Sử dụng Vite với Hot Module Replacement (HMR)
- 📱 **Thiết Kế Responsive**: Hoạt động trên máy tính và thiết bị di động

### Công Nghệ Sử Dụng

- **Framework Frontend**: React 19.2.0
- **Ngôn Ngữ**: TypeScript
- **Công Cụ Build**: Vite 7.2.4
- **Quản Lý State**: Redux Toolkit 2.11.2
- **Routing**: React Router DOM 7.12.0
- **HTTP Client**: Axios 1.13.2
- **Đa Ngôn Ngữ**: React Intl 8.1.1
- **Styling**: SASS
- **Ngày Giờ**: Day.js

### Cấu Trúc Dự Án

```
stock-board/
├── front-end/              # Ứng dụng frontend
│   ├── src/
│   │   ├── app/           # Cấu hình Redux store
│   │   ├── components/    # Các component React có thể tái sử dụng
│   │   ├── features/      # Các module theo tính năng (auth, market)
│   │   ├── pages/         # Các component trang (login, market)
│   │   ├── routes/        # Cấu hình routing
│   │   ├── services/      # Các dịch vụ API và WebSocket
│   │   ├── locales/       # File dịch thuật i18n
│   │   └── styles/        # Style toàn cục
│   ├── public/            # Tài nguyên tĩnh
│   └── package.json       # Dependencies
└── README.md              # File này
```

### Bắt Đầu

#### Yêu Cầu

- Node.js (khuyến nghị phiên bản 18 trở lên)
- npm hoặc yarn package manager

#### Cài Đặt

1. Clone repository:
```bash
git clone https://github.com/NguyenKhacPhuocc/stock-board.git
cd stock-board
```

2. Di chuyển đến thư mục front-end:
```bash
cd front-end
```

3. Cài đặt dependencies:
```bash
npm install
```

#### Phát Triển

Khởi động server phát triển:
```bash
npm run dev
```

Ứng dụng sẽ có sẵn tại `http://localhost:5173` (hoặc cổng khác hiển thị trong terminal).

#### Build cho Production

Build ứng dụng:
```bash
npm run build
```

Các file đã build sẽ nằm trong thư mục `dist/`.

#### Xem Trước Build Production

Xem trước bản build production trên local:
```bash
npm run preview
```

#### Linting

Chạy ESLint để kiểm tra chất lượng code:
```bash
npm run lint
```

### Các Script Có Sẵn

- `npm run dev` - Khởi động server phát triển
- `npm run build` - Build cho production
- `npm run preview` - Xem trước bản build production
- `npm run lint` - Chạy ESLint

### Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng thoải mái gửi Pull Request.

### Giấy Phép

Dự án này là riêng tư và độc quyền.
