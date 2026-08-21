# Design System

Ứng dụng dùng visual system warm editorial / modern SaaS cho các màn hình vận hành của nhà trường.

## Tokens

- Nền chính: `#f9f8f6`
- Mực chữ chính: `#171417`
- Navy nhấn mạnh: `#0c1754`
- Cobalt cho CTA/active: `#2545ff`
- Viền/card: `#f0e9e1`
- Card/input: radius `16px`
- Button: radius pill `999px`
- Container desktop: tối đa `1200px`
- Font chính: `Be Vietnam Pro` với subset `vietnamese`
- Font tiêu đề lớn: `Noto Serif` với subset `vietnamese`

## Components

- Page dùng `.app-shell` và `.content-wrap`.
- Header dùng `.page-title` với `Noto Serif`, không dùng eyebrow/module label.
- Card thường dùng `.surface-card`; nội dung quan trọng dùng `.featured-card`.
- Button chính dùng `.button-primary`; thao tác phụ dùng `.button-secondary`.
- Input/select/textarea dùng `.form-control`.
- Thông báo dùng `.status-message`.

## UI Rules

- Không hiển thị label kiểu `Module 1`, `Module M2`, `Sprint 3` trong giao diện người dùng.
- Landing page dùng câu chuyện sản phẩm thay vì danh sách sprint; app sau đăng nhập dùng shell thống nhất với sidebar và topbar để người dùng không phải học lại điều hướng ở từng màn hình.
- Hierarchy thể hiện bằng typography, khoảng trắng, bố cục và card hierarchy.
- Không đổi logic nghiệp vụ, API, route, auth hoặc flow khi chỉnh UI.
- Màu đỏ/vàng/xanh chỉ dùng cho trạng thái nghiệp vụ như thiếu minh chứng, cảnh báo hoặc đạt mức.
