# JewelAura

JewelAura là dự án website bán trang sức phục vụ học tập môn thương mại điện tử xây dựng bằng **MERN Stack**, định hướng giao diện hiện đại, tối giản, sang trọng và tối ưu trải nghiệm mua sắm trên cả desktop, tablet và mobile.

## 1. Giới thiệu

Hệ thống gồm 2 phần chính:

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Cơ sở dữ liệu**: MongoDB Atlas + Mongoose
- **Xác thực**: JWT + bcryptjs

Dự án hỗ trợ:

- Xem sản phẩm, tìm kiếm, lọc và sắp xếp
- Đăng ký, đăng nhập, quản lý tài khoản
- Giỏ hàng cho khách vãng lai và người dùng đã đăng nhập
- Đặt hàng, áp dụng mã giảm giá
- Thanh toán khi nhận hàng hoặc chuyển khoản qua mã QR
- Theo dõi đơn hàng
- Quản trị sản phẩm, đơn hàng, người dùng, homepage, banner, coupon và cài đặt website

## 2. Công nghệ sử dụng

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Context API

### Backend

- Node.js
- Express.js
- Mongoose
- JWT
- bcryptjs
- cors
- morgan

### Khác

- MongoDB Atlas
- VietQR để tạo URL mã QR chuyển khoản
- Xuất Excel cho sản phẩm và doanh thu ở trang quản trị

## 3. Cấu trúc thư mục

```txt
WebNEW/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── seeders/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   └── server.js
├── package.json
└── README.md
```

## 4. Chức năng chính

### Người dùng

- Xem trang chủ động theo cấu hình CMS
- Xem danh sách sản phẩm
- Tìm kiếm sản phẩm theo từ khóa
- Lọc theo danh mục, giới tính, chất liệu, khoảng giá
- Xem chi tiết sản phẩm
- Thêm vào giỏ hàng
- Mua ngay
- Đăng ký, đăng nhập, đăng xuất
- Cập nhật thông tin cá nhân
- Lưu danh sách yêu thích
- Tạo đơn hàng
- Áp dụng mã giảm giá
- Thanh toán COD hoặc chuyển khoản ngân hàng bằng QR
- Xem lịch sử đơn hàng và chi tiết đơn hàng
- Hủy đơn khi còn ở trạng thái cho phép

### Quản trị viên

- Dashboard thống kê tổng quan
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý mã giảm giá
- Quản lý banner
- Quản lý nội dung trang chủ theo section
- Quản lý thông tin website, hotline, mạng xã hội, tài khoản ngân hàng
- Export Excel sản phẩm
- Export Excel doanh thu

## 5. Yêu cầu môi trường

- Node.js 18 trở lên
- npm 9 trở lên
- MongoDB Atlas hoặc MongoDB có thể kết nối từ backend

## 6. Cài đặt dự án

Chạy tại thư mục gốc:

```bash
npm run install:all
```

Hoặc cài riêng từng phần:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## 7. Cấu hình biến môi trường

Tạo file `server/.env` và cấu hình các biến sau:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Nếu muốn cấu hình riêng API cho frontend, tạo thêm `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 8. Chạy dự án

### Chạy cả frontend và backend

```bash
npm run dev
```

### Chạy riêng backend

```bash
npm run dev:server
```

hoặc:

```bash
npm run dev --prefix server
```

Backend mặc định chạy tại:

```txt
http://localhost:5000
```

### Chạy riêng frontend

```bash
npm run dev:client
```

hoặc:

```bash
npm run dev --prefix client
```

Frontend mặc định chạy tại:

```txt
http://localhost:5173
```

## 9. Seed dữ liệu mẫu

Nhập dữ liệu mẫu:

```bash
npm run seed --prefix server
```

Xóa dữ liệu mẫu:

```bash
npm run seed:destroy --prefix server
```

Dữ liệu seed hiện tại gồm:

- 1 tài khoản admin
- 3 tài khoản người dùng mẫu
- 7 danh mục sản phẩm
- 36 sản phẩm mẫu
- 3 mã giảm giá
- 3 banner homepage
- nhiều section trang chủ
- nhiều đơn hàng mẫu để phục vụ dashboard

### Tài khoản admin mặc định

```txt
Email: admin@jewelaura.vn
Password: Admin@123
```

## 10. API kiểm tra nhanh

- `GET /api/health`
- `GET /api/products`
- `GET /api/categories`
- `GET /api/home`
- `GET /api/site-settings`
- `POST /api/auth/login`

Ví dụ:

```txt
http://localhost:5000/api/health
```

## 11. Một số script hữu ích

### Ở thư mục gốc

```bash
npm run dev
npm run dev:client
npm run dev:server
```

### Ở thư mục `server`

```bash
npm run dev
npm run start
npm run seed
npm run seed:destroy
npm run search:reindex
npm run orders:backfill-completed-at
```

### Ở thư mục `client`

```bash
npm run dev
npm run build
npm run preview
npm run lint
```