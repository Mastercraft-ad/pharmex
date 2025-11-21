# PharmaBlock Systems - Pharmaceutical Supply Chain Authentication

## Overview
PharmaBlock Systems is a full-stack blockchain-based pharmaceutical supply chain authentication system that tracks medicines from manufacturer to consumer using blockchain technology to prevent counterfeit drugs and ensure transparency.

## Project Status
**Current State**: Successfully imported and configured for Replit environment
- ✅ PostgreSQL database provisioned and schema deployed
- ✅ Development server running on port 5000
- ✅ Frontend properly configured for Replit proxy
- ✅ Deployment settings configured for production

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling and dev server
- Tailwind CSS for styling
- Wouter for routing
- Radix UI components
- React Query for data fetching
- QR code scanning (html5-qrcode)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database (via Neon)
- Drizzle ORM for database operations
- JWT authentication with Passport.js
- Simulated blockchain functionality

### Key Features
- User authentication with role-based access (Manufacturer, Distributor, Pharmacy, Consumer)
- Drug batch registration with QR code generation
- Supply chain transfer tracking
- Public verification system for consumers
- Blockchain-simulated immutable audit trails
- Recall management system

## Project Structure

```
/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # React components including UI library
│   │   ├── pages/         # Page components for each user role
│   │   ├── lib/           # Utility functions and configs
│   │   └── hooks/         # Custom React hooks
│   ├── public/            # Static assets
│   └── index.html         # HTML entry point
├── server/                # Express backend
│   ├── index-dev.ts       # Development server with Vite integration
│   ├── index-prod.ts      # Production server
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # API routes
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Database operations layer
│   ├── blockchain.ts      # Simulated blockchain functions
│   └── qr-generator.ts    # QR code generation
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Database schema definitions
└── uploads/               # File storage (QR codes, metadata)
    ├── qrcodes/           # Generated QR code images
    └── metadata/          # Drug batch metadata JSON files
```

## Environment Variables

The following environment variables are automatically configured:
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` - Session encryption key
- `PORT` - Server port (defaults to 5000)

## Available Commands

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build frontend and backend for production
npm start            # Start production server

# Database
npm run db:push      # Push schema changes to database

# Type checking
npm run check        # Run TypeScript type checker
```

## User Roles & Dashboards

### Manufacturer
- Register new drug batches with blockchain verification
- Generate QR codes for each batch
- Transfer batches to distributors
- Track batch history and status
- View manufacturing statistics

### Distributor
- Accept incoming shipments from manufacturers
- Transfer batches to pharmacies
- Manage inventory
- Track distribution statistics

### Pharmacy
- Verify drug authenticity via QR scan or manual entry
- Accept deliveries from distributors
- View verification history
- Report suspicious products

### Consumer (Public)
- No login required
- Scan QR codes to verify medicine authenticity
- View drug information and supply chain history
- Report suspicious products anonymously

## Database Schema

### Core Tables
- `users` - All platform users with roles
- `drug_batches` - Registered pharmaceutical products
- `transfers` - Supply chain transfer records
- `verification_logs` - Drug verification attempts
- `recalls` - Product recall information
- `suspicious_reports` - User-reported suspicious products
- `blockchain_events` - Immutable blockchain transaction audit trail

## Recent Changes
- **2025-11-21**: Project imported and configured for Replit
  - Database provisioned and schema deployed
  - Development workflow configured on port 5000
  - Deployment settings configured for autoscale
  - All dependencies installed
  - Upload directories created

## Development Notes

### Port Configuration
- **Frontend + Backend**: Port 5000 (integrated via Vite middleware in development)
- The server binds to `0.0.0.0` to work with Replit's proxy system
- Vite is configured with `allowedHosts: true` for proper iframe preview

### Blockchain Simulation
The system uses a simulated blockchain rather than actual blockchain:
- Transaction hashes generated using SHA-256
- Immutable audit trail stored in PostgreSQL
- Simulated Ethereum-style wallet addresses
- Three main "contracts": SerializationRegistry, TransferManager, RecallManager

### File Uploads
QR codes and metadata are stored in the `/uploads` directory:
- QR codes: 400x400px PNG images
- Metadata: JSON files with SHA-256 hashes

## Deployment

The application is configured for **autoscale deployment**:
- Build command: `npm run build`
- Start command: `node dist/index.js`
- Suitable for stateless web applications
- Automatically scales based on traffic

## Architecture Decisions

1. **Simulated Blockchain**: Instead of using actual blockchain (Hardhat/Solidity), the system uses cryptographic hashing and database-backed immutable audit trails for simplicity and cost-effectiveness.

2. **Integrated Dev Server**: Vite middleware is integrated into Express for a unified development experience.

3. **Role-Based Access**: Four distinct user roles with separate dashboards and permissions.

4. **Public Verification**: Consumer verification doesn't require authentication, making it accessible to end users.

5. **PostgreSQL over SQLite**: Uses PostgreSQL (Neon) for better scalability and production readiness.

## Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Session management with express-session
- Role-based authorization
- Input validation on all endpoints
- Prepared statements (SQL injection prevention via Drizzle ORM)

## Future Enhancements
Potential features from the original spec that could be added:
- Email notifications for transfers
- Advanced analytics and reporting
- Batch status auto-expiration based on dates
- Integration with actual blockchain networks
- Mobile app for QR scanning
- Multi-language support
- Regulatory authority role and oversight features
