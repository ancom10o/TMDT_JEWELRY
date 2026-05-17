# JewelAura MERN Stack

JewelAura la du an website ban trang suc xay dung bang MERN Stack.

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB Atlas + Mongoose
- Authentication: JWT + bcryptjs

## Cau truc thu muc

```txt
jewelaura-mern/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   `-- package.json
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- seeders/
|   |-- package.json
|   `-- server.js
|-- package.json
`-- README.md
```

## Cai dat

Chay tai thu muc goc:

```bash
npm run install:all
```

## Tao file moi truong

Neu chua co file moi truong cho server, tao bang PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Cap nhat cac bien quan trong trong `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Neu can cau hinh API URL cho client, tao them `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Seed data

Nhap du lieu mau:

```bash
npm run seed --prefix server
```

Xoa du lieu mau:

```bash
npm run seed:destroy --prefix server
```

Seed hien tai tao:

- 1 tai khoan admin
- 7 danh muc
- 36 san pham mau

Tai khoan admin mac dinh:

```txt
Email: admin@jewelaura.vn
Password: Admin@123
```

## Chay backend

```bash
npm run dev:server
```

Hoac:

```bash
npm run dev --prefix server
```

Backend mac dinh chay tai `http://localhost:5000`.

## Chay frontend

```bash
npm run dev:client
```

Hoac:

```bash
npm run dev --prefix client
```

Frontend mac dinh chay tai `http://localhost:5173`.

## Chay ca client va server

```bash
npm run dev
```

## API kiem tra nhanh

- Health: `GET http://localhost:5000/api/health`
- Products: `GET http://localhost:5000/api/products`
- Categories: `GET http://localhost:5000/api/categories`
- Auth me: `GET http://localhost:5000/api/auth/me`

## Ghi chu

- Can MongoDB Atlas hoat dong de dung day du auth, gio hang, dat hang va admin.
- Neu chi muon kiem tra server da len hay chua, dung `GET /api/health`.
