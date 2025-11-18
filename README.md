# Investment Portfolio Dashboard

A sleek, interactive investment portfolio dashboard built with Next.js 14, featuring Apple-style aesthetics, real-time updates, and MongoDB integration for dynamic category management.

## Features

- 📊 **Dashboard Overview**: Comprehensive summary table with auto-calculated metrics
- 📈 **Interactive Charts**: Pie chart for investment allocation and bar chart for profit/loss
- 💼 **Dynamic Category Management**: Admin page to create and manage categories
- 🔄 **Dynamic Routes**: Category pages at `/categories/[slug]` - fully dynamic
- ✏️ **Real-Time Editing**: Edit quantities and invested amounts directly in tables
- 💾 **MongoDB Integration**: All data stored in MongoDB for persistence
- 🎨 **Apple-Style UI**: Clean, minimal design with frosted glass effects and smooth animations

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **MongoDB** with Mongoose
- **Tailwind CSS**
- **Shadcn/UI** components
- **Zustand** for state management (optional, now using API)
- **Framer Motion** for animations
- **Recharts** for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd expense-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/investment-tracker
```

Or for MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/investment-tracker
```

4. Start MongoDB (if using local)

If you're using MongoDB locally, make sure it's running:
```bash
mongod
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── admin/              # Admin page for managing categories
│   ├── api/
│   │   └── categories/     # API routes for categories CRUD
│   ├── categories/
│   │   └── [slug]/        # Dynamic category pages
│   ├── dashboard/          # Main dashboard page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                 # Reusable UI components
│   └── navigation.tsx      # Navigation component
├── lib/
│   ├── mongodb.ts          # MongoDB connection
│   └── utils.ts            # Utility functions
└── models/
    └── Category.ts         # MongoDB Category model
```

## Usage

### Admin Page (`/admin`)

1. Navigate to `/admin` to manage categories
2. Create new categories with:
   - Name (required)
   - Slug (auto-generated from name, can be customized)
   - Display Name (optional)
   - Description (optional)
   - Expected % (default: 0)
   - Current Value (default: 0)

### Category Pages (`/categories/[slug]`)

- Each category has its own dynamic page
- Users can add/edit/delete entries
- All changes are saved to MongoDB in real-time

### Dashboard

The dashboard displays:
- **Name**: Category display name
- **Total**: Sum of invested values per category
- **Expected %**: Expected return percentage
- **Expected Amount**: Calculated as `total * (1 + expectedPercent / 100)`
- **Profit/Loss**: Difference between current value and expected amount
- **Current Value**: Current market value

## API Routes

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/[slug]` - Get a specific category
- `PUT /api/categories/[slug]` - Update a category
- `DELETE /api/categories/[slug]` - Delete a category
- `POST /api/categories/[slug]/entries` - Add an entry to a category
- `PUT /api/categories/[slug]/entries` - Update an entry
- `DELETE /api/categories/[slug]/entries?entryIndex=X` - Delete an entry

## Data Structure

### Category Model

```typescript
{
  name: string;              // Unique category name
  slug: string;              // URL-friendly identifier
  expectedPercent: number;   // Expected return percentage
  currentValue: number;      // Current market value
  entries: [                // Array of entries
    {
      name: string;          // Entry name
      quantity: number;      // Quantity
      invested: number;      // Invested amount
    }
  ],
  displayName?: string;      // Optional display name
  description?: string;      // Optional description
}
```

## Design Principles

- **Apple-inspired aesthetics**: Soft shadows, frosted glass cards, elegant spacing
- **Real-time updates**: Instant reflection of changes across all pages
- **Smooth animations**: Framer Motion for transitions and hover effects
- **Responsive design**: Works seamlessly on all screen sizes
- **Dynamic content**: All categories and entries are user-configurable

## License

MIT
