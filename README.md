# HASEX OS

A sophisticated operating system interface built with React, featuring Supabase authentication, chat functionality, and AI-powered capabilities.

## Features

- **Authentication System**: Complete Supabase-based authentication with email/password and Google OAuth
- **User Profiles**: Extended user information management with database persistence
- **Chat System**: Real-time messaging with file attachment support
- **AI Integration**: NVIDIA NIM model integration for intelligent responses
- **Responsive Design**: Modern dark-themed UI with Tailwind CSS
- **Session Management**: Secure session handling with Supabase

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier works)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

Follow the detailed setup guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md):

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your API credentials from Project Settings → API
3. Execute the database schema from `supabase-schema.sql`
4. Configure Google OAuth (optional but recommended)

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

Add other required API keys:

```env
NVIDIA_API_KEY="your-nvidia-api-key"
APP_URL="http://localhost:3000"
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm start
```

## Authentication Flow

### Sign Up

1. Navigate to `/signup` or click "Sign up" from the login page
2. Choose between:
   - **Google OAuth**: Quick sign-up with Google account
   - **Email/Password**: Traditional sign-up with email verification
3. After signup, a user profile is automatically created in the database

### Sign In

1. Navigate to `/login`
2. Use either Google OAuth or email/password
3. Password reset functionality available via "Forgot your password?"

### Session Management

- Sessions persist across page refreshes
- Automatic token refresh handled by Supabase
- Secure logout functionality

## Project Structure

```
hasex/
├── src/
│   ├── components/          # React components
│   │   ├── Login.tsx       # Login page
│   │   ├── Signup.tsx      # Signup page
│   │   ├── AuthCallback.tsx # OAuth callback handler
│   │   ├── LandingPortal.tsx # Landing page
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/               # Utility libraries
│   │   └── firebase.ts    # Supabase client & auth functions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── server.ts              # Express server
├── supabase-schema.sql    # Database schema
├── .env.example           # Environment variables template
└── package.json           # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **profiles**: User profile information (linked to Supabase Auth)
- **chat_messages**: Chat messages with sender details and attachments
- **user_sessions**: User session tracking

See `supabase-schema.sql` for complete schema definition including triggers, RLS policies, and helper functions.

## API Integration

### NVIDIA NIM Models

The application integrates with NVIDIA's AI models for intelligent responses:

- Configure your NVIDIA API key in the environment variables
- Supports multiple model variants (LLaMA, Qwen, etc.)
- Automatic model selection based on configuration

### Supabase Storage

- File upload support for chat attachments
- Public access configured for shared files
- Automatic fallback to Base64 for offline scenarios

## Security Features

- **Row Level Security (RLS)**: Configured on all database tables
- **Environment Variables**: Sensitive data never committed to code
- **OAuth Security**: PKCE flow for Google authentication
- **Session Management**: Secure token handling with automatic refresh

## Troubleshooting

### Authentication Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file exists with proper VITE_ prefixed variables
   - Restart development server after adding environment variables

2. **Google OAuth not working**
   - Verify redirect URIs match exactly in both Google Console and Supabase
   - Check that your app URL is correctly configured

3. **Profile not created after signup**
   - Verify the `on_auth_user_created` trigger exists in your database
   - Check RLS policies allow profile creation

### Build Issues

1. **TypeScript errors**
   - Run `npm run lint` to identify issues
   - Ensure all dependencies are properly installed

2. **Build failures**
   - Clean build artifacts: `npm run clean`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Development

### Adding New Features

1. Database changes:
   - Update `supabase-schema.sql`
   - Apply changes via Supabase SQL Editor
   - Update TypeScript interfaces as needed

2. New components:
   - Create in `src/components/`
   - Follow existing naming conventions
   - Use Tailwind CSS for styling

3. Authentication:
   - Use `useAuth()` hook from AuthContext
   - Existing functions in `src/lib/firebase.ts`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

Ensure the platform supports:
- Node.js runtime
- Environment variables configuration
- Static file serving for production build

## Documentation

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Detailed Supabase setup guide
- [SUPABASE_AUTH_COMPLETION_SUMMARY.md](SUPABASE_AUTH_COMPLETION_SUMMARY.md) - Authentication implementation summary
- [supabase-schema.sql](supabase-schema.sql) - Complete database schema

## Support

For issues and questions:

1. Check existing documentation in the `docs/` folder
2. Review Supabase logs in your dashboard
3. Check browser console for client-side errors
4. Verify environment variables are properly configured

## License

This project is private and confidential.

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **AI**: NVIDIA NIM Models
- **Build**: Vite
- **Animations**: Motion (Framer Motion)

---

**Note**: This application uses a hybrid authentication approach with Supabase for authentication and user management, while some legacy features still use Firebase. See the authentication summary for details.
