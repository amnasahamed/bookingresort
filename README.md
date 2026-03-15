# Booking Resort

A modern property booking and management platform built with React, TypeScript, and Supabase.

## Features

- Property listing and management
- Calendar availability management
- Admin dashboard for property owners
- Superadmin dashboard for platform management
- Responsive design for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/amnasahamed/bookingresort.git
cd bookingresort
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Start the development server:
```bash
npm run dev
```

## Database Setup

The application uses Supabase with the following tables:
- `profiles` - User accounts and roles
- `properties` - Property listings
- `calendars` - Availability calendar data

Row Level Security (RLS) policies are configured for secure data access.

## Deployment

Deploy to Vercel with one click or via CLI:

```bash
vercel
```

Make sure to configure the environment variables in your Vercel project settings.

## Initial Admin Setup

The default superadmin account is created via the database migration scripts. After deployment:

1. Run the migration scripts to create the initial admin user
2. Login with the credentials set in your migration
3. Use the Superadmin Portal to invite additional admins

**Security Note**: The password is hashed using bcrypt in the database. Ensure you change the default password in the migration script before deploying to production.

## License

MIT
