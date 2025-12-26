# Điện máy Nam Phong - E-Commerce Platform

Full-stack Next.js e-commerce platform for Vietnamese electronics store with COD, warranty tracking, and returns management.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Ant Design
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites
- Docker Desktop (Windows)
- Node.js 20+ (for local development outside Docker)

### Run with Docker (Recommended)

```bash
# Clone and navigate to project
cd NamPhongStore

# Start all services (PostgreSQL + Next.js app)
docker compose up --build

# App will be available at http://localhost:3000
# Database migrations and seed data run automatically
```

### Development Scripts

Inside the container or locally:

```bash
# Run migrations
npm run migrate

# Run seed data
npm run seed

# Reset database (drops all data, re-runs migrations, re-seeds)
npm run reset

# Open Prisma Studio (database viewer)
npm run prisma:studio
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema (9 models)
│   └── seed.ts             # Seed data script
├── src/
│   ├── app/                # Next.js App Router pages & API Routes
│   ├── components/         # React Components
│   │   ├── admin/          # Admin-specific components
│   │   ├── layout/         # Layout components (Header, etc.)
│   │   └── shop/           # Storefront components
│   ├── services/           # Business Logic Layer (Product, Order services)
│   ├── types/              # Shared TypeScript interfaces
│   └── lib/                # Utilities (Prisma client, etc.)
├── docker-compose.yml      # Docker services config
├── Dockerfile              # App container config
└── README.md
```

## Architecture Highlights

### Service Layer Pattern
We use a Service Layer pattern to separate business logic from the API routes and UI components. This ensures:
- **Reusability**: Logic can be called from API routes, Server Actions, or background jobs.
- **Testability**: Services are easier to unit test than API routes.
- **Maintainability**: Clear separation of concerns.

Key services:
- `product.service.ts`: Handles product CRUD, filtering, and audit logging.
- `order.service.ts`: Handles order creation, validation, coupon application, and status management.

### Component Organization
Components are organized by domain:
- `components/layout`: Global layout elements (Header, Footer).
- `components/shop`: Customer-facing components (ProductCard, Cart).
- `components/admin`: Admin dashboard components (ProductForm, OrderTable).

## Database Models

1. **User** - Admin/Sales/Tech roles
2. **Category** - Product categories (hierarchical)
3. **Product** - Electronics with specs, pricing, promos
4. **Order** - Customer orders with status machine
5. **OrderItem** - Line items with snapshots
6. **WarrantyUnit** - Per-unit warranty tracking
7. **ReturnRequest** - Return/replacement requests
8. **AuditLog** - Product change history
9. **EventLog** - Order/warranty/return events timeline

## Seed Data

- 3 users (Admin, Sales, Tech)
- 6+ categories (Tủ lạnh, Máy giặt, Điều hòa, Tivi, Bếp điện, Nồi cơm)
- 100 products with Vietnamese names, realistic pricing
- 15 sample orders (various statuses)
- Warranty units for delivered orders
- Sample return requests

## Admin Credentials

```
Email: admin@namphong.vn
Password: admin123
```

## Features Implemented

### ✅ P01: Foundation
- Docker Compose setup (PostgreSQL + Next.js)
- Prisma schema with 9 models
- Seed data (100 products, 15 orders)
- Volumes for database and uploads

### ✅ P02: Storefront Catalog
- Home page (hero, deals, bestsellers)
- Category pages with filters and sorting
- Product detail page with tabs
- Search functionality

### ✅ P03: Cart & Checkout
- Shopping cart with localStorage
- 1-step COD checkout form
- Order creation with snapshots
- Success page with order tracking

### ✅ P04: Customer Order Tracking
- Track orders by phone number
- Order list and detail pages
- Status timeline visualization
- Cancel order functionality
- Warranty codes display

### ✅ P05: Admin Order Operations
- Admin login (`/admin/login`)
- Admin orders list (`/admin/orders`)
- Admin order detail (`/admin/orders/[id]`)
- Status transitions (NEW → CONFIRMED → SHIPPING → DELIVERED)
- **Auto-warranty generation on DELIVERED:**
  - Transaction-based and idempotent
  - Creates WarrantyUnit per item quantity (qty=2 → 2 units)
  - Generates unique warranty codes (NP-WTY-YYMM-XXXXX)
  - Snapshots warranty_months from OrderItem
  - Fixed end_date calculation
- EventLog timeline tracking
- Enforced status transition rules

