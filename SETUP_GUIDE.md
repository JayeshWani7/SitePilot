# Setup & Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm install --prefix frontend
```

### 2. Setup Database

```bash
# Copy .env and configure DATABASE_URL
npm run setup:db

# Verify setup
npm run check:db
```

### 3. Run Development Environment

```bash
# In separate terminals
npm run dev:api      # Backend on port 3000
npm run dev:web      # Frontend on port 3001

# Or run both together
npm run dev:all
```

## Features Implemented

### ✅ Authentication & Authorization

- **User Registration**: Signup with email, password, and optional organization creation
- **User Login**: Email/password authentication with JWT tokens
- **Token Management**: Secure JWT token generation and validation
- **Profile Management**: View and manage user profile

### ✅ Role-Based Access Control (RBAC)

Six role types with hierarchical permission structure:

1. **Owner** (Level 5)
   - Full access to all features
   - Manage users, billing, subscriptions
   - Permission scope: Ultra admin

2. **Administrator** (Level 4)
   - Manage team and projects
   - Cannot manage billing
   - Permission scope: Manager

3. **Editor** (Level 3)
   - Create and edit content
   - Publish and manage projects
   - Permission scope: Content creator

4. **Developer** (Level 2)
   - API access
   - Development-focused permissions
   - Permission scope: Technical

5. **Viewer** (Level 1)
   - Read-only access
   - View analytics and projects
   - Permission scope: Observer

6. **Super Admin** (System)
   - Unrestricted access to platform
   - Backend only
   - Permission scope: Platform admin

### ✅ Team Management

- **Add Members**: Invite users by email with role assignment
- **Manage Roles**: Update member roles
- **Remove Members**: Revoke access to tenants
- **Member Lookup**: Track all team members and their roles
- **Permission Enforcement**: Server-side permission checks for all actions

### ✅ Usage Monitoring & Observability

#### Tracked Metrics

**Resource Metrics:**
- Team member count
- Number of projects
- Number of domains
- Storage usage (MB)
- Bandwidth usage (GB)

**Performance Metrics:**
- Total page views
- Unique visitors
- API calls count
- Total HTTP requests

#### Features

1. **Real-time Usage Tracking**
   - Track metrics programmatically
   - Automatically aggregate daily summaries
   - Generate alerts at 80% usage threshold

2. **Usage Dashboard**
   - Visual progress bars for resource usage
   - Comparison against plan limits
   - Color-coded alerts (green/yellow/red)
   - Engagement metrics display

3. **Alert System**
   - Automatic alerts when approaching limits
   - Resolved/unresolved alert states
   - Severity levels (high/medium/low)

4. **Optimization Suggestions**
   - Plan upgrade recommendations
   - Performance optimization advice
   - Feature enablement suggestions
   - Based on actual usage patterns

### ✅ Subscription Management

Four subscription tiers:

- **Free**: 1 user, 3 projects, 1 domain, 5GB traffic
- **Starter**: 3 users, 10 projects, 1 domain, 50GB traffic
- **Pro**: 10 users, 50 projects, 5 domains, 500GB traffic, API access
- **Enterprise**: Unlimited resources, priority support, SSO

### ✅ API Endpoints

#### Authentication Endpoints
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /auth/me` - Get current user profile
- `GET /auth/subscription-plans` - List available plans

#### Team Management Endpoints
- `GET /auth/tenants/:tenantId/members` - List team members
- `POST /auth/tenants/:tenantId/members` - Add team member
- `PUT /auth/tenants/:tenantId/members/:memberId/role` - Update role
- `DELETE /auth/tenants/:tenantId/members/:memberId` - Remove member
- `GET /auth/tenants/:tenantId/subscription` - Get subscription info

#### Usage Tracking Endpoints
- `POST /usage/tenants/:tenantId/usage/track` - Track metric
- `GET /usage/tenants/:tenantId/usage/current` - Get current usage
- `GET /usage/tenants/:tenantId/usage/summary` - Get usage summary
- `GET /usage/tenants/:tenantId/usage/breakdown` - Detailed breakdown
- `GET /usage/tenants/:tenantId/usage/alerts` - Get alerts
- `PUT /usage/tenants/:tenantId/usage/alerts/:alertId/resolve` - Resolve alert
- `GET /usage/tenants/:tenantId/usage-suggestions` - Get suggestions
- `GET /usage/tenants/:tenantId/feature-flags` - Get feature flags

### ✅ Frontend Components

