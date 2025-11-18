# 💼 Investment Portfolio Tracker

A modern, full-featured investment portfolio tracking application built with Next.js 14. Track your investments across multiple categories, visualize your portfolio performance with interactive charts, and manage your financial data with ease.

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue?style=flat-square&logo=typescript)![MongoDB](https://img.shields.io/badge/MongoDB-8.5.1-green?style=flat-square&logo=mongodb)![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.7-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

### 📊 Dashboard & Analytics
- **Comprehensive Portfolio Overview**: Real-time summary of all investments with auto-calculated metrics
- **Interactive Charts**: 
  - Investment allocation pie chart with gradient colors
  - Expected vs Current value comparison bar chart
- **Advanced Metrics**: Track total invested, expected returns, profit/loss, and current values
- **Data Export**: Export portfolio data to CSV with proper formatting

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure token-based authentication
- **Two-Factor Authentication (2FA)**: Email-based 2FA enabled by default for all users
- **Password Management**: 
  - Secure password reset via email
  - Password change functionality
- **Email Verification**: Email change with verification codes
- **Session Management**: Secure cookie-based sessions

### 📁 Category Management
- **Dynamic Categories**: Create unlimited investment categories (Stocks, Mutual Funds, Gold, etc.)
- **Custom Display Names**: Set friendly display names for categories
- **Entry Management**: Add, edit, and delete entries within each category
- **Real-time Updates**: All changes sync instantly across the application

### 🎨 User Experience
- **Progressive Web App (PWA)**: Install as a native app, works offline
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Dark Mode**: System-aware theme switching
- **Loading States**: Skeleton loaders for better UX
- **Toast Notifications**: Beautiful, non-intrusive notifications
- **Error Handling**: Custom error pages and error boundaries
- **SEO Optimized**: Complete metadata, sitemap, and robots.txt

### 🔧 Admin Features
- **Admin Dashboard**: Manage all categories from a centralized admin page
- **User Management**: Role-based access control (admin/user)
- **Bulk Operations**: Efficient category management

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2.5** - React framework with App Router
- **TypeScript 5.5.4** - Type-safe development
- **Tailwind CSS 3.4.7** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Beautiful, responsive charts
- **Sonner** - Toast notifications
- **Radix UI** - Accessible component primitives

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB 8.5.1** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending functionality

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Sharp** - Image optimization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/HyderYash/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/investment-tracker
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/investment-tracker

# Application URL (for email links and PWA)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for 2FA, password reset, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Important**: 
- Replace all placeholder values with your actual credentials
- Never commit `.env.local` to version control
- For production, use environment variables provided by your hosting platform

### 4. Start MongoDB

If using MongoDB locally:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services panel
```

### 5. Create Admin User (Optional)

```bash
npm run create-admin
```

Follow the prompts to create an admin user.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
expense-tracker/
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin dashboard
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── 2fa/           # Two-factor authentication
│   │   │   ├── signin/        # Sign in
│   │   │   ├── signup/        # Sign up
│   │   │   ├── forgot-password/ # Password reset
│   │   │   └── ...
│   │   └── categories/        # Category CRUD operations
│   ├── categories/             # Category pages
│   │   └── [slug]/            # Dynamic category routes
│   ├── dashboard/             # Main dashboard
│   ├── settings/              # User settings
│   ├── signin/                # Sign in page
│   ├── signup/                # Sign up page
│   ├── layout.tsx             # Root layout
│   ├── error.tsx              # Error page
│   ├── not-found.tsx          # 404 page
│   ├── robots.ts              # SEO robots.txt
│   └── sitemap.ts             # SEO sitemap
├── components/                 # React components
│   ├── ui/                    # Reusable UI components
│   ├── navigation.tsx         # Navigation bar
│   ├── landing-page.tsx       # Landing page
│   ├── loading-skeleton.tsx   # Loading states
│   ├── error-boundary.tsx     # Error boundaries
│   ├── pwa-installer.tsx      # PWA installation
│   └── toaster.tsx            # Toast notifications
├── lib/                        # Utility libraries
│   ├── auth.ts               # Authentication utilities
│   ├── mongodb.ts            # Database connection
│   ├── email.ts              # Email sending
│   ├── export.ts             # CSV export
│   ├── toast.ts              # Toast helpers
│   └── utils.ts              # General utilities
├── models/                     # Mongoose models
│   ├── User.ts               # User model
│   └── Category.ts           # Category model
├── public/                     # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # PWA icons
├── scripts/                    # Utility scripts
│   ├── create-admin.js       # Admin user creation
│   └── generate-icons.js     # Icon generation
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/api/auth/signup`          | Register new user               |
| POST   | `/api/auth/signin`          | Sign in user                    |
| POST   | `/api/auth/signout`         | Sign out user                   |
| GET    | `/api/auth/me`              | Get current user                |
| POST   | `/api/auth/forgot-password` | Request password reset          |
| POST   | `/api/auth/reset-password`  | Reset password with code        |
| POST   | `/api/auth/change-password` | Change password (authenticated) |
| POST   | `/api/auth/change-email`    | Request email change            |
| PUT    | `/api/auth/change-email`    | Verify and change email         |
| POST   | `/api/auth/2fa/enable`      | Enable 2FA                      |
| POST   | `/api/auth/2fa/verify`      | Verify 2FA code                 |
| POST   | `/api/auth/2fa/disable`     | Disable 2FA                     |

### Categories

| Method | Endpoint                                      | Description           |
| ------ | --------------------------------------------- | --------------------- |
| GET    | `/api/categories`                             | Get all categories    |
| POST   | `/api/categories`                             | Create new category   |
| GET    | `/api/categories/[slug]`                      | Get category by slug  |
| PUT    | `/api/categories/[slug]`                      | Update category       |
| DELETE | `/api/categories/[slug]`                      | Delete category       |
| POST   | `/api/categories/[slug]/entries`              | Add entry to category |
| PUT    | `/api/categories/[slug]/entries`              | Update entry          |
| DELETE | `/api/categories/[slug]/entries?entryIndex=X` | Delete entry          |

## 📖 Usage Guide

### Creating Your First Category

1. Sign up or sign in to your account
2. Navigate to `/admin` (admin users) or use the dashboard
3. Click "Create Category"
4. Fill in the details:
   - **Name**: Internal name (e.g., "stocks")
   - **Slug**: URL-friendly identifier (auto-generated)
   - **Display Name**: Friendly name (e.g., "Stock Investments")
   - **Expected %**: Expected return percentage
   - **Current Value**: Current market value
5. Click "Create"

### Adding Entries

1. Navigate to a category page (`/categories/[slug]`)
2. Click "Add Entry"
3. Enter:
   - **Name**: Entry name (e.g., "Apple Inc.")
   - **Quantity**: Number of units
   - **Invested**: Total amount invested
4. Click "Add"

### Viewing Analytics

- Visit `/dashboard` to see:
  - Portfolio summary table
  - Investment allocation chart
  - Expected vs Current value comparison
- Export data to CSV for external analysis

### Managing Account

- Visit `/settings` to:
  - Enable/disable 2FA
  - Change email address
  - Change password
  - View account information

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- **Netlify**: Configure build command: `npm run build`
- **AWS Amplify**: Connect GitHub repository
- **Railway**: Add `package.json` and deploy
- **Docker**: Use Next.js official Docker image

### Environment Variables for Production

Ensure all environment variables are set in your hosting platform:
- `MONGODB_URI`
- `NEXT_PUBLIC_BASE_URL`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Two-factor authentication (2FA)
- ✅ Secure HTTP-only cookies
- ✅ CSRF protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection
- ✅ Rate limiting ready

## 🎨 Customization

### Themes

The app supports light and dark modes. Customize colors in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#667eea',
      // Add your custom colors
    }
  }
}
```

### Branding

Update app metadata in `app/layout.tsx`:
- Site name
- Description
- Logo
- Theme colors

## 🧪 Development

### Running Tests

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Code Style

The project uses:
- ESLint for code quality
- Prettier (recommended) for formatting
- TypeScript strict mode

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn/UI](https://ui.shadcn.com/) - Beautiful components
- [Recharts](https://recharts.org/) - Chart library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [MongoDB](https://www.mongodb.com/) - Database

## 📧 Support

For support, email yashsharma.karate@gmail.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time price updates via API
- [ ] Investment goal tracking
- [ ] Portfolio rebalancing suggestions
- [ ] Multi-currency support
- [ ] Advanced reporting and analytics
- [ ] Investment performance history
- [ ] Tax reporting features

---

**Made with ❤️ using Next.js and TypeScript**
