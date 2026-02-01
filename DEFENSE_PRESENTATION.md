# KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN TỐT NGHIỆP
**Đề tài:** Xây dựng Website Thương mại Điện tử NamPhongStore với Hệ thống Quản lý Bảo hành Chuyên sâu

---

## 🟢 Slide 1: Giới thiệu Đề tài

**[Nội dung trên Slide]**
*   **Tên đề tài:** Xây dựng Hệ thống Thương mại Điện tử NamPhongStore.
*   **Sinh viên thực hiện:** [Tên Của Bạn]
*   **Giảng viên hướng dẫn:** [Tên GVHD]
*   **Năm thực hiện:** 2026

**[Kịch bản nói]**
"Kính thưa Hội đồng bảo vệ, thưa các thầy cô và các bạn. Em xin phép được bắt đầu phần trình bày đồ án tốt nghiệp của mình với đề tài: **'Xây dựng Website Thương mại Điện tử NamPhongStore'**, tập trung vào giải pháp quản lý bán hàng và quy trình bảo hành tự động hóa."

---

## 🟢 Slide 2: Lý do chọn đề tài (Tính cấp thiết)

**[Nội dung trên Slide]**
*   **Bối cảnh:** Thương mại điện tử phát triển mạnh, yêu cầu cao về trải nghiệm mua sắm và hậu mãi.
*   **Vấn đề:** Các hệ thống mã nguồn mở thường thiếu quy trình bảo hành đặc thù (đổi trả vs sửa chữa).
*   **Giải pháp:** Xây dựng hệ thống "Made in Vietnam" tối ưu cho quy trình bán lẻ và bảo hành thiết bị điện tử.

**[Kịch bản nói]**
"Lý do em chọn đề tài này xuất phát từ thực tế thị trường. Trong khi các chức năng bán hàng cơ bản đã phổ biến, thì quy trình **hậu mãi và bảo hành** thường bị bỏ ngỏ hoặc xử lý thủ công, gây khó khăn cho doanh nghiệp vừa và nhỏ. Đồ án của em hướng tới việc giải quyết bài toán này bằng một hệ thống tích hợp chặt chẽ giữa Bán hàng và Quản lý vòng đời sản phẩm."

---

## 🟢 Slide 3: Cấu trúc Đồ án (3 Chương)

**[Nội dung trên Slide]**
*   **Chương 1: Cơ sở lý thuyết và công nghệ**
    *   Trình bày cơ sở lý thuyết và các công nghệ nền tảng.
*   **Chương 2: Phân tích và thiết kế hệ thống**
    *   Khảo sát phân tích yêu cầu chức năng/phi chức năng, thiết kế kiến trúc, CSDL, giao diện.
*   **Chương 3: Cài đặt và kiểm thử**
    *   Công cụ lập trình, tổ chức dự án, cài đặt chức năng, kiểm thử, đánh giá ưu nhược điểm và hướng phát triển.

**[Kịch bản nói]**
"Báo cáo đồ án được trình bày một cách hệ thống qua 3 chương. Chương 1 trình bày cơ sở lý thuyết và các công nghệ nền tảng. Chương 2 tập trung khảo sát phân tích yêu cầu, xác định các yêu cầu chức năng và phi chức năng, từ đó thiết kế kiến trúc hệ thống, cơ sở dữ liệu và giao diện người dùng. Cuối cùng, Chương 3 giới thiệu các công cụ lập trình, tổ chức dự án, đi sâu vào việc cài đặt và lập trình các chức năng, thực hiện kiểm thử, đánh giá ưu nhược điểm và đề xuất các hướng phát triển tiếp theo."

---

## 🟢 Slide 4: Chương 1 - Công nghệ Sử dụng

**[Nội dung trên Slide]**
*   **Framework:** Next.js 14 (App Router) - Hiệu năng cao, SEO tốt.
*   **Language:** TypeScript - Type-safety.
*   **Database:** PostgreSQL + Prisma ORM.
*   **Infrastructure:** Docker (Containerization).
*   **Testing:** Vitest & Playwright.

**[Kịch bản nói]**
"Ở Chương 1, em đã lựa chọn các công nghệ hiện đại nhất. **Next.js 14** đảm bảo hiệu năng website. **TypeScript** giúp code chặt chẽ, dễ bảo trì. Dữ liệu được quản lý bởi **PostgreSQL** và **Prisma**. Toàn bộ hệ thống được đóng gói bằng **Docker** để dễ dàng triển khai. Đặc biệt, em chú trọng kiểm thử tự động với Vitest và Playwright."

---

## 🟢 Slide 5: Chương 2 - Thiết kế Hệ thống

**[Nội dung trên Slide]**
*   **Kiến trúc:** Client-Server (Next.js Fullstack).
*   **CSDL (Entity Relation):**
    *   `Order` (Đơn hàng)
    *   `Product` (Sản phẩm)
    *   `WarrantyUnit` (Đơn vị bảo hành - *Entity quan trọng*)
*   **Luồng dữ liệu:** Tự động hóa từ Storefront -> Admin -> Database.

**[Kịch bản nói]**
"Trong Chương 2, em thiết kế hệ thống dựa trên mô hình thực tế. Điểm nhấn trong thiết kế CSDL là bảng `WarrantyUnit` được tách biệt nhưng liên kết chặt chẽ với `OrderItem`. Điều này cho phép quản lý vòng đời của *từng sản phẩm vật lý* bán ra, khác với cách quản lý theo đơn hàng thông thường."