#### Auth Context (`contexts/AuthContext.tsx`)
```typescript
const { 
  user,              // Current user object
  tenants,           // Array of accessible tenants
  currentTenant,     // Selected tenant with role info
  token,             // JWT token
  isAuthenticated,   // Auth status
  login,             // Login function
  signup,            // Signup function
  logout,            // Logout function
  selectTenant       // Switch tenant
} = useAuth()
```

#### Protected Route Component
```typescript
<ProtectedRoute requiredRole="administrator">
  <YourComponent />
</ProtectedRoute>
```

#### Pages
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Main dashboard with tabs
  - Overview tab: Quick stats and getting started
  - Team tab: Role management
  - Usage tab: Usage monitoring

## Usage Examples

### 1. Track a Metric

```javascript
// Backend: Track metric when event occurs
const trackEvent = async (tenantId, metricName, value) => {
  const response = await fetch(
    `${API_BASE_URL}/usage/tenants/${tenantId}/usage/track`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        metricName,  // e.g., 'page_views'
        value
      })
    }
  );
};
```

### 2. Check User Permission Before Action

```typescript
// Frontend: Check permissions before showing UI
if (currentTenant?.role === 'owner' || currentTenant?.role === 'administrator') {
  // Show team management UI
}
```

### 3. Protected API Call

```typescript
// Frontend: All API calls include auth token and tenant ID
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': currentTenant.id
  }
});
```

### 4. Add Team Member

```typescript
// Check permission: requireRole(['owner', 'administrator'])
const addMember = async (email, role) => {
  const response = await fetch(
    `/auth/tenants/${tenantId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ email, role })
    }
  );
};
```

## Database Tables

### Authentication Tables
- `users` - User accounts
- `tenant_members` - User-tenant relationship with roles
- `tenant_subscriptions` - Subscription per tenant
- `subscription_plans` - Available plans

### RBAC Tables
- `role_permissions` - Permission mappings

### Usage Tables
- `usage_metrics` - Daily usage metrics
- `usage_summary` - Aggregated daily summary
- `usage_alerts` - Generated alerts
- `feature_flags` - Tenant features

All tables use Row Level Security (RLS) for multi-tenant isolation.

## Middleware Chain

### Authentication Flow
```
Request
  ↓
authenticate middleware (verify JWT, load user)
  ↓
withTenantContext middleware (verify tenant access)
  ↓
requireRole middleware (check user role)
  ↓
requirePermission middleware (check specific permission)
  ↓
Route Handler
```

## Security Features

1. **JWT Authentication** - Token-based auth with 24h expiration
2. **Password Hashing** - bcrypt with salt rounds
3. **Row Level Security** - Database-level tenant isolation
4. **Permission Checking** - All endpoints verify permissions
5. **CORS Protection** - Controlled cross-origin access
6. **Tenant Isolation** - Users cannot access other tenants' data

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sitepilot
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Next Steps

### To implement:

1. **Email Notifications**
   ```typescript
   // Send alerts via email when limits reached
   - Alert emails to owners/admins
   - Daily digest reports
   - Upgrade recommendations
   ```

2. **Billing Integration**
   ```typescript
   // Stripe/PayPal integration
   - Payment processing
   - Subscription management
   - Invoice generation
   ```

3. **Advanced Analytics**
   ```typescript
   // Enhanced tracking
   - User behavior analytics
   - Performance metrics
   - Custom dashboards
   ```

4. **Audit Logging**
   ```typescript
   // Track all actions
   - User activity log
   - Admin actions
   - Data changes
   ```

5. **Export & Reporting**
   ```typescript
   // Generate reports
   - CSV/PDF exports
   - Scheduled reports
   - Custom reports
   ```

## Testing the System

### 1. Create Account
```
POST /auth/signup
{
  "email": "owner@example.com",
  "password": "password123",
  "tenantName": "My Business"
}
```

### 2. Login
```
POST /auth/login
{
  "email": "owner@example.com",
  "password": "password123"
}
```

### 3. Invite Team Member
```
POST /auth/tenants/{tenantId}/members
{
  "email": "editor@example.com",
  "role": "editor"
}
```

### 4. Track Usage
```
POST /usage/tenants/{tenantId}/usage/track
{
  "metricName": "page_views",
  "value": 100
}
```

### 5. View Usage
```
GET /usage/tenants/{tenantId}/usage/current
```

## Troubleshooting

### Authentication issues
- Check JWT_SECRET is set
- Verify token format in Authorization header
- Check token expiration

### Permission denied errors
- Verify user is member of tenant
- Check user role has required permission
- Ensure x-tenant-id header is correct

### Usage data not showing
- Verify metrics have been tracked
- Check date range in query
- Ensure user has view_usage permission

## Support

For more information, see `RBAC_USAGE_GUIDE.md` for complete API documentation.
