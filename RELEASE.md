# Release v1.0.0 🚀

Chào mừng bạn đến với phiên bản chính thức đầu tiên của **MacPaste** - Trình quản lý clipboard tối giản, mượt mà và tập trung vào hiệu suất dành riêng cho macOS!

## ✨ Các Tính năng Nổi bật trong Version 1.0.0
- **📋 Smart Clipboard History**: Theo dõi tự động mọi nội dung bạn copy (lưu trữ lịch sử lên tới 100 items).
- **🔍 Tìm kiếm Thời gian Thực (Real-time Search)**: Gõ để tìm kiếm và lọc nội dung bạn cần một cách nhanh chóng.
- **⌨️ Keyboard-first Navigation**: Thao tác hoàn toàn bằng bàn phím. Sử dụng phím mũi tên `↑ / ↓` để chọn và nhấn `Enter` để tự động dán (auto-paste) vào ứng dụng đang mở.
- **🌐 Global Shortcut**: Ẩn/Hiện ứng dụng với một phím tắt toàn cầu `Cmd + Shift + V` từ bất cứ đâu.
- **💾 Lưu trữ Bền vững (Persistent Storage)**: Lịch sử clipboard được bảo vệ và giữ nguyên ngay cả khi bạn khởi động lại máy.
- **⚙️ Configurable Shortcut**: Dễ dàng tuỳ chỉnh phím tắt theo sở thích cá nhân ngay trong phần Settings.

---

## 🛠️ Hướng dẫn Cài đặt & Tắt kiểm tra "Apple Developer ID" (Bypass Gatekeeper)

> **Lưu ý Quan trọng**: 
> Vì ứng dụng chưa được đăng ký chứng chỉ nhà phát triển (Apple Developer ID), macOS có thể hiển thị cảnh báo file bị hỏng hoặc từ chối mở ở lần chạy đầu tiên (do cơ chế Gatekeeper). 

Để vượt qua kiểm tra này và sử dụng MacPaste bình thường, hãy thực hiện chi tiết theo các bước sau, chỉ cần thiết lập **1 lần duy nhất**:

**Bước 1**: Tải xuống file `.dmg` tương ứng với dòng chip Mac của bạn (Apple Silicon hoặc Intel).
**Bước 2**: Mở file `.dmg` vừa tải về, kéo thả biểu tượng **MacPaste** vào thư mục `Applications` (Ứng dụng).
**Bước 3**: Mở trình gõ lệnh **Terminal** trên Mac (bạn có thể bấm tổ hợp phím `Cmd + Space` để mở Spotlight, gõ "Terminal" và nhấn Enter).
**Bước 4**: Copy dòng lệnh dưới đây, dán vào Terminal và nhấn phím `Enter`:

```bash
xattr -cr /Applications/MacPaste.app
```

**Bước 5**: Hoàn tất! Bây giờ bạn có thể mở ứng dụng MacPaste bình thường từ Launchpad hoặc thư mục Applications. 

*(Khi mở ứng dụng lần đầu, macOS sẽ yêu cầu quyền **Accessibility** (Trợ năng) — bạn cần cấp quyền này để tính năng tự động dán (Auto-Paste) và Phím tắt toàn cầu (Global Shortcut) hoạt động chính xác).*