### ✅ P06: Returns & Replacement Flow
- **Customer return request from order detail:**
  - Image upload (<=5 files, <=5MB each) with preview
  - 30-day window validation from delivered_date
  - Reason field with min 10 characters
  - Optional warranty unit selection
- **Admin returns management (`/admin/returns`):**
  - Returns list with filters by status
  - Approve/reject with admin notes
  - Sales/Admin can approve or reject
- **Tech replacement completion:**
  - Create new WarrantyUnit with fresh warranty period
  - Link old warranty: `old.replaced_by = new.id`
  - Mark old warranty as REPLACED
  - Update return status to COMPLETED
- **EventLog tracking:**
  - RETURN_CREATED
  - RETURN_APPROVED / RETURN_REJECTED
  - RETURN_COMPLETED
  - WARRANTY_REPLACED
  - WARRANTY_NEW_CREATED_FROM_REPLACEMENT
- Returns display on customer order detail page

### ✅ P07: Admin Product Management + Audit Logs
- **Admin product pages (`/admin/products`):**
  - Product list with search, filter, edit, delete
  - Create new product (`/admin/products/new`)
  - Edit existing product (`/admin/products/[id]/edit`)
- **Dynamic editors:**
  - Specs: key-value rows (add/remove)
  - Gifts: list items (add/remove)
  - Images: URL list with live preview (add/remove)
  - Pricing: original, sale, discount%, promo window (UTC DatePicker)
- **AuditLog tracking:**
  - On submit only (no autosave)
  - CREATE: captures after_json
  - UPDATE: captures before_json + after_json + changed_fields array
  - Automatic field comparison
  - Only logs when changes detected
- **Audit logs viewer (`/admin/audit-logs`):**
  - Table with filters (CREATE/UPDATE/DELETE)
  - Expandable rows showing before/after JSON
  - react-json-view for collapsible JSON display
  - Changed fields displayed as tags
  - Admin-only access

## Testing P05-P07

### P05: Admin Order Operations
1. Start the application:
```bash
docker compose up --build
```

2. Login to admin panel:
   - Navigate to `http://localhost:3000/admin/login`
   - Email: `admin@namphong.vn`
   - Password: `admin123`

3. Test order workflow:
   - View orders list at `/admin/orders`
   - Click any order with status NEW
   - Click "Xác nhận đơn" to transition to CONFIRMED
   - Click "Bắt đầu giao hàng" to transition to SHIPPING
   - Click "Xác nhận đã giao" to transition to DELIVERED
   - **Verify warranty codes are generated** in the warranty section
   - Check timeline shows all events including WARRANTY_CODES_GENERATED

4. Test idempotency:
   - Try clicking the delivered transition multiple times
   - Verify only one set of warranty units created
   - Check no duplicate warranty codes

### P06: Returns & Replacement
1. **Customer creates return request:**
   - Place an order and set it to DELIVERED via admin panel
   - As customer, go to `/orders/[id]`
   - Click "Yêu cầu đổi trả" button (only visible for DELIVERED orders within 30 days)
   - Select warranty unit (optional)
   - Enter reason (min 10 characters)
   - Upload 1-5 images (max 5MB each)
   - Submit request

2. **Admin approves return:**
   - Login to admin panel
   - Go to `/admin/returns`
   - Click on the return request
   - Click "Duyệt yêu cầu"
   - Add optional admin note
   - Confirm approval

3. **Tech completes replacement:**
   - Login with TECH or ADMIN role
   - Go to approved return in `/admin/returns/[id]`
   - Click "Hoàn tất thay thế"
   - System creates new WarrantyUnit
   - Old warranty marked as REPLACED
   - Old.replaced_by links to new warranty ID

4. **Verify warranty linking:**
   - Check order detail shows new warranty code
   - Old warranty status shows REPLACED
   - EventLog shows all replacement events
   - Customer can see return history on order page

5. **Test 30-day window:**
   - Try creating return for order delivered >30 days ago
   - Should receive error message about expired window

### P07: Product Management & Audit Logs
1. **Create new product:**
   - Login to admin panel
   - Navigate to `/admin/products`
   - Click "Thêm sản phẩm"
   - Fill in basic info (name, slug, brand, category)
   - Add specs using key-value rows (click + to add more)
   - Add gifts as a list (optional)
   - Add image URLs (preview shown automatically)
   - Set pricing and optional promo window (UTC DatePicker)
   - Click "Tạo sản phẩm"

2. **Edit existing product:**
   - From products list, click "Sửa" on any product
   - Modify fields (price, promo dates, specs, etc.)
   - Click "Cập nhật sản phẩm"
   - System automatically detects changed fields
   - AuditLog created with before_json + after_json + changed_fields

