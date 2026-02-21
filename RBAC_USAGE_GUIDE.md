# Role-Based Access Control & Usage Monitoring

## Overview

This system implements a comprehensive multi-tenant platform with role-based access control (RBAC) and usage monitoring capabilities.

## Role-Based Access Control (RBAC)

### User Roles

The system defines 6 user roles with different permission levels:

#### 1. **Owner**
- Full access to all platform features
- Can manage team members and roles
- Can manage billing and subscriptions
- Can manage domains and settings
- Can manage projects and content
- **Best for:** Tenant account owners

#### 2. **Administrator**
- Can manage team members and their roles
- Can manage projects and domains
- Can view analytics and usage
- Can manage settings
- **Cannot:** Manage billing or change subscriptions
- **Best for:** Technical leads or team managers

#### 3. **Editor**
- Can create and edit projects
- Can create and publish content
- Can view analytics
- **Cannot:** Manage users or billing
- **Best for:** Content creators and editors

#### 4. **Developer**
- Can edit content and projects
- Can access API (if enabled in plan)
- Can view usage metrics
- **Cannot:** Publish content or manage users
- **Best for:** Backend developers and API users

#### 5. **Viewer**
- Read-only access to projects
- Can view analytics and usage data
- **Cannot:** Edit or publish content
- **Best for:** Stakeholders and reporting

#### 6. **Super Admin**
- Full system access (backend only)
- Can manage all tenants and users
- **Best for:** Platform administrators

### Permission Model

Permissions are defined in the `role_permissions` table and include:

- `create_project` - Create new projects
- `edit_project` - Edit existing projects
- `delete_project` - Delete projects
- `manage_users` - Add/remove team members
- `manage_roles` - Modify user roles
- `manage_domains` - Configure domains
- `view_analytics` - View analytics data
- `view_billing` - View billing information
- `manage_billing` - Update billing settings
- `invite_users` - Send invitations
- `view_usage` - View usage metrics
- `edit_content` - Edit content
- `publish_content` - Publish content
- `manage_settings` - Manage tenant settings

## API Endpoints

### Authentication

#### Sign Up
```
POST /auth/signup
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Company" // Optional
}
```

#### Login
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response includes:
- user: User object with permissions
- tenants: Array of accessible tenants
- token: JWT token for authentication
```

#### Get Current User
```
GET /auth/me
Headers:
  Authorization: Bearer {token}
```

### Team Management

#### Get Team Members
```
GET /auth/tenants/{tenantId}/members
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: owner or administrator role
```

#### Add Team Member
```
POST /auth/tenants/{tenantId}/members
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Body:
{
  "email": "newmember@example.com",
  "role": "editor"
}
Requires: owner or administrator role
```

#### Update Member Role
```
PUT /auth/tenants/{tenantId}/members/{memberId}/role
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Body:
{
  "role": "administrator"
}
Requires: owner or administrator role
```

#### Remove Member
```
DELETE /auth/tenants/{tenantId}/members/{memberId}
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: owner or administrator role
```

## Usage Monitoring & Observability

### Tracked Metrics

The system automatically tracks:

#### Resource Usage
- **Team Members**: Count of active team members
- **Projects**: Number of projects created
- **Domains**: Active domains
- **Storage**: MB of data stored
- **Bandwidth**: GB of bandwidth used

#### Performance Metrics
- **Page Views**: Total page views
- **Unique Visitors**: Count of unique visitors
- **API Calls**: Number of API requests
- **Request Count**: Total HTTP requests

### Usage API Endpoints

#### Get Current Usage
```
GET /usage/tenants/{tenantId}/usage/current
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: view_usage permission

Response:
{
  "usage": {
    "total_users": 2,
    "total_projects": 5,
    "total_requests": 1500,
    "api_calls": 250,
    "storage_used_mb": 150.5,
    "bandwidth_used_gb": 10.25,
    "active_domains": 2,
    "page_views": 5000,
    "unique_visitors": 450
  },
  "limits": {
    "max_users": 10,
    "max_projects": 50,
    "max_domains": 5,
    "max_traffic_gb": 100,
    "features": {...}
  },
  "alerts": [...]
}
```

#### Get Usage Summary
```
GET /usage/tenants/{tenantId}/usage/summary
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - period: last_7_days | last_30_days (default: last_30_days)

Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: view_usage permission
```

#### Get Usage Breakdown
```
GET /usage/tenants/{tenantId}/usage/breakdown
Query Parameters:
  - metric: specific metric name (optional)
  - days: number of days to include (default: 30)

Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: view_usage permission
```

#### Get Active Alerts
```
GET /usage/tenants/{tenantId}/usage/alerts
Query Parameters:
  - includeResolved: true | false (default: false)

Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: view_usage permission
```

#### Get Optimization Suggestions
```
GET /usage/tenants/{tenantId}/usage-suggestions
Headers:
  Authorization: Bearer {token}
  x-tenant-id: {tenantId}
