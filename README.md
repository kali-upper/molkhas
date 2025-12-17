# Molkhas - Study Summaries Platform

A clean, simple crowdsourced web platform for university students to share, view, and organize study summaries and academic information.

## Features

### Core Features (MVP)
- **Home Page**: Browse latest summaries with advanced filtering by subject, year, and department
- **Search**: Quick search functionality to find specific summaries
- **Add Summary**: Easy-to-use form for submitting new summaries
  - Rich text content
  - Optional PDF upload
  - Optional contributor name
- **Summary Details**: Clean display of full summary content with PDF download
- **Admin Dashboard**: Review, approve, reject, and edit submissions

### Technical Features
- **Modern UI**: Responsive, mobile-first design with RTL support
- **Arabic First**: Full Arabic language support with Cairo font
- **SEO-Friendly**: Proper meta tags and semantic HTML
- **Real-time**: Built with React and Supabase for instant updates
- **Secure**: Row Level Security (RLS) policies for data protection

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Database + Auth + Storage)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (Email/Password)
- **File Storage**: Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database, authentication, and storage)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. The Supabase environment variables are already configured in your project

4. The database schema and storage buckets are already set up

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

Build the project:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

### For Students

1. **Browse Summaries**: Visit the home page to see all approved summaries
2. **Search & Filter**: Use the search bar and filters to find specific summaries
3. **View Details**: Click on any summary to see full content and download PDF
4. **Submit Summary**: Click "إضافة ملخص" to submit your own summary (no account needed)

### For Admins

1. **Login**: Click "دخول" and sign in with your admin credentials
2. **Review Submissions**: Access the admin dashboard to see pending summaries
3. **Moderate**: Approve, reject, or edit summaries before publishing
4. **Manage**: View all summaries and their status

## Database Schema

### Tables

#### `summaries`
- `id` (uuid, primary key)
- `title` (text) - Summary title
- `subject` (text) - Subject/course name
- `year` (text) - University year
- `department` (text) - Department/faculty
- `content` (text) - Main summary content
- `pdf_url` (text, nullable) - URL to PDF file
- `contributor_name` (text, nullable) - Contributor name
- `status` (text) - pending | approved | rejected
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Storage Buckets

#### `summaries-pdfs`
- Public bucket for PDF uploads
- Accepts PDF files only
- Accessible to all users

## Security

### Row Level Security (RLS)

- **Public users** can:
  - View approved summaries
  - Submit new summaries (status defaults to pending)

- **Authenticated admins** can:
  - View all summaries (pending, approved, rejected)
  - Update any summary
  - Delete summaries

## Future Enhancements

Planned features for future releases:
- Rating system for summaries
- AI-powered summarization
- User profiles and accounts
- Comments and discussions
- Donation button for contributors
- PWA support for offline access
- Multi-language support (English)
- Advanced search with filters
- Export summaries to various formats

## Contributing

This is a real, production-ready platform. Contributions are welcome!

## License

MIT License - feel free to use this project for your university or institution.
