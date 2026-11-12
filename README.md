# Trung tâm điều khiển — Đầu tư cùng Thiên Quốc

Trang điều khiển riêng cho hệ thống nội dung và tìm khách. Chạy trên GitHub Pages: không máy chủ, không tài khoản, không phí, không thư viện ngoài.

**Mở trang:** https://voq30113-bit.github.io/trung-tam-dieu-khien/

## Có gì

| Mục | Làm gì |
|---|---|
| Tổng quan | Ô từng kênh. Bấm tên kênh để xem sâu. Bấm nhãn **Chưa kết nối** để tới thẳng trang đăng nhập và kết nối. Việc tay hôm nay, việc tự động sắp chạy, nhật ký. |
| Trang kênh (`#/kenh/<kênh>`) | Trạng thái kết nối, nút mở nhanh, việc cần làm, lịch liên quan, nhật ký và ghi chú riêng của kênh. |
| Kết nối (`#/ket-noi/<kênh>`) | Chọn cách kết nối (tự chủ hoặc qua Claude/vidIQ), làm theo từng bước, nút mở trang đăng nhập chính thức, rồi xác nhận. |
| Lịch tự động | Các việc Claude chạy theo giờ Việt Nam, đếm ngược, nút "Đã nhận" và link tìm email trong Gmail. |
| Đăng bài | Soạn bài, tự rà 6 quy tắc nội dung, đếm ký tự từng nền tảng, một nút mở Threads / Facebook / TikTok / Zalo / YouTube để đăng, lưu bản nháp. |
| Tìm khách | Chấm điểm khách (cùng thang điểm với Apps Script), tin nhắn soạn sẵn N0–N14, tính ngày follow-up, phễu tuần. Không lưu thông tin khách. |
| Nhật ký | Mọi việc đã làm, lọc theo kênh, tải CSV. |
| Cài đặt | Sao lưu / nạp lại dữ liệu, giao diện sáng tối. |

## Dữ liệu nằm ở đâu

- Cấu hình (kênh, lịch, đường link, các bước kết nối, từ cấm): `assets/data.js`.
- Những gì bạn bấm trên trang: lưu trong trình duyệt (localStorage). Sang máy khác thì vào **Cài đặt → Tải bản sao lưu** rồi **Nạp bản sao lưu** ở máy kia.
- Trang không hỏi, không lưu mật khẩu và thông tin khách hàng.

## Sửa trang

Mở Claude Code ở thư mục này, nói điều muốn đổi (ví dụ "thêm việc tay 20h đăng Threads"). Claude Code sửa `assets/data.js`, đẩy lên GitHub, khoảng 1 phút sau trang tự cập nhật.

Chạy thử trên máy: `python -m http.server 8765` trong thư mục này rồi mở http://localhost:8765.
