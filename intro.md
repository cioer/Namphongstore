# Giới thiệu Cấu trúc Dự án NamPhongStore

Tài liệu này cung cấp cái nhìn tổng quan chi tiết về cấu trúc file, công nghệ sử dụng và chức năng của các thành phần trong dự án **NamPhongStore**.

## 1. Tổng quan Công nghệ
Dự án là một ứng dụng E-commerce hiện đại được xây dựng trên nền tảng:
- **Framework**: Next.js 14 (App Router)
- **Ngôn ngữ**: TypeScript
- **UI Library**: Ant Design (Admin Dashboard), TailwindCSS/CSS Modules (Storefront)
- **Database**: PostgreSQL (quản lý bởi Prisma ORM)
- **Testing**: Vitest (Unit/Integration), Playwright (E2E)
- **Containerization**: Docker

## 2. Cấu trúc Thư mục Gốc

### Cấu hình & Môi trường
| File | Chức năng |
|------|-----------|
| `package.json` | Quản lý các thư viện phụ thuộc (dependencies) và các lệnh scripts (dev, build, start, test). |
| `tsconfig.json` | Cấu hình TypeScript cho dự án, đảm bảo type-safety. |
| `next.config.js` | Cấu hình Next.js (security headers, image domains, build optimization, tree-shaking). |
| `next-env.d.ts` | Type definitions tự động sinh ra bởi Next.js. |
| `.env` | Biến môi trường (Database URL, API Keys - *không được commit*). |

### Docker & Deployment
| File | Chức năng |
|------|-----------|
| `Dockerfile` | File cấu hình để đóng gói ứng dụng thành Docker Image production-ready. |
| `docker-compose.yml` | Định nghĩa các services (App, Database) để chạy môi trường local hoặc production đồng bộ. |

### Testing Config
| File | Chức năng |
|------|-----------|
| `vitest.config.ts` | Cấu hình cho Vitest (Unit Test). |
| `vitest.integration.config.ts` | Cấu hình riêng cho Integration Test (kết nối DB thực). |
| `playwright.config.ts` | Cấu hình cho Playwright (End-to-End Testing). |

## 3. Mã Nguồn (`src/`)

Đây là nơi chứa toàn bộ logic của ứng dụng.

### 3.1. `src/app/` (App Router)
Sử dụng cơ chế file-system routing của Next.js. Mỗi thư mục có `page.tsx` là một route.

#### **Admin Dashboard (`src/app/admin/`)**
Giao diện quản trị dành cho nhân viên và quản lý.
- **`layout.tsx`**: Layout chung cho admin (Sidebar, Header, Auth Check).
- **`orders/`**: Quản lý đơn hàng (Xem chi tiết, cập nhật trạng thái, in hóa đơn).
- **`products/`**: Quản lý sản phẩm (Thêm/Sửa/Xóa, quản lý tồn kho, giá).
- **`returns/`**: Xử lý yêu cầu đổi trả và bảo hành từ khách hàng.
- **`audit-logs/`**: Xem lịch sử hoạt động hệ thống (ai đã làm gì, vào lúc nào).
- **`users/`, `coupons/`, `promotions/`**: Quản lý người dùng, mã giảm giá và chương trình khuyến mãi.

#### **Customer Storefront**
Giao diện dành cho khách hàng mua sắm.
- **`page.tsx`**: Trang chủ (Home).
- **`p/[slug]/`**: Trang chi tiết sản phẩm (Product Detail) - Dynamic Route.
- **`c/[slug]/`**: Trang danh mục sản phẩm (Category).
- **`cart/`**: Giỏ hàng.
- **`checkout/`**: Trang thanh toán.
- **`track-order/`**: Tra cứu đơn hàng (dành cho khách vãng lai).
- **`orders/`**: Lịch sử đơn hàng của khách đã đăng nhập.

#### **API Routes (`src/app/api/`)**
Backend endpoints xử lý logic nghiệp vụ và kết nối Database (Server-side).
- **`admin/`**: Các API bảo mật cho admin (Auth, CRUD Products, Orders, Audit Logs).
- **`auth/`**: Xử lý đăng nhập/đăng ký/session.
- **`orders/`**: Tạo đơn hàng, xử lý thanh toán, cập nhật trạng thái.
- **`products/`**: Lấy danh sách sản phẩm public, tìm kiếm.
- **`returns/`**: Logic xử lý đổi trả (Approve/Reject/Complete).
- **`upload/`**: Upload hình ảnh (sử dụng cho sản phẩm hoặc minh chứng đổi trả).

