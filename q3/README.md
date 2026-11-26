# CartCraft - Shopping Cart & Safe Checkout

**Author:** Muhammad Sami Ullah  
**Roll Number:** HM-2025-1010-671 ($N = 671$)  
**Email:** Kk34samikhan@gmail.com  
**Course:** MERN Stack Web Development  

---

## 1. Personal Shipping Rules ($N = 671$)
- **Flat Shipping Fee:** $50 + N = 50 + 671 = \mathbf{721\text{ PKR}}$
- **Free Shipping Threshold:** $1000 + N = 1000 + 671 = \mathbf{1671\text{ PKR}}$
- If `Subtotal >= 1671 PKR`, shipping is **0 PKR (FREE)**.
- If `Subtotal < 1671 PKR`, shipping is **721 PKR**.
- All calculations are processed on the server; client prices and totals are never trusted.

---

## 2. Architecture & Security Guarantees
1. **Server-Side Cart & DB Price Lookup:**
   - The database cart only stores `{ product: ObjectId, quantity: Number }`.
   - Prices and stock levels are always dynamically loaded from the database at the time of cart rendering and checkout.
2. **All-or-Nothing Atomic Stock Handling:**
   - Checkout decrements product stock using atomic database operations (`$gte` conditional updates).
   - If any cart item lacks sufficient stock, the entire checkout fails immediately, and no partial stock is deducted.
3. **Idempotency Protection:**
   - The client sends a unique `Idempotency-Key` header with each checkout.
   - If the request is retried (or double-clicked), the server returns the existing order response without deducting inventory twice or creating duplicate orders.
4. **Orders & Single-Restore Cancellation:**
   - Orders are restricted by ownership (`req.user._id`) or Admin role.
   - Cancelling an order checks and updates order status from `'placed'` to `'cancelled'` atomically, ensuring stock is returned exactly once even if the cancel endpoint is invoked repeatedly.

---

## 3. Project Structure
```text
q3/
├── server/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Auth, Product, Cart, Checkout, Order controllers
│   ├── middleware/      # JWT auth and role guards
│   ├── models/          # User, Product, Cart, Order, Idempotency schemas
│   ├── routes/          # Express route definitions
│   ├── tests/           # Automated test scripts (Idempotency, Concurrency, Cancel)
│   ├── package.json
│   └── server.js
├── client/
│   ├── src/             # React components, AuthContext, API client, CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 4. Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally at `mongodb://127.0.0.1:27017/cartcraft` (or set `MONGO_URI` in `server/.env`)

### Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds demo accounts and sample products
npm start        # Starts server on port 5000
```

### Frontend Setup
```bash
cd ../client
npm install
npm run dev      # Starts React client on port 3000
```

Open `http://localhost:3000` in your web browser.

---

## 5. Demo Accounts
- **Customer:** `customer@cartcraft.com` / `password123`
- **Customer 2:** `customer2@cartcraft.com` / `password123`
- **Admin:** `admin@cartcraft.com` / `password123`

---

## 6. Running Test Verification Scripts
Ensure the server is running on port 5000, then execute:

1. **Idempotency Verification:**
   ```bash
   cd server
   npm run test:idempotency
   ```
2. **All-or-Nothing Low-Stock Failure:**
   ```bash
   npm run test:concurrency
   ```
3. **Exact-Once Cancellation:**
   ```bash
   npm run test:cancel
   ```
