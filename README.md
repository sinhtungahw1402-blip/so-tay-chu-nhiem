# 📱 SỔ CHỦ NHIỆM SỐ (Phiên bản Di Động & Web)

Ứng dụng quản lý học sinh và nề nếp lớp chủ nhiệm, hỗ trợ chấm lỗi bằng checkbox, tổng hợp xuất báo cáo (Văn bản & Ảnh thẻ) và gửi tin nhắn trực tiếp qua Zalo phụ huynh theo số điện thoại đã đăng ký.

---

## ✨ CÁC TÍNH NĂNG NỔI BẬT

### 1. Nhập và Quản lý Học sinh
- **Thêm từng học sinh:** Điền họ tên, số thứ tự (STT), ngày sinh, giới tính, số điện thoại Zalo của phụ huynh, tên phụ huynh, tổ/nhóm và ghi chú riêng của GVCN.
- **Nhập hàng loạt bằng file Excel (.xlsx, .xls, .csv):**
  - Tự động nhận diện các cột dữ liệu thông minh.
  - Có sẵn nút **"Tải file mẫu Excel"** chuẩn form sư phạm.
  - Xem trước dữ liệu trước khi nạp vào lớp.
  - Tùy chọn: *Thay thế toàn bộ danh sách* hoặc *Gộp thêm học sinh mới*.
- **Xuất danh sách ra file Excel** với 1 chạm.

### 2. Nhập Lỗi Vi Phạm (Đánh dấu chọn & Tùy biến lỗi)
- **Tùy biến lỗi vi phạm thủ công:** GVCN có toàn quyền thêm lỗi mới, sửa tên lỗi, đổi số điểm trừ nề nếp (ví dụ: -2đ, -5đ, -10đ), phân loại nhóm (Chuyên cần, Học tập, Kỷ luật - Tác phong, Vệ sinh - Lao động).
- **2 Chế độ chấm lỗi siêu tốc:**
  - *Chế độ 1 - Theo từng học sinh:* Chọn học sinh -> Tích chọn các lỗi vi phạm trong danh sách -> Chọn tiết/môn/ghi chú -> Lưu.
  - *Chế độ 2 - Chấm nhanh cả nhóm:* Chọn 1 lỗi (VD: "Không làm bài tập" hoặc "Đi học muộn") -> Tích chọn nhiều học sinh cùng vi phạm trong 1 lượt -> Lưu cho cả nhóm chỉ với 1 lần bấm.
- **Lịch sử vi phạm theo ngày:** Xem lại danh sách lỗi đã chấm trong ngày, xóa nhanh nếu bấm nhầm.

### 3. Tổng hợp Báo cáo Nề nếp (Theo Tuần, Tháng, Học kì, Cả năm)
- **Bộ lọc thời gian linh hoạt:**
  - *Theo tuần:* Tuần này, Tuần trước, hoặc khoảng ngày cụ thể.
  - *Theo tháng:* Tháng 1 đến Tháng 12.
  - *Theo học kì:* Học kì 1, Học kì 2.
  - *Cả năm học:* Toàn bộ năm học.
  - *Tùy chọn:* Chọn từ ngày bất kỳ đến ngày bất kỳ.
- **Thống kê chi tiết từng em:** Tổng số lần vi phạm, tổng điểm trừ, điểm rèn luyện còn lại (thang điểm 100), xếp loại hạnh kiểm/nề nếp (*Tốt, Khá, Đạt, Cần rèn luyện*).

### 4. Xuất Báo Cáo & Gửi Trực Tiếp Qua Zalo Phụ Huynh
- **Dạng Văn Bản (Text):**
  - Soạn sẵn mẫu tin nhắn sư phạm chuẩn mực, trang trọng.
  - Nút **"Sao chép tin nhắn"** tự động lưu vào bộ nhớ tạm.
- **Dạng Ảnh (Image Card):**
  - Tạo **Phiếu thông báo rèn luyện nề nếp** thiết kế chuẩn văn bản nhà trường (có logo, thông tin học sinh, bảng lỗi, điểm xếp loại, chữ ký GVCN).
  - Nút **"Tải ảnh về máy (.png)"** chất lượng cao sắc nét.
  - Nút **"Chia sẻ ảnh"** mở trực tiếp menu chia sẻ của điện thoại (Zalo, Messenger...).
- **Gửi trực tiếp qua Zalo:**
  - Nút **"Mở Zalo phụ huynh"**: Ứng dụng tự động sao chép nội dung báo cáo và mở ngay cuộc trò chuyện Zalo với số điện thoại của phụ huynh đó (`https://zalo.me/[sdt]`). Giáo viên chỉ cần bấm giữ -> **Dán (Paste)** là gửi xong trong 3 giây!

### 5. Sử dụng Độc Lập Trên Nhiều Điện Thoại
- **Kiến trúc Local-First (Bộ nhớ cục bộ):**
  - Mỗi giáo viên dùng điện thoại của mình thì dữ liệu chỉ lưu trên máy đó.
  - Không lo bị nhầm lẫn hay ghi đè giữa các lớp, các giáo viên.
  - Hoạt động mượt mà ngay cả khi không có mạng Internet (Offline).

### 6. Sao Lưu & Phục Hồi Dữ Liệu Khi Đổi Điện Thoại
- **Sao lưu:** Xuất 1 file dữ liệu duy nhất dạng `.json` (Ví dụ: `SaoLuu_SoChuNhiem_Lop_9A1_2026-11-21.json`). Giáo viên có thể gửi file này vào Zalo "Cloud của tôi" hoặc Google Drive.
- **Phục hồi:** Mở ứng dụng trên điện thoại mới -> Chọn file sao lưu -> Dữ liệu được khôi phục 100% nguyên vẹn!

---

## 🚀 HƯỚNG DẪN MỞ TRÊN ĐIỆN THOẠI

### Cách 1: Chạy trực tiếp từ máy tính trong mạng Wi-Fi
1. Nhấp đúp vào file **`chay-ung-dung.bat`** trên máy tính.
2. Màn hình sẽ hiện địa chỉ mạng nội bộ, ví dụ:
   ```
   ➜  Network: http://192.168.1.13:5173/
   ```
3. Mở trình duyệt (Safari trên iPhone hoặc Chrome trên Android) trên điện thoại đang kết nối cùng Wi-Fi, gõ địa chỉ:
   ```
   http://192.168.1.13:5173
   ```
4. **Cài đặt vào màn hình chính điện thoại (Dùng như App thật):**
   - **Trên iPhone (Safari):** Bấm biểu tượng **Chia sẻ (Share)** ở dưới cùng -> Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - **Trên Android (Chrome):** Bấm menu 3 chấm ở góc trên -> Chọn **"Thêm vào Màn hình chính"** hoặc **"Cài đặt ứng dụng"**.
   - Icon ứng dụng **Sổ Chủ Nhiệm** sẽ xuất hiện trên màn hình điện thoại, mở lên dùng toàn màn hình không có thanh địa chỉ!

### Cách 2: Triển khai trực tuyến miễn phí (Dùng ở mọi nơi không cần mở máy tính)
Thầy/cô có thể đưa thư mục này lên các dịch vụ máy chủ web tĩnh miễn phí trọn đời như **Vercel**, **Netlify**, hoặc **GitHub Pages**:
- Chạy lệnh `npm run build` để xuất thư mục `dist`.
- Kéo thả thư mục `dist` vào trang web [app.netlify.com/drop](https://app.netlify.com/drop) là có ngay đường dẫn online dùng mãi mãi!
