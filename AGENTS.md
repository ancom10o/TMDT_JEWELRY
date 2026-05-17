# AGENTS.md — Hướng dẫn cho Codex xây dựng website bán trang sức bằng MERN Stack

## 1. Vai trò của Codex
Bạn là lập trình viên fullstack hỗ trợ xây dựng website thương mại điện tử bán trang sức.

Website lấy cảm hứng từ phong cách thương mại điện tử cao cấp như PNJ:
- Sang trọng
- Hiện đại
- Tối giản
- Responsive
- Trải nghiệm mua hàng tốt

Không được sao chép:
- Logo
- Hình ảnh
- Nội dung
- Bộ sưu tập
- Mã nguồn
- Thiết kế độc quyền của PNJ

Mục tiêu là tạo một thương hiệu riêng có tên tạm:
- JewelAura

Slogan:
- Tỏa sáng theo cách của bạn

---

# 2. Công nghệ bắt buộc

## Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- Axios
- Context API
- React Icons
- SwiperJS nếu cần slider

## Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

## Database
Sử dụng:
- MongoDB Atlas cloud database
- Kết nối bằng mongoose

Không sử dụng:
- MySQL
- Java Servlet
- JSP

---

# 3. Nguyên tắc coding

## Frontend
- Component hóa rõ ràng
- Chia layout và page riêng
- Reusable components
- Không viết CSS thuần nếu Tailwind làm được
- Không viết toàn bộ logic trong một file

## Backend
- Tách:
  - models
  - controllers
  - routes
  - middlewares
  - config
- REST API chuẩn
- Có xử lý lỗi
- Có middleware auth

---

# 4. Cấu trúc thư mục bắt buộc

```txt
jewel-aura/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seeders/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
│
└── README.md
5. UI/UX yêu cầu
Tone màu
Navy: #0f172a
Gold: #d4af37
White: #ffffff
Gray text: #6b7280
Cảm giác giao diện
Luxury
Premium
Clean
Minimal
Nhiều khoảng trắng
Responsive

Bắt buộc hỗ trợ:

Desktop
Tablet
Mobile
6. Layout website
Header

Bao gồm:

Logo
Search bar
Navigation menu
User icon
Wishlist icon
Cart icon
Trang chủ

Bao gồm:

Hero banner
Danh mục nổi bật
Sản phẩm nổi bật
Bộ sưu tập mới
Banner ưu đãi
Dịch vụ
Footer
7. Danh mục sản phẩm

Ví dụ:

Nhẫn
Bông tai
Dây chuyền
Lắc tay
Vòng tay
Trang sức cưới
Kim cương
Đồng hồ
8. Product Model chuẩn
{
  name: String,
  slug: String,
  description: String,

  category: ObjectId,

  price: Number,
  oldPrice: Number,
  discount: Number,

  images: [String],

  material: String,
  stone: String,
  weight: Number,
  size: [String],

  gender: String,

  stock: Number,
  sold: Number,

  rating: Number,
  reviewCount: Number,

  isFeatured: Boolean,
  isBestSeller: Boolean,
  isNew: Boolean,

  status: String
}
9. User Model chuẩn
{
  fullName: String,
  email: String,
  password: String,
  phone: String,
  address: String,
  role: String
}

role gồm:

user
admin
10. Order Model chuẩn
{
  user: ObjectId,

  items: [
    {
      product: ObjectId,
      quantity: Number,
      price: Number
    }
  ],

  shippingAddress: {
    fullName: String,
    phone: String,
    address: String
  },

  paymentMethod: String,

  totalPrice: Number,

  status: String,

  isPaid: Boolean,
  paidAt: Date
}
11. Authentication

Bắt buộc dùng:

JWT
bcryptjs

Chức năng:

Register
Login
Logout
Get current user

Middleware:

protect
admin
12. API Rules
REST API chuẩn

Ví dụ:

Product
GET /api/products
GET /api/products/:slug
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
Auth
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
Orders
POST /api/orders
GET /api/orders/my-orders
13. Frontend pages bắt buộc
Public pages
HomePage
ProductsPage
ProductDetailPage
CartPage
CheckoutPage
LoginPage
RegisterPage
User pages
ProfilePage
MyOrdersPage
Admin pages
AdminDashboard
AdminProducts
AdminOrders
AdminUsers
14. Tailwind Rules

Ưu tiên:

Flex
Grid
Gap
Responsive utility classes

Ví dụ:

className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"

Không viết:

inline style quá nhiều
CSS custom nếu Tailwind làm được
15. State management

Sử dụng:

Context API

Context cần có:

AuthContext
CartContext

Không cần Redux ở phiên bản đầu.

16. Cart Rules

Nếu chưa đăng nhập:

lưu localStorage

Nếu đã đăng nhập:

có thể sync backend sau

Cart cần:

addToCart
removeFromCart
updateQuantity
clearCart
17. Coding Style

Ưu tiên:

Code dễ đọc
Tên biến rõ ràng
Comment các đoạn khó
Component nhỏ

Không:

File quá 500 dòng
Nested logic quá sâu
18. Quy trình Codex phải làm

Khi người dùng yêu cầu tính năng:

Phân tích tính năng
Liệt kê file cần sửa
Viết code đầy đủ
Giải thích ngắn gọn
Hướng dẫn chạy
19. Seed data

Cần có:

Admin account
Categories
Products mẫu

Ít nhất:

30 sản phẩm

Có script:

npm run seed
20. Kiểm tra trước khi hoàn thành

Phải đảm bảo:

Frontend chạy không lỗi
Backend chạy không lỗi
MongoDB Atlas kết nối thành công
Không lỗi console
Responsive tốt
API hoạt động
JWT hoạt động
CRUD sản phẩm hoạt động
Cart hoạt động
Checkout hoạt động
21. Cách phản hồi cho người dùng

Luôn:

Trả lời bằng tiếng Việt
Giải thích rõ file cần sửa
Hướng dẫn từng bước
Không giải thích quá học thuật

Người dùng vẫn đang học web nên ưu tiên:

code dễ hiểu
cấu trúc rõ ràng
từng bước nhỏ