# Final Examination: MERN Stack Web Development

**Student Name:** Muhammad Sami Ullah  
**Roll Number:** HM-2025-1010-671  
**Email:** Kk34samikhan@gmail.com  
**Course:** MERN Stack Web Development  
**Repository:** [https://github.com/Sami3234/Final-Exam](https://github.com/Sami3234/Final-Exam)

---

## 📌 Attempted Questions Overview

| Question | Title | Deliverables | Status |
| :--- | :--- | :--- | :---: |
| **Question 1** | **ShopEase Code Review & Hardening** | Full analysis, Race timeline, Fixes, Test plan | Completed |
| **Question 3** | **CartCraft: Safe Shopping Cart & Checkout** | Full-stack MERN application, Tests, Git history | Completed |

---

## 🚀 Question 3: CartCraft — Shopping Cart & Safe Checkout

### 1. Personal Shipping Rules ($N = 671$)
Calculated using the student roll number identifier ($N = 671$):
* **Flat Shipping Fee:** $50 + N = 50 + 671 = \mathbf{721\text{ PKR}}$
* **Free Shipping Threshold:** $1000 + N = 1000 + 671 = \mathbf{1671\text{ PKR}}$
* **Application Rule:**
  * Subtotal $< 1671\text{ PKR} \implies \text{Shipping} = \mathbf{721\text{ PKR}}$
  * Subtotal $\ge 1671\text{ PKR} \implies \text{Shipping} = \mathbf{0\text{ PKR (FREE)}}$
  * *All prices and shipping fees are calculated on the server; client payloads are never trusted.*

### 2. Core Architecture & Security Guarantees
1. **Server-Side Cart & DB Price Integrity:**
   * Cart only persists `{ product: ObjectId, quantity: Number }`.
   * Unit prices are always fetched dynamically from the database.
2. **All-or-Nothing Atomic Stock Handling:**
   * Stock is checked and decremented atomically (`{ stock: { $gte: qty } }`).
   * If any item in the cart lacks inventory, the entire checkout fails and all reserved inventory is rolled back.
3. **Idempotency Protection:**
   * Handled via client-generated `Idempotency-Key` HTTP header.
   * Duplicate requests (double-clicks or network retries) return the existing order without creating duplicate records or double-deducting stock.
4. **Owner-Restricted Orders & Single-Restore Cancellation:**
   * Access to orders is strictly restricted to the order owner or Admin.
   * Cancelling an order uses atomic status transitions (`'placed' -> 'cancelled'`), guaranteeing stock is restored **exactly once**.

---

## 📁 Repository Structure

```text
Final-Exam/
├── q3/                               # Question 3: CartCraft Project
│   ├── server/                       # Express 4, Node.js, MongoDB API
│   │   ├── config/                   # Database connection
│   │   ├── controllers/              # Auth, Product, Cart, Checkout, Order controllers
│   │   ├── middleware/               # JWT authentication & admin guards
│   │   ├── models/                   # Mongoose schemas (User, Product, Cart, Order, Idempotency)
│   │   ├── routes/                   # API endpoint routes
│   │   ├── tests/                    # Automated test suites
│   │   ├── package.json
│   │   └── server.js
│   ├── client/                       # React (Vite) Frontend Application
│   │   ├── src/
│   │   │   ├── context/              # Authentication context (JWT state)
│   │   │   ├── pages/                # Login, Register, Products, Cart, Orders
│   │   │   ├── api.js                # API client with token & headers
│   │   │   ├── App.jsx               # Navigation and routing
│   │   │   └── App.css               # Clean modern styling
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── package.json
│   └── README.md                     # q3 project specific README
├── Screen Recordings/                # Screen recording folder (Q3.mp4)
├── SUBMISSION.txt                    # Examination submission credentials & links
├── .gitignore
└── README.md                         # Main repository README
```

---

## ⚙️ Installation & Execution Instructions

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (running locally on port 27017 or via remote MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd q3/server
npm install
npm run seed       # Seeds database with admin, customer, and sample products
npm start          # Runs backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd ../client
npm install
npm run dev        # Runs React client on http://localhost:3000
```

Open your browser at `http://localhost:3000`.

---

## 👤 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@cartcraft.com` | `password123` | Add to cart, safe checkout, view/cancel orders |
| **Customer 2** | `customer2@cartcraft.com` | `password123` | Multi-user stock testing & concurrency |
| **Admin** | `admin@cartcraft.com` | `password123` | Create new products, view all orders |

---

## 🧪 Automated Verification Test Scripts

Ensure the backend server is running (`npm start`), then in `q3/server` run:

1. **Idempotency Test (Double Submission):**
   ```bash
   npm run test:idempotency
   ```
   *Verifies identical `Idempotency-Key` returns existing order without duplicate stock deduction.*

2. **All-or-Nothing Stock Failure Test:**
   ```bash
   npm run test:concurrency
   ```
   *Verifies zero partial stock deduction when one item exceeds available inventory.*

3. **Exactly-Once Cancellation Test:**
   ```bash
   npm run test:cancel
   ```
   *Verifies stock is restored only once even upon multiple rapid cancellation calls.*

---

## 📑 Question 1: ShopEase Code Review Summary

* **Part A (9 Bugs & Fixes):**
  * *Snippet 1 (Orders & Stock):* Broken Object Level Authorization (IDOR) on `getOrder`, Unauthorized cancellation on `cancelOrder`, $N+1$ query bottleneck on `myOrders`.
  * *Snippet 2 (React Product List):* Missing dependency array causing infinite re-render fetch loop, Direct state mutation on `cart.push()`, Stored XSS vulnerability on `dangerouslySetInnerHTML`.
  * *Snippet 3 (Password Reset & Setup):* User enumeration on `forgotPassword`, Cryptographically weak pseudo-random token (`Math.random()`) without expiry, Hardcoded database credentials.
* **Part B (Orders Under Load):**
  * Step-by-step race condition timeline for the last unit of "Limited Edition" ($20 + 671 = 691$ units).
  * Safe atomic conditional decrement (`$gte`) and transactional rollback implementation.
  * Authoritative server-side price evaluation and single-restore cancellation.
* **Part C (Test Plan):**
  * 4 verifiable before/after test cases covering price tampering, concurrent overselling, duplicate cancellation, and React infinite fetch loops.