### 3.2. `src/components/`
Chứa các React Components tái sử dụng.
- **`AppLayout.tsx`**: Layout chính của trang khách hàng (Header, Footer).
- **`Header.tsx`**: Thanh điều hướng, giỏ hàng mini, search bar.
- **`ProductCard.tsx`**: Hiển thị tóm tắt sản phẩm dạng thẻ (Grid view).
- **`ProductForm.tsx`**: Form dùng chung cho việc Tạo mới và Chỉnh sửa sản phẩm (Admin).
- **`AddToCartButton.tsx`**: Nút thêm vào giỏ hàng với logic xử lý state và animation.
- **`ImageGallery.tsx`**: Component hiển thị ảnh sản phẩm chi tiết.

### 3.3. `src/lib/`
Các hàm tiện ích và cấu hình chung.
- **`prisma.ts`**: Khởi tạo Prisma Client (Singleton pattern) để kết nối Database, tránh lỗi too many connections trong môi trường dev.
- **`utils.ts`**: Các hàm helper (format tiền tệ VNĐ, xử lý ngày tháng, validate dữ liệu).

## 4. Database (`prisma/`)
- **`schema.prisma`**: "Trái tim" của dữ liệu. Định nghĩa cấu trúc Database (Models: User, Product, Order, OrderItem, ReturnRequest, WarrantyUnit...).
- **`migrations/`**: Lịch sử thay đổi cấu trúc DB (Version control cho Database).
- **`seed.ts`**: Script tạo dữ liệu mẫu ban đầu (Admin user, Sample products) để chạy thử dự án.

## 5. Testing (`tests/`)
- **`e2e/`**: Các kịch bản kiểm thử luồng người dùng thật (End-to-End) bằng Playwright.
    - `checkout-flow.spec.ts`: Test luồng mua hàng.
    - `return-replacement.spec.ts`: Test luồng đổi trả.
- **`integration/`**: Kiểm thử tích hợp các logic phức tạp bằng Vitest.
    - `cancel-rule.test.ts`: Kiểm tra quy tắc hủy đơn.
    - `return-window.test.ts`: Kiểm tra thời hạn đổi trả.
- **`setup.ts`**: Thiết lập môi trường test (Mock DB, Reset state).

## 6. Hướng dẫn Cài đặt & Triển khai (Khi chuyển máy)

Để chạy dự án trên một máy tính mới, hãy làm theo các bước sau:

### Bước 1: Yêu cầu Hệ thống
Đảm bảo máy tính đã cài đặt:
- **Node.js**: Phiên bản 18.x trở lên.
- **Git**: Để quản lý mã nguồn.
- **PostgreSQL**: Database server (hoặc sử dụng Docker).
- **Docker Desktop** (Khuyên dùng): Để chạy Database nhanh chóng mà không cần cài đặt trực tiếp.

### Bước 2: Lấy Mã nguồn
```bash
git clone <repository-url>
cd NamPhongStore
```

### Bước 3: Cài đặt Thư viện
```bash
npm install
```

### Bước 4: Cấu hình Môi trường
Tạo file `.env` tại thư mục gốc (copy từ `.env.example` nếu có) và điền thông tin:
```env
# Kết nối Database (Ví dụ local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/namphongstore?schema=public"

# Khóa bí mật cho Auth (Tự sinh chuỗi ngẫu nhiên)
JWT_SECRET="your-super-secret-key"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Bước 5: Khởi tạo Database
1. **Chạy Database** (nếu dùng Docker):
   ```bash
   docker-compose up -d db
   ```
2. **Đồng bộ Schema & Tạo dữ liệu mẫu**:
   ```bash
   # Tạo bảng trong DB dựa trên schema.prisma
   npx prisma migrate dev

   # (Tùy chọn) Reset DB và nạp dữ liệu mẫu
   npx prisma db seed
   ```

### Bước 6: Chạy Ứng dụng
- **Môi trường Development**:
  ```bash
  npm run dev
  ```
  Truy cập: `http://localhost:3000`

- **Môi trường Production (Build thử)**:
  ```bash
  npm run build
  npm start
  ```

### Bước 7: Tài khoản Admin Mặc định (Sau khi Seed)
- **Email**: `admin@namphong.com`
- **Password**: `Admin123!` (hoặc xem trong `prisma/seed.ts`)

---
*Tài liệu này được cập nhật ngày 26/12/2025.*
