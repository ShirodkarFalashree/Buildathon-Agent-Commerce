# AgentRelay 🤖💳
> **Autonomous Agent-to-Agent (A2A) Commerce & Payment Orchestration Platform**  

---

## 🌟 Overview

**AgentRelay** is a next-generation, AI-native autonomous commerce platform where **Buyer AI Agents** and **Merchant AI Agents** directly communicate, negotiate terms, enforce governance policies, and execute zero-click financial transactions via tokenized **Razorpay Payment Vaults**.

Instead of requiring users to manually search catalog items, compare specifications, and complete multi-step checkout forms, AgentRelay enables buyers to simply describe what they need in natural language. The **Buyer Agent** queries the **Merchant Agent**, which checks real-time inventory, evaluates spending limits, applies merchant discounts, suggests cross-sell accessories, and routes payments securely according to deterministic governance rules.

---

## ✨ Key Features

### 1. 🤖 Dual Autonomous AI Agents
- **Buyer AI Agent:** Parses natural language shopping requests (e.g. *"Find budget ANC headphones under ₹10,000"*), evaluates product specifications, compares values, and manages buyer spending limits.
- **Merchant AI Agent:** Analyzes store inventory, evaluates merchant profit margins, applies promotional policies, and dynamically suggests relevant cross-sell bundles (e.g., in-flight audio adapters or hard-shell travel cases).

### 2. ⚡ 8-Step Inter-Agent (A2A) Protocol
Every shopping session follows a deterministic 8-step execution protocol:
1. **Buyer Intent Received:** User submits natural language query.
2. **Inter-Agent Query (A2A):** Buyer Agent transmits structured intent payload to Merchant Agent.
3. **Catalog & Inventory Evaluation:** Merchant Agent searches MongoDB catalog and checks stock.
4. **Merchant Proposal Dispatched:** Merchant Agent formulates proposal with primary recommendation and optional cross-sell accessory.
5. **Buyer Policy Evaluation:** Buyer Agent verifies total cart amount against autonomous spending limits.
6. **Authorization Routing:** 
   - **Under Limit (≤ ₹10,000):** Zero-click autonomous settlement via pre-authorized Razorpay Vault.
   - **Over Limit (> ₹10,000):** Triggers **Human Authorization Modal** popup.
7. **Razorpay Payment Orchestration:** Backend initiates Razorpay Order creation and server-side signature verification.
8. **Audit Trail Logging:** Session events are logged into an immutable database audit ledger.

### 3. 💳 Razorpay Tokenized Payment Vault
- **Pre-Authorized Zero-Click Checkout:** Buyers can pre-authorize their saved payment instruments (tokenized Visa/Mastercard/RuPay) for autonomous transactions up to a set threshold (e.g., ₹10,000).
- **Human-in-the-Loop Security Guardrails:** Purchases exceeding autonomous thresholds deterministically trigger a high-trust authorization modal requiring human approval before charging the vault.

### 4. 🎨 Light Enterprise SaaS UI/UX
- Inspired by modern financial platforms (Stripe, Linear, Vercel).
- **Buyer Portal:** Clean storefront, sample prompt pills, natural language chat drawer, saved card vault manager, and order history.
- **Merchant Console:** Real-time revenue metrics, product catalog grid with single-click AI Spec Inspector, policy guardrail editor, and transaction feed featuring click-to-expand **Live A2A Dialogue Timelines**.

### 5. 🛡️ PII Masking & Customer Privacy
- Customer identities in merchant-facing audit trails and A2A transaction logs are automatically masked (e.g., `alex@****.ai`, `Alex V.`) to comply with privacy guardrails while maintaining full auditability.

---

## 🏗️ Architecture & Technology Stack

### **Frontend (Client)**
- **Framework:** React 18 + Vite 8
- **Styling:** Tailwind CSS (Vanilla Light Enterprise SaaS theme)
- **Icons:** Lucide React
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios

### **Backend (Server)**
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose ODM
- **Payment Gateway:** Official Razorpay Node.js SDK (`razorpay`)
- **Architecture:** RESTful Controller-Service-Model architecture with Async Handlers

---

## 📁 Repository Structure

```
Razorpay Buildathon/
├── Client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── buyer/           # BuyerStorefront, AiShoppingChat, ApprovalModal, CustomerProfileModal, OrderConfirmation
│   │   │   ├── layout/          # BuyerNavbar, MerchantNavbar, Navbar
│   │   │   └── merchant/        # MerchantDashboard
│   │   ├── pages/
│   │   │   ├── auth/            # LoginPage, BuyerLoginPage, MerchantLoginPage
│   │   │   ├── buyer/           # BuyerProfilePage
│   │   │   ├── merchant/        # MerchantLayout
│   │   │   ├── OrderConfirmationPage.jsx
│   │   │   └── StorefrontPage.jsx
│   │   ├── services/            # Axios API instances (agentApi, paymentApi, productApi, etc.)
│   │   ├── App.jsx              # App routes & state management
│   │   └── index.css            # Base Tailwind CSS theme & custom utility classes
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Server/                      # Node.js + Express + MongoDB Backend
│   ├── src/
│   │   ├── config/              # db.js (MongoDB connection)
│   │   ├── controllers/         # agentController, paymentController, productController, etc.
│   │   ├── models/              # User, Product, Policy, Order, Customer, AuditEvent
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/            # agentService, paymentService, policyEngine
│   │   ├── seed.js              # Database seeder (Default products, users & policy)
│   │   └── app.js               # Express application entry point
│   ├── server.js                # HTTP server listener
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
# Navigate to Server directory
cd Server

# Install dependencies
npm install

# Configure environment variables (create .env file)
cp .env.example .env   # Or create .env manually
```

**Sample `.env` file for Server:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/agent_commerce
RAZORPAY_KEY_ID=rzp_test_TY0D8SOVosBKXb
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_TEST_SECRET
JWT_SECRET=agentrelay_jwt_secret_key_2026
```

```bash
# Seed default products, merchant policy, and demo user accounts
npm run seed

# Start the Backend Server (runs on http://localhost:5000)
npm run dev
```

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to Client directory
cd Client

# Install dependencies
npm install

# Start the Vite Dev Server (runs on http://localhost:5173)
npm run dev
```

---

## 🔑 Demo Login Credentials

You can use the one-click quick fill buttons on the login screen (`http://localhost:5173/login`):

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer@agentrelay.ai` | `buyer123` | Storefront, AI Shopping Drawer, Payment Vault, Order History |
| **Merchant** | `merchant@agentrelay.ai` | `admin123` | Merchant Dashboard, Policy Editor, Catalog Manager, Audit Logs |

---

## 🧪 Testing the Autonomous AI Flow

1. Log in as **Buyer** (`buyer@agentrelay.ai`).
2. Click **"Launch AI Sales Agent"** or the floating button at the bottom right.
3. Select a sample prompt or type your own:
   - **Autonomous Auto-Pay Test (under ₹10k):** *"Find budget ANC headphones under ₹10,000."*
     - *Result:* AI Agent selects product, verifies policy, and executes zero-click checkout via Razorpay Vault.
   - **Human Approval Test (over ₹10k):** *"I need a 5G smartphone with magnetic power bank under ₹60,000."*
     - *Result:* AI Agent triggers **Human Spending Authorization Required** popup requiring manual click to proceed with Razorpay payment.
4. Log in as **Merchant** (`merchant@agentrelay.ai`) to view real-time revenue metrics, product specs inspector, policy controls, and live A2A dialogue logs.

---

## 📜 License

This project was built for the **Razorpay Buildathon**. Distributed under the MIT License.
