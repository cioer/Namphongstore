# 🛡️ TÀI LIỆU HỆ THỐNG BẢO HÀNH V2 (WARRANTY SYSTEM)

## 1. Tổng Quan Cải Tiến
Hệ thống bảo hành đã được nâng cấp từ mô hình "hạn bảo hành đơn thuần" sang mô hình **"Bảo hành 2 giai đoạn"**. Mục đích là phân biệt rõ quyền lợi của khách hàng trong từng giai đoạn sau khi mua hàng.

### Hai giai đoạn bảo hành chính:
1.  **Giai đoạn Đổi mới (Exchange Phase)**:
    -   Áp dụng trong thời gian đầu (ví dụ: 30 ngày hoặc 1-2 tháng đầu).
    -   Nếu sản phẩm có lỗi, khách hàng được **đổi sản phẩm mới**.
2.  **Giai đoạn Sửa chữa (Repair Phase)**:
    -   Áp dụng sau khi hết hạn đổi mới đến khi hết hạn bảo hành (ví dụ: tháng thứ 2 đến tháng 12).
    -   Nếu sản phẩm có lỗi, khách hàng được hỗ trợ **sửa chữa/bảo hành**, không đổi mới.

---

## 2. Cấu Trúc Dữ Liệu (Schema Changes)

### A. Product (Sản phẩm)
Quản lý chính sách bảo hành gốc.
-   `warranty_months` (int): Tổng thời gian bảo hành (Ví dụ: 12 tháng).
-   `warranty_exchange_months` (int): Thời gian được phép đổi mới (Ví dụ: 1 tháng).

### B. OrderItem (Đơn hàng)
Lưu trữ "Snapshot" chính sách tại thời điểm mua để đảm bảo quyền lợi khách hàng không đổi ngay cả khi Shop thay đổi chính sách sau này.
-   `warranty_months_snapshot`: Copy từ Product.
-   `warranty_exchange_months_snapshot`: Copy từ Product.

### C. WarrantyUnit (Đơn vị bảo hành)
Mỗi sản phẩm vật lý (dựa trên số lượng mua) sẽ có 1 bản ghi bảo hành riêng biệt.
-   `warranty_code_auto`: Mã bảo hành duy nhất.
-   `start_date`: Ngày kích hoạt (thường là ngày giao hàng thành công).
-   `end_date`: Ngày hết hạn bảo hành toàn phần (`start_date` + `warranty_months`).
-   `exchange_until`: **Trường mới quan trọng**. Ngày kết thúc quyền đổi mới (`start_date` + `warranty_exchange_months`).
-   `status`: `ACTIVE`, `EXPIRED`, `REPLACED` (đã bị đổi), `VOIDED` (từ chối bảo hành).

---

## 3. Cơ Chế Hoạt Động (Workflow)

### Bước 1: Kích hoạt bảo hành (Order Delivery)
Khi đơn hàng chuyển sang trạng thái `DELIVERED`:
1.  Hệ thống tạo bản ghi `WarrantyUnit` cho từng sản phẩm.
2.  Tính toán ngày:
    -   `Start Date` = Ngày hiện tại (delivered).
    -   `Exchange Until` = Ngày hiện tại + `warranty_exchange_months_snapshot`.
    -   `End Date` = Ngày hiện tại + `warranty_months_snapshot`.

### Bước 2: Kiểm tra trạng thái (Warranty Check)
Khi kiểm tra một mã bảo hành tại thời điểm `T`:

| Điều kiện so sánh (T) | Trạng thái hệ thống | Quyền lợi |
| :--- | :--- | :--- |
| `T <= exchange_until` | **Giai đoạn Đổi trả** | Được tạo yêu cầu đổi mới hoặc sửa chữa. |
| `T > exchange_until` VÀ `T <= end_date` | **Giai đoạn Sửa chữa** | Chỉ được tạo yêu cầu sữa chữa. |
| `T > end_date` | **Hết hạn** | Từ chối bảo hành. |

### Bước 3: Xử lý Đổi trả (Replacement Logic)
Nếu thực hiện đổi mới 1 sản phẩm:
1.  Unit cũ (`Unit A`) chuyển status thành `REPLACED`.
2.  Hệ thống tạo Unit mới (`Unit B`) liên kết với sản phẩm đổi mới.
3.  `replaced_by` của Unit A trỏ tới Unit B.
4.  Thời gian bảo hành của Unit B có thể được reset hoặc nối tiếp tùy cấu hình code (hiện tại logic là tạo mới chu trình).

---

## 4. Ví Dụ Minh Họa

**Kịch bản:**
-   Sản phẩm: Laptop Gaming
-   Bảo hành: 12 tháng.
-   Đổi mới: 1 tháng đầu.
-   Ngày mua (Giao hàng): 01/01/2026.

**Kết quả tính toán:**
-   `start_date`: 01/01/2026
-   `exchange_until`: 01/02/2026 (1 tháng sau)
-   `end_date`: 01/01/2027 (1 năm sau)

**Tình huống:**
-   **Ngày 15/01/2026 (Khách báo lỗi):**
    -   `15/01` < `01/02`.
    -   -> **Trong thời hạn đổi mới**. Hệ thống cho phép chọn "Đổi sản phẩm".
-   **Ngày 15/03/2026 (Khách báo lỗi):**
    -   `15/03` > `01/02` (Đã qua hạn đổi).
    -   `15/03` < `01/01/2027` (Còn hạn bảo hành).
    -   -> **Trong thời hạn sửa chữa**. Hệ thống chỉ cho phép tạo phiếu "Sửa chữa".

---

## 5. Các Trường Hợp Hủy Bảo Hành (Void Warranty)
Hệ thống cũng hỗ trợ việc hủy bảo hành (`status = VOIDED`) cho các trường hợp vi phạm chính sách:
-   Tem bảo hành bị rách.
-   Sản phẩm bị vào nước / rơi vỡ.
-   Tự ý tháo lắp.

Việc này được thực hiện thủ công bởi Admin thông qua trang quản lý bảo hành.
