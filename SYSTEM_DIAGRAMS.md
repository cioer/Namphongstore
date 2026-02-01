# Sơ Đồ Chức Năng Hệ Thống NamPhongStore

Tài liệu này mô tả luồng hoạt động của hệ thống thông qua các sơ đồ Mermaid, tập trung vào hai phân hệ chính: Bán Hàng (Sales) và Quản Trị (Administration).

## 1. Chức Năng Bán Hàng (Sales Function)

Mô tả quy trình khách hàng tìm kiếm, chọn mua sản phẩm và thanh toán.

```mermaid
graph TD
    %% Actors
    User([Khách Hàng])
    
    %% Subsystems
    subgraph Storefront [Giao Diện Bán Hàng]
        Home[Trang Chủ]
        Search[Tìm Kiếm & Lọc]
        ProductDetail[Chi Tiết Sản Phẩm]
        Cart[Giỏ Hàng]
        Checkout[Thanh Toán]
        OrderSuccess[Đặt Hàng Thành Công]
    end

    subgraph Backend [Hệ Thống Xử Lý]
        AuthService{Xác Thực}
        ProductService[Dịch Vụ Sản Phẩm]
        OrderService[Dịch Vụ Đơn Hàng]
        StockCheck{Kiểm Tra Tồn Kho}
    end

    subgraph Database [Cơ Sở Dữ Liệu]
        DB[(PostgreSQL)]
    end

    %% Flows
    User --> Home
    User --> Search
    
    Home -->|Xem| ProductDetail
    Search -->|Chọn| ProductDetail
    
    ProductDetail -->|Thêm vào| Cart
    Cart -->|Tiến hành| Checkout
    
    Checkout -->|Gửi thông tin| AuthService
    AuthService -- Khách vãng lai --> OrderService
    AuthService -- Đăng nhập --> OrderService
    
    OrderService -->|Validate| StockCheck
    StockCheck -->|Còn hàng| Database
    StockCheck -->|Hết hàng| Cart
    
    Database -->|Lưu đơn| OrderService
    OrderService -->|Trả kết quả| OrderSuccess
    
    %% Styles
    classDef page fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef process fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    classDef db fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    
    class Home,Search,ProductDetail,Cart,Checkout,OrderSuccess page;
    class AuthService,ProductService,OrderService,StockCheck process;
    class DB db;
```

### Luồng Xử Lý Đơn Hàng (Sequence Diagram)

```mermaid
sequenceDiagram
    actor Customer as Khách Hàng
    participant FE as Frontend (Next.js)
    participant API as API Route
    participant Service as Order Service
    participant DB as Database (Prisma)

    Customer->>FE: Thêm sản phẩm vào giỏ
    Customer->>FE: Nhập thông tin giao hàng & Checkout
    FE->>API: POST /api/orders (Data)
    
    activate API
    API->>Service: createOrder(data)
    
    activate Service
    Service->>Service: Validate thông tin (Phone, Address)
    Service->>DB: Check tồn kho (Product)
    
    alt Hết hàng
        DB-->>Service: Return Stock Error
        Service-->>API: Throw Error
        API-->>FE: Thông báo lỗi
        FE-->>Customer: Hiển thị lỗi hết hàng
    else Còn hàng
        Service->>DB: Create Order (Status: NEW)
        Service->>DB: Create OrderItems (Snapshots)
        DB-->>Service: Order Created
        Service-->>API: Return Order Data
        API-->>FE: 200 OK
        FE-->>Customer: Chuyển trang Cảm ơn / Tracking
    end
    deactivate Service
    deactivate API
```

## 2. Chức Năng Quản Trị (Administration Function)

Mô tả các chức năng dành cho nhân viên và quản lý để vận hành hệ thống.

```mermaid
graph TD
    %% Actors
    Admin([Admin / Staff])
    
    %% Subsystems
    subgraph AdminPanel [Admin Dashboard]
        Login[Đăng Nhập]
        Dashboard[Tổng Quan / Thống Kê]
        ProductMgr[Quản Lý Sản Phẩm]
        OrderMgr[Quản Lý Đơn Hàng]
        WarrantyMgr[Bảo Hành & Đổi Trả]
        UserMgr[Quản Lý Người Dùng]
    end

    subgraph Logic [Xử Lý Nghiệp Vụ]
        AuthLogic{Check Role}
        CRUD[Create/Read/Update/Delete]
        StatusUpdate[Cập Nhật Trạng Thái]
        ReportGen[Xuất Báo Cáo]
    end

    subgraph Data [Dữ Liệu]
        Products[(Sản Phẩm)]
        Orders[(Đơn Hàng)]
        Users[(Users)]
        Warranties[(Bảo Hành)]
    end

    %% Flows
    Admin --> Login
    Login -->|Token| AuthLogic
    
    AuthLogic -->|Success| Dashboard
    
    Dashboard --> ProductMgr
    Dashboard --> OrderMgr
    Dashboard --> WarrantyMgr
    Dashboard --> UserMgr
    
    ProductMgr -->|Thêm/Sửa/Xóa| CRUD
    CRUD --> Products
    
    OrderMgr -->|Xử lý đơn| StatusUpdate
    StatusUpdate --> Orders
    
    WarrantyMgr -->|Tra cứu/Tạo phiếu| Logic
    Logic --> Warranties
    
    Dashboard -->|Xem doanh thu| ReportGen
    ReportGen --> Orders

    %% Styles
    classDef panel fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef logic fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    
    class Login,Dashboard,ProductMgr,OrderMgr,WarrantyMgr,UserMgr panel;
    class AuthLogic,CRUD,StatusUpdate,ReportGen logic;
```

### Quy Trình Xử Lý Đơn Hàng (Order Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> NEW: Khách đặt hàng
    NEW --> CONFIRMED: Admin xác nhận
    CONFIRMED --> SHIPPING: Bàn giao giao vận
    SHIPPING --> DELIVERED: Giao thành công
    
    NEW --> CANCELLED_BY_SHOP: Hết hàng / Không liên lạc được
    NEW --> CANCELLED_BY_CUSTOMER: Khách hủy
    
    DELIVERED --> COMPLETED: Hết thời gian đổi trả
    DELIVERED --> WARRANTY_CLAIM: Khách yêu cầu bảo hành
    
    CANCELLED_BY_SHOP --> [*]
    CANCELLED_BY_CUSTOMER --> [*]
    COMPLETED --> [*]
```