3. **View audit logs:**
   - Navigate to `/admin/audit-logs`
   - Filter by action type (CREATE/UPDATE/DELETE)
   - Click expand icon to view before/after JSON comparison
   - Changed fields shown as tags
   - Use react-json-view to explore nested data

4. **Test audit tracking:**
   - Edit a product's price: 1000000 → 800000
   - Check audit log shows:
     - before_json: {..., "price_original": 1000000}
     - after_json: {..., "price_original": 800000}
     - changed_fields: ["price_original"]

5. **Test form editors:**
   - Add/remove specs dynamically
   - Add/remove gifts dynamically  
   - Add/remove image URLs (check preview updates)
   - Set promo dates → verify stored as UTC ISO strings
   - Submit → verify specs converted from array to JSON object

## Volumes

- `postgres_data` - PostgreSQL data persistence
- `uploads` - Customer return request images (mounted to /app/public/uploads)

## Testing

### Test Coverage

The project includes comprehensive tests:

**A) Unit Tests (Vitest)**
- `formatVND()` - Vietnamese currency formatting
- `isPromoActive()` - Promo window validation with UTC
- `generateWarrantyCode()` - Warranty code format (NP-WTY-YYMM-XXXXX)

**B) Integration Tests (Vitest + Prisma)**
1. **Delivered Idempotency** - Ensures warranty codes generated once, qty=2 → 2 units
2. **Snapshot Integrity** - OrderItem price & warranty months remain unchanged after product updates
3. **Cancel Rule** - NEW/CONFIRMED can cancel, SHIPPING/DELIVERED cannot
4. **Return Window** - 30-day validation from delivered_date
5. **Replacement Link** - old.replaced_by = new.id, status REPLACED → ACTIVE

**C) E2E Tests (Playwright)**
- **Flow 1**: Browse → Cart → Checkout → Success shows order_code
- **Flow 2**: Admin DELIVERED → Warranty codes auto-generated → Customer sees codes
- **Flow 3**: Return request → Approve → Complete replacement → New warranty appears

### Running Tests

```bash
# Install dependencies (if not already done)
npm install --legacy-peer-deps

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run integration tests (requires Docker with database running)
docker compose up -d postgres
npm run test:integration

# Run E2E tests (requires app running)
docker compose up --build -d
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Install Playwright browsers (first time only)
npx playwright install chromium
```

### Test Results

✅ **Unit Tests**: 15/15 passing
- formatVND: 3 tests
- isPromoActive: 7 tests
- generateWarrantyCode: 5 tests

✅ **Integration Tests**: 5 test suites covering critical business logic
- Delivered idempotency
- Snapshot integrity
- Cancel rules
- 30-day return window
- Warranty replacement linking

✅ **E2E Tests**: 3 smoke test flows
- Checkout flow (browse → cart → checkout → success)
- Warranty generation (admin DELIVERED → codes appear)
- Return & replacement (request → approve → complete → new warranty)

### Known Test Limitations

- Integration tests require PostgreSQL running (Docker)
- E2E tests require full app stack running
- File upload testing skipped in E2E (complex setup)
- Some E2E tests use flexible selectors due to localization (vi-VN)

## Next Steps (P08)

- [x] P01: Foundation
- [x] P02: Storefront catalog pages
- [x] P03: Cart & COD checkout
- [x] P04: Customer order tracking
- [x] P05: Admin order operations + warranty auto-generation
- [x] P06: Returns & replacement flow
- [x] P07: Admin product management + audit logs
- [x] P08: Tests (unit/integration/E2E)

## Known Limitations (Demo MVP)

### Security & Auth
- Simple session-based auth (not production-ready)
- Plain-text password comparison (demo only - use bcrypt in production)
- No rate limiting or CSRF protection
- No password reset functionality

### Business Logic
- No stock auto-decrement on orders
- No payment gateway integration (COD only)
- No email notifications
- No SMS verification for phone numbers

### Infrastructure
- No CDN for images (using direct URLs)
- No Redis caching layer
- No search indexing (Elasticsearch/Algolia)
- No monitoring/logging service

### Testing
- E2E tests use flexible selectors (may need updates for UI changes)
- No load testing or performance benchmarks
- File upload not fully tested in E2E
- Integration tests assume clean database state

**Note**: This is a demo/MVP. For production, implement proper authentication, encryption, monitoring, and comprehensive error handling.

