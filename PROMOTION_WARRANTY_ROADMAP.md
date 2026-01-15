# 📊 ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN HỆ THỐNG KHUYẾN MÃI & BẢO HÀNH

## 🔍 1. TỔNG QUAN HIỆN TRẠNG

### A. KHUYẾN MÃI (PROMOTION)

#### **Cấu trúc dữ liệu hiện tại:**
```typescript
Product {
  price_original    Decimal
  price_sale        Decimal
  discount_percent  Int
  promo_start       DateTime?
  promo_end         DateTime?
}

OrderItem {
  unit_price_at_purchase  Decimal
  promo_snapshot          Json?  // Snapshot khuyến mãi tại thời điểm mua
}
```

#### **Logic hiện tại:**
1. ✅ **Snapshot promotion khi đặt hàng** - Tốt, đảm bảo tính toàn vẹn dữ liệu
2. ✅ **Kiểm tra thời gian hiệu lực** (`promo_start` -> `promo_end`)
3. ✅ **Tách biệt giá gốc/giá sale**

#### **⚠️ HẠN CHẾ:**
1. ❌ **Chỉ hỗ trợ 1 loại khuyến mãi** - Giảm giá theo % trực tiếp
2. ❌ **Không có promotion theo sản phẩm combo**
3. ❌ **Không có flash sale (giới hạn số lượng)**
4. ❌ **Không có promotion theo điều kiện** (mua X tặng Y)
5. ❌ **Không theo dõi hiệu quả promotion**
6. ❌ **Promotion quản lý tại Product level** - Không linh hoạt

---

### B. BẢO HÀNH (WARRANTY)

#### **Cấu trúc dữ liệu hiện tại:**
```typescript
Product {
  warranty_months  Int @default(12)
}

OrderItem {
  warranty_months_snapshot Int @default(12)
}

WarrantyUnit {
  warranty_code_auto         String @unique
  serial_no                  String? @unique
  warranty_months_at_purchase Int
  start_date                 DateTime
  end_date                   DateTime
  status                     WarrantyStatus // ACTIVE, EXPIRED, REPLACED
  replaced_by                String? // Link to new warranty
}
```

#### **Logic hiện tại:**
1. ✅ **Snapshot warranty months khi mua** - Tốt
2. ✅ **Tự động tạo warranty code khi DELIVERED**
3. ✅ **Hỗ trợ thay thế bảo hành** (chain replacement)
4. ✅ **Quản lý từng unit riêng biệt** (cho quantity > 1)
5. ✅ **Idempotency check** - Không tạo trùng warranty

#### **⚠️ HẠN CHẾ:**
1. ❌ **Chưa có bảo hành mở rộng** (extended warranty)
2. ❌ **Chưa hỗ trợ bảo hành theo loại** (chính hãng, shop)
3. ❌ **Không track lịch sử sửa chữa** (repair history)
4. ❌ **Không có notification nhắc hết hạn bảo hành**
5. ❌ **Serial number không bắt buộc** - Khó quản lý thiết bị vật lý
6. ❌ **Không có warranty transfer** (chuyển nhượng bảo hành)

---

## 🚀 2. HƯỚNG PHÁT TRIỂN CỤ THỂ

### **A. KHUYẾN MÃI - ROADMAP**

#### **Phase 1: Tách Promotion thành Entity độc lập (Priority: HIGH)**

**Mục tiêu:** Quản lý promotion linh hoạt, không gắn cứng vào Product

**Schema mới:**
```prisma
enum PromotionType {
  PERCENTAGE_DISCOUNT   // Giảm % (hiện tại)
  FIXED_DISCOUNT        // Giảm số tiền cố định
  BUY_X_GET_Y          // Mua X tặng Y
  BUNDLE_DEAL          // Combo sản phẩm
  FLASH_SALE           // Flash sale giới hạn
  FREE_SHIPPING        // Miễn phí ship
}

enum PromotionTarget {
  PRODUCT       // Áp dụng cho sản phẩm cụ thể
  CATEGORY      // Áp dụng cho danh mục
  ALL_PRODUCTS  // Áp dụng toàn bộ
  BRAND         // Áp dụng theo thương hiệu
}

model Promotion {
  id                String         @id @default(cuid())
  name              String         // "Flash Sale iPhone 15"
  code              String?        @unique // "IPHONE15"
  description       String?
  
  type              PromotionType
  target_type       PromotionTarget
  
  // Discount settings
  discount_percent  Int?           // For PERCENTAGE_DISCOUNT
  discount_amount   Decimal?       // For FIXED_DISCOUNT
  max_discount      Decimal?       // Giới hạn giảm tối đa
  
  // Buy X Get Y settings
  buy_quantity      Int?
  get_quantity      Int?
  get_product_id    String?
  
  // Flash sale settings
  stock_limit       Int?           // Số lượng giới hạn
  stock_used        Int @default(0)
  
  // Conditions
  min_order_value   Decimal?
  max_uses_per_user Int?
  
  // Validity
  start_date        DateTime
  end_date          DateTime
  is_active         Boolean @default(true)
  
  // Tracking
  total_used        Int @default(0)
  total_revenue     Decimal @default(0)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  product_promotions ProductPromotion[]
  category_promotions CategoryPromotion[]
  order_items       OrderItem[] // Track usage
  
  @@index([code])
  @@index([is_active])
  @@index([start_date, end_date])
  @@map("promotions")
}

model ProductPromotion {
  id           String @id @default(cuid())
  promotion_id String
  product_id   String
  priority     Int @default(0) // Nếu có nhiều promotion, ưu tiên cái nào
  
  promotion Product @relation(fields: [promotion_id], references: [id])
  product   Product @relation(fields: [product_id], references: [id])
  
  @@unique([promotion_id, product_id])
  @@map("product_promotions")
}

model CategoryPromotion {
  id           String @id @default(cuid())
  promotion_id String
  category_id  String
  
  promotion Category @relation(fields: [promotion_id], references: [id])
  category  Category @relation(fields: [category_id], references: [id])
  
  @@unique([promotion_id, category_id])
  @@map("category_promotions")
}
```