Requires: view_usage permission

Response includes suggestions for:
- Plan upgrades when approaching limits
- Optimization opportunities for better engagement
- Cost reduction recommendations
```

### Alert System

The platform automatically generates alerts when usage approaches limits:

#### Alert Types
- **Approaching User Limit** (80%+ of max users)
- **Approaching Project Limit** (80%+ of max projects)
- **Approaching Bandwidth Limit** (80%+ of max traffic)
- **High Bounce Rate** (optimization suggestion)

#### Alert Management
- Alerts include context: current value, limit, and percentage
- Alerts can be marked as resolved
- Resolved alerts are tracked for historical purposes

### Optimization Suggestions

The system provides intelligent recommendations based on usage patterns:

#### Upgrade Recommendations
- If approaching any resource limit, suggests upgrading to a higher tier plan
- Includes current usage and cost savings

#### Performance Optimizations
- Analyzes engagement metrics
- Suggests content optimizations when bounce rates are high
- Recommends feature enablement for underutilized plans

## Subscription Plans

### Available Plans

#### Free Plan
- 1 user
- 3 projects
- 1 domain
- 5 GB traffic
- Basic analytics disabled

#### Starter Plan
- 3 users
- 10 projects
- 1 domain
- 50 GB traffic
- Analytics enabled

#### Pro Plan
- 10 users
- 50 projects
- 5 domains
- 500 GB traffic
- Full features including team collaboration and API access

#### Enterprise Plan
- Unlimited users
- Unlimited projects
- Unlimited domains
- 9999 GB traffic
- Priority support and SSO

## Frontend Components

### Auth Context (`AuthContext.tsx`)
Manages authentication state and provides:
- Login/Signup functions
- Token management
- Current user and tenant state
- Tenant selection

### Login Page (`login/page.tsx`)
Email and password authentication with redirect to dashboard

### Signup Page (`signup/page.tsx`)
User registration with optional organization creation

### Role Management Component (`RoleManagement.tsx`)
- View all team members
- Add new team members
- Update member roles
- Remove members
- Role descriptions and permissions

### Usage Dashboard (`UsageDashboard.tsx`)
- Current usage metrics with progress bars
- Usage alerts and warnings
- Optimization suggestions
- Engagement metrics
- Plan limits display

## Database Schema

### Key Tables

- **users**: User accounts
- **tenant_subscriptions**: Subscription info per tenant
- **tenant_members**: User-tenant relationships with roles
- **role_permissions**: Role to permission mappings
- **usage_metrics**: Daily metric tracking
- **usage_summary**: Aggregated daily usage
- **usage_alerts**: Generated alerts
- **feature_flags**: Tenant feature controls
- **subscription_plans**: Available plans

All tables have Row Level Security (RLS) enabled for multi-tenant isolation.

## Security Features

1. **JWT Authentication**: Token-based authentication
2. **Row Level Security**: Database-level isolation per tenant
3. **Permission Checking**: All endpoints verify user permissions
4. **Tenant Isolation**: Users can only access their tenant's data
5. **Secure Passwords**: bcrypt password hashing
6. **CORS Protection**: Controlled cross-origin requests

## Implementation Checklist

- [x] Database schema for RBAC and usage tracking
- [x] Authentication endpoints (signup, login, me)
- [x] Team member management API
- [x] Role validation middleware
- [x] Usage tracking endpoints
- [x] Alert system
- [x] Suggestion engine
- [x] Frontend Auth Context
- [x] Frontend authentication pages
- [x] Role management component
- [x] Usage dashboard component
- [ ] Email notifications for alerts
- [ ] Billing integration
- [ ] Advanced analytics
- [ ] Audit logging