---

## 🟢 Slide 6: Chương 2 - Giải pháp Bảo hành V2

**[Nội dung trên Slide]**
*   **Logic 2 Giai đoạn:**
    1.  **Exchange Phase (Đổi mới):** 30 ngày đầu.
    2.  **Repair Phase (Sửa chữa):** Các tháng tiếp theo.
*   **Automation:** Tự động sinh mã và kích hoạt khi đơn hàng `DELIVERED`.

**[Kịch bản nói]**
"Cũng trong Chương 2, em đã giải quyết bài toán bảo hành bằng **Logic 2 Giai đoạn**. Hệ thống phân biết rõ thời gian được 'Đổi mới' và thời gian chỉ được 'Sửa chữa'. Hệ thống sẽ tự động kích hoạt bảo hành ngay khi đơn hàng được giao thành công, giúp việc quản lý đơn giản và chính xác hơn."

---

## 🟢 Slide 7: Chương 3 - DEMO CHƯƠNG TRÌNH

**[Nội dung trên Slide]**
*   **Kịch bản Demo:**
    1.  **Tài khoản:** Khôi phục mật khẩu (Forgot Password).
    2.  **Mua hàng:** Khách chọn sản phẩm Laptop -> Đặt hàng (Guest Checkout).
    3.  **Xử lý đơn:** Admin duyệt đơn -> Giao hàng thành công.
    4.  **Kích hoạt:** Hệ thống tự động tạo phiếu bảo hành.
    5.  **Bảo hành:** Khách tra cứu bảo hành -> Yêu cầu đổi trả -> Admin xử lý.

**[Kịch bản nói]**
"Sau đây, em xin phép chuyển sang **Chương 3** và thực hiện **Demo trực tiếp**. Đầu tiên, em sẽ demo tính năng **Quên mật khẩu** giúp người dùng khôi phục tài khoản khi bị mất. Tiếp theo là luồng mua hàng trọn vẹn từ lúc đặt hàng cho đến khi bảo hành được kích hoạt và xử lý đổi trả." *(Thực hiện thao tác trên phần mềm)*

---

## 🟢 Slide 8: Chương 3 - Kiểm thử Hệ thống

**[Nội dung trên Slide]**
*   **Unit Test (Vitest):** Đảm bảo logic tính ngày, giá tiền chính xác 100%.
*   **Integration Test:** Kiểm tra tính toàn vẹn dữ liệu khi tạo đơn hàng, trừ kho.
*   **E2E Test (Playwright):**
    *   Test luồng bán hàng (Shopping Flow).
    *   Test luồng Admin (Dashboard, Order Processing).
*   **Kết quả:** Pass tất cả các Test Case quan trọng.

**[Kịch bản nói]**
"Bên cạnh Demo, chất lượng phần mềm được kiểm chứng qua các bộ test. Em đã xây dựng Unit Test cho các hàm tính toán logic phức tạp và E2E Test để giả lập hành vi người dùng, đảm bảo hệ thống hoạt động ổn định trước khi đưa vào sử dụng thực tế."

---

## 🟢 Slide 9: Đánh giá Kết quả

**[Nội dung trên Slide]**
*   **Đạt được:**
    *   ✅ Hệ thống E-commerce hoàn chỉnh (Storefront + Admin).
    *   ✅ Tính năng bảo mật (Quên mật khẩu qua Email).
    *   ✅ Quy trình bảo hành tự động, minh bạch.
    *   ✅ Giao diện hiện đại, UX tốt.
*   **Hạn chế:**
    *   Chưa hỗ trợ thanh toán Online (VNPAY/Momo).
    *   Chưa có hệ thống Promotion phức tạp (Voucher, Combo).

**[Kịch bản nói]**
"Tự đánh giá kết quả, đồ án đã hoàn thành tốt các mục tiêu đề ra về một hệ thống bán hàng tích hợp bảo hành chuyên sâu. Tuy nhiên, hệ thống vẫn còn dư địa phát triển như bổ sung các chương trình khuyến mãi phức tạp hay thanh toán online. Đây sẽ là những tính năng em dự định nâng cấp trong tương lai để hoàn thiện sản phẩm.

---

## 🟢 Slide 10: Kết luận & Hướng phát triển

**[Nội dung trên Slide]**
*   **Kết luận:** Đồ án có tính thực tiễn cao, áp dụng công nghệ mới giải quyết tốt bài toán quản lý.
*   **Hướng phát triển:**
    *   Tích hợp cổng thanh toán (Payment Gateway).
    *   Phát triển Mobile App cho khách hàng.
    *   Ứng dụng AI gợi ý sản phẩm.
*   **Lời cảm ơn:** Cảm ơn GVHD và Hội đồng.

**[Kịch bản nói]**
"Kết thúc phần trình bày, em xin khẳng định lại tính thực tiễn của đề tài. Trong tương lai, em dự định sẽ tích hợp thêm thanh toán điện tử và phát triển phiên bản Mobile App. Em xin chân thành cảm ơn thầy cô và các bạn đã lắng nghe. Em rất mong nhận được những ý kiến đóng góp từ Hội đồng ạ!"