**Migration Plan:**
1. Tạo bảng `promotions`, `product_promotions`, `category_promotions`
2. Migrate dữ liệu cũ từ `Product.promo_*` sang `Promotion`
3. Update `OrderItem.promo_snapshot` để lưu `promotion_id`
4. Deprecate `Product.promo_start/promo_end` (optional, có thể giữ backward compatibility)

---

#### **Phase 2: Service Layer cho Promotion (Priority: HIGH)**

**File mới:** `src/services/promotion.service.ts`

```typescript
export interface ApplicablePromotion {
  promotion: Promotion;
  discountAmount: number;
  finalPrice: number;
}

export async function getApplicablePromotions(
  productId: string,
  quantity: number,
  userId?: string
): Promise<ApplicablePromotion[]> {
  // Logic tìm promotion áp dụng được
  // - Check thời gian hiệu lực
  // - Check stock limit (flash sale)
  // - Check user usage limit
  // - Check min order value
  // - Priority ranking
}

export async function applyBestPromotion(
  items: CartItem[]
): Promise<{
  originalTotal: number;
  discountTotal: number;
  finalTotal: number;
  appliedPromotions: Map<string, Promotion>;
}> {
  // Logic áp dụng promotion tốt nhất cho giỏ hàng
  // - Tự động chọn promotion có lợi nhất
  // - Handle promotion conflict
  // - Calculate combo deals
}

export async function trackPromotionUsage(
  promotionId: string,
  orderId: string,
  revenue: number
): Promise<void> {
  // Update promotion statistics
}
```

---

#### **Phase 3: Admin UI cho Promotion Management (Priority: MEDIUM)**

**Tính năng:**
1. 📊 **Dashboard promotion analytics**
   - Promotion performance (số lượng dùng, doanh thu)
   - Top promotion hiệu quả nhất
   - Chart theo thời gian

2. 🎯 **Create/Edit promotion wizard**
   - Step 1: Chọn loại promotion
   - Step 2: Set điều kiện (target products, categories)
   - Step 3: Set giá trị discount
   - Step 4: Set thời gian & giới hạn

3. 🔄 **Bulk promotion actions**
   - Enable/Disable hàng loạt
   - Clone promotion
   - Schedule future promotions

---

### **B. BẢO HÀNH - ROADMAP**

#### **Phase 1: Bảo hành mở rộng (Priority: MEDIUM)**

**Schema mới:**
```prisma
enum WarrantyType {
  MANUFACTURER  // Bảo hành hãng
  STORE         // Bảo hành shop
  EXTENDED      // Bảo hành mở rộng (mua thêm)
}

model WarrantyUnit {
  // ... existing fields
  
  warranty_type     WarrantyType @default(MANUFACTURER)
  
  // Extended warranty
  is_extended       Boolean @default(false)
  extended_months   Int?
  extended_price    Decimal?
  extended_purchased_at DateTime?
  
  // Thông tin thiết bị
  device_imei       String? // For điện thoại
  device_serial     String? // Serial chính thức từ hãng
  activation_date   DateTime? // Ngày kích hoạt bảo hành
}

model WarrantyExtension {
  id                String @id @default(cuid())
  warranty_unit_id  String
  months            Int
  price             Decimal
  purchased_at      DateTime
  
  warranty_unit WarrantyUnit @relation(fields: [warranty_unit_id], references: [id])
  
  @@map("warranty_extensions")
}
```

---

#### **Phase 2: Lịch sử sửa chữa & Bảo trì (Priority: HIGH)**

**Schema mới:**
```prisma
enum ServiceType {
  REPAIR           // Sửa chữa
  MAINTENANCE      // Bảo trì
  INSPECTION       // Kiểm tra
  REPLACEMENT      // Thay thế linh kiện
}

enum ServiceStatus {
  PENDING          // Chờ xử lý
  IN_PROGRESS      // Đang sửa
  WAITING_PARTS    // Chờ linh kiện
  COMPLETED        // Hoàn thành
  CUSTOMER_PICKUP  // Chờ khách lấy
  RETURNED         // Đã trả khách
}

model WarrantyService {
  id                String @id @default(cuid())
  warranty_unit_id  String
  service_code      String @unique // "SV-20260114-xxxxx"
  
  type              ServiceType
  status            ServiceStatus @default(PENDING)
  
  issue_description String  // Mô tả lỗi
  technician_note   String? // Ghi chú kỹ thuật
  solution          String? // Giải pháp áp dụng
  
  parts_replaced    Json?   // Danh sách linh kiện thay thế
  labor_cost        Decimal @default(0)
  parts_cost        Decimal @default(0)
  total_cost        Decimal @default(0)
  
  // Tracking
  received_at       DateTime @default(now())
  estimated_completion DateTime?
  completed_at      DateTime?
  returned_at       DateTime?
  
  technician_id     String?
  
  warranty_unit WarrantyUnit @relation(fields: [warranty_unit_id], references: [id])
  technician    User?         @relation(fields: [technician_id], references: [id])
  
  @@index([warranty_unit_id])
  @@index([status])
  @@map("warranty_services")
}
```

**Service layer:**
```typescript
// src/services/warranty.service.ts

export async function createServiceRequest(
  warrantyCode: string,
  issue: string,
  customerId: string
): Promise<WarrantyService> {
  // Validate warranty is still active
  // Create service ticket
  // Send notification to customer
}

export async function getServiceHistory(
  warrantyUnitId: string
): Promise<WarrantyService[]> {
  // Get all repairs/services for this warranty
}

export async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatus,
  note?: string
): Promise<void> {
  // Update status
  // Send notification to customer
}
```

---

#### **Phase 3: Warranty Notifications (Priority: LOW)**

**Tính năng:**
1. 🔔 **Nhắc nhở hết hạn bảo hành**
   - Email/SMS trước 30 ngày hết hạn
   - Gợi ý mua bảo hành mở rộng

2. 📧 **Status update notifications**
   - Service ticket created
   - Repair in progress
   - Ready for pickup

3. 📊 **Warranty dashboard for customer**
   - Xem tất cả sản phẩm đang bảo hành
   - Lịch sử sửa chữa
   - Tải warranty certificate (PDF)

---

## 📋 3. KẾ HOẠCH TRIỂN KHAI ƯU TIÊN

### **Sprint 1 (2 tuần):**
- [ ] Tách Promotion entity
- [ ] Migration data từ Product.promo_* sang Promotion
- [ ] Implement `promotion.service.ts` basic
- [ ] Update order flow để dùng Promotion mới

### **Sprint 2 (2 tuần):**
- [ ] Admin UI: Promotion CRUD
- [ ] Flash sale logic với stock limit
- [ ] Promotion analytics dashboard

### **Sprint 3 (1 tuần):**
- [ ] Warranty Service entity
- [ ] Service request flow (customer → technician)
- [ ] Service history tracking

### **Sprint 4 (1 tuần):**
- [ ] Extended warranty purchase flow
- [ ] Warranty notifications
- [ ] Customer warranty dashboard

---

## 🎯 4. LỢI ÍCH MONG ĐỢI

### **Khuyến mãi:**
- ✅ Tăng 40% linh hoạt trong chiến dịch marketing
- ✅ Hỗ trợ flash sale → tăng conversion rate
- ✅ Theo dõi ROI từng promotion → tối ưu ngân sách
- ✅ Tự động áp promotion tốt nhất → tăng customer satisfaction

### **Bảo hành:**
- ✅ Giảm 60% thời gian xử lý warranty claim
- ✅ Tăng doanh thu từ extended warranty (~10-15% đơn hàng)
- ✅ Tăng độ tin cậy thương hiệu
- ✅ Tự động hóa workflow → giảm chi phí vận hành

---

## ⚡ 5. QUICK WINS (Có thể làm ngay)

1. **Thêm promotion analytics vào OrderItem**
   ```typescript
   // Track promotion effectiveness
   await prisma.orderItem.update({
     data: { 
       promo_snapshot: {
         ...promoSnapshot,
         promotion_id: promotion.id,  // ADD THIS
         promotion_code: promotion.code
       }
     }
   });
   ```

2. **Serial number bắt buộc cho warranty**
   ```prisma
   model WarrantyUnit {
     serial_no String @unique // Remove "?"
   }
   ```

3. **Warranty expiry notification cron job**
   ```typescript
   // Run daily
   async function notifyExpiringWarranties() {
     const expiringSoon = await prisma.warrantyUnit.findMany({
       where: {
         end_date: {
           gte: new Date(),
           lte: addDays(new Date(), 30)
         },
         status: 'ACTIVE'
       }
     });
     // Send emails
   }
   ```

---

**Bạn muốn tôi triển khai phase nào trước?**
