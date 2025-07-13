# Analytics Dashboard

A comprehensive analytics dashboard for tracking user behavior, product performance, and business metrics.

## Features

- 📊 **Real-time Analytics** - Dashboard with live metrics and KPIs
- 👥 **User Management** - Role-based access control (Admin, Editor, Viewer)
- 📱 **Product Analytics** - Track product performance and user interactions
- 🎫 **Coupon Analytics** - Monitor coupon usage and effectiveness
- 💬 **Product Feedback** - Collect and analyze user feedback
- 🏆 **Hero Deals** - Manage promotional deals and offers
- 📈 **User Flow Analysis** - Track user journey and behavior patterns
- 📤 **Data Export** - Export data in CSV/JSON formats
- 🔒 **Secure Authentication** - JWT-based authentication system

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Date-fns** for date handling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** for data storage
- **JWT** for authentication
- **bcryptjs** for password hashing

## Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd analytics-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   OLD_DB_URI=your_mongodb_connection_string
   NEW_DB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ENCRYPTION_KEY=your_encryption_key
   PORT=3050
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   - Open http://localhost:5173
   - Login with demo credentials:
     - Admin: `admin@demo.com` / `admin123`
     - Editor: `editor@demo.com` / `editor123`
     - Viewer: `viewer@demo.com` / `viewer123`

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── Analytics/       # Analytics-specific components
│   │   ├── Dashboard/       # Dashboard components
│   │   ├── Layout/          # Layout components
│   │   └── UserManagement/  # User management components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Main application component
├── server/
│   ├── config/             # Database and configuration
│   ├── data/               # Mock data and seeds
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── index.ts            # Server entry point
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Validate token

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/user-flows` - User flow data
- `GET /api/analytics/coupons` - Coupon analytics
- `GET /api/analytics/hero-deals` - Hero deals data
- `GET /api/analytics/product-feedback` - Product feedback

### User Management
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## User Roles

- **Admin**: Full access to all features including user management
- **Editor**: Can view and export all analytics data
- **Viewer**: Read-only access to analytics dashboards

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Data encryption for sensitive information
- Environment variable configuration
- CORS protection

## Development

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run server:dev` - Start backend development server
- `npm run server:build` - Build backend for production
- `npm run lint` - Run ESLint

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OLD_DB_URI` | MongoDB connection string for old database | Yes |
| `NEW_DB_URI` | MongoDB connection string for new database | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `ENCRYPTION_KEY` | Key for data encryption | Yes |
| `PORT` | Server port (default: 3050) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Deployment

### Production Build
```bash
npm run build
npm run server:build
npm start
```

### Environment Setup
1. Set all required environment variables
2. Ensure MongoDB is accessible
3. Configure CORS for your domain
4. Set up SSL/HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.