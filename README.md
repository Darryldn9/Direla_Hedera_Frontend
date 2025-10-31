# Direla: To Serve

**Project Track:** Onchain Finance & Real-World Assets (RWA): Financial Inclusion (Subtrack 3)

---

## Pitch Deck & Certification

- **Pitch Deck:** https://www.canva.com/design/DAG3BLdZHSc/DkNG6YdPQWMTcrqQOk4LGQ/view?utm_content=DAG3BLdZHSc&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h615475e329 [https://www.canva.com/design/DAG3BLdZHSc/DkNG6YdPQWMTcrqQOk4LGQ/view?utm_content=DAG3BLdZHSc&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h615475e329]
- **Pitch Video:** https://youtu.be/Sf8Wru6vPx8 [https://youtu.be/Sf8Wru6vPx8]
- **Certification Links:** https://drive.google.com/file/d/1r-uRyLJRfBlkzgTPcfv3jXm59rCqYHSy/view?usp=drive_link [https://drive.google.com/file/d/1r-uRyLJRfBlkzgTPcfv3jXm59rCqYHSy/view?usp=drive_link]


---

## Hedera Integration Summary

### Hedera Token Service (HTS)

We used HTS to create and manage multi-currency stablecoins (USD and ZAR) for quick and simple cross-border payments and local transactions in South Africa. Hedera's $0.001 fee per token operation ensures cost-effective micro-transactions and installment payments, which is a key step towards enabling digital payments at scale across diverse economic segments. The ability to mint and burn tokens programmatically allows us to dynamically manage the supply tied to real-world currency reserves, maintaining peg stability whilst minimising operational overhead.

**Transaction Types:**
- `TokenCreateTransaction` - Creates USD and ZAR stablecoins with infinite supply capability
- `TokenMintTransaction` - Mints tokens when users deposit funds or receive payments
- `TokenBurnTransaction` - Burns tokens when users withdraw or make payments
- `TokenTransferTransaction` - Transfers tokens between accounts for payments
- `TokenAssociateTransaction` - Associates accounts with tokens before they can receive them

**Economic Justification:**
Hedera's low, predictable fees ($0.001 per token operation) are essential for the African market where transaction volumes are high but individual transaction values can be low. Traditional payment rails charge 2-3% per transaction plus fixed fees, making small purchases economically unviable. With Hedera HTS, a R10 (approximately $0.50) purchase costs less than R0.02 in fees, enabling financially sustainable micro-payments and allowing merchants to accept small-ticket transactions that would otherwise be unprofitable.

### Hedera Consensus Service (HCS)

HCS provides immutable, auditable logging of all critical financial events including BNPL agreement creation, acceptance, rejection, and completion. We chose HCS because its $0.0001 per message fee guarantees tamper-proof transaction records that are essential for regulatory compliance and dispute resolution in South Africa's financial services sector. The deterministic ordering and timestamping enable accurate credit scoring and risk assessment.

**Transaction Types:**
- `TopicCreateTransaction` - Creates HCS topics for DID and BNPL event logging
- `TopicMessageSubmitTransaction` - Publishes DID creation events, transaction logs, and BNPL lifecycle events to the immutable ledger

**Economic Justification:**
Traditional audit logging solutions cost $50-200 per month per merchant plus per-message charges, making comprehensive transaction logging prohibitively expensive for SMEs. HCS messages at $0.0001 each allow us to log every payment, agreement, and credit event for approximately $0.01 per month for an average merchant, reducing compliance costs by 99% and enabling transparent, verifiable financial records accessible to regulators and auditors without additional infrastructure.

### Hedera Smart Contracts (Hedera EVM)

Our Buy Now Pay Later (BNPL) agreements are managed through a Solidity smart contract deployed on Hedera EVM, automating installment tracking, payment processing, and agreement completion. We selected Hedera's EVM compatibility for smart contracts because it combines Ethereum's mature tooling and developer ecosystem with Hedera's $0.05 per contract execution fee (compared to Ethereum's volatile $5-50+ gas fees), ensuring that processing an installment payment costs less than the interest earned, maintaining profitability even on small loans.

**Transaction Types:**
- `ContractCreateTransaction` - Deploys the BNPL smart contract to Hedera EVM
- `ContractExecuteTransaction` - Executes contract functions for creating agreements, processing installments, and managing BNPL lifecycle

**Economic Justification:**
BNPL profitability depends on processing costs remaining below interest margins. On Ethereum, a single contract execution can cost $20-100 during network congestion, eliminating profits on loans under $500. Hedera's consistent $0.05 fee structure means even a £10 installment (with £0.50 interest) generates net profit of £0.45, enabling sustainable microlending that supports financial inclusion for low-income consumers who cannot access traditional credit products.

### Hedera Account Service

We utilise Hedera's native account creation and management capabilities to provide each user with their own blockchain identity, enabling direct ownership and control of digital assets without intermediary custodial services.

**Transaction Types:**
- `AccountCreateTransaction` - Creates new Hedera accounts for users with initial HBAR balances
- `TransferTransaction` - Transfers HBAR between accounts for transaction fees and account funding

**Economic Justification:**
Hedera's $0.001 fee per account creation and $0.0001 per HBAR transfer provide the most cost-effective blockchain account infrastructure available. Competing chains charge 10-100x more, making account-based wallets economically unviable for mass-market adoption. Our users can create accounts, fund them, and manage assets at a fraction of traditional banking account fees, reducing barriers to financial inclusion in South Africa where 20% of the population remains unbanked.

---

## Transaction Types

The following Hedera transaction types are executed in this project:

### Account Management
- `AccountCreateTransaction` - Creates new Hedera accounts for users
- `AccountBalanceQuery` - Queries account balances (HBAR and tokens)
- `AccountInfoQuery` - Retrieves detailed account information

### Token Operations (HTS)
- `TokenCreateTransaction` - Creates USD and ZAR stablecoins
- `TokenMintTransaction` - Mints tokens for deposits and payments
- `TokenBurnTransaction` - Burns tokens for withdrawals and payments
- `TokenTransferTransaction` - Transfers tokens between accounts
- `TokenAssociateTransaction` - Associates accounts with tokens
- `TokenDissociateTransaction` - Dissociates accounts from tokens (not currently used)

### Consensus Service (HCS)
- `TopicCreateTransaction` - Creates topics for event logging
- `TopicMessageSubmitTransaction` - Publishes messages to topics (DID events, BNPL events, transaction logs)

### Smart Contracts (Hedera EVM)
- `ContractCreateTransaction` - Deploys BNPL smart contract
- `ContractExecuteTransaction` - Executes BNPL contract functions (create agreement, pay installment, etc.)

### Payments
- `TransferTransaction` - Transfers HBAR between accounts

### Transaction History
- `TransactionRecordQuery` - Queries transaction records and receipts

---

## Economic Justification

### Low, Predictable Fees

Hedera's fee structure is the cornerstone of our economic model:

- **Token Operations:** $0.001 per operation (mint, burn, transfer)
- **Account Creation:** $0.001 per account
- **Smart Contract Execution:** $0.05 per execution
- **HCS Messages:** $0.0001 per message
- **HBAR Transfers:** $0.0001 per HBAR transferred

In contrast, traditional payment processors charge 2-3% + fixed fees per transaction, and blockchain alternatives like Ethereum can cost $5-100+ per transaction during congestion.

### High Throughput

Hedera's 10,000+ transactions per second capacity ensures that our payment system can scale to handle South Africa's retail payment volume (millions of transactions daily) without congestion-related fee spikes that would make micro-transactions uneconomical.

### ABFT Finality

Asynchronous Byzantine Fault Tolerance provides deterministic transaction finality within 3-5 seconds, eliminating the need for expensive confirmation wait times or manual reconciliation processes that increase operational costs in traditional payment systems.

### Impact on Financial Sustainability

These characteristics directly enable:
- **Micro-payments:** Process R10 transactions profitably (impossible with 2-3% fees)
- **Microlending:** Offer BNPL on £10-50 purchases (economically unviable on Ethereum)
- **SME Support:** Enable small merchants to accept card payments without losing margins to fees
- **Financial Inclusion:** Reduce barriers for unbanked populations through affordable account creation and operations

---

## Deployment & Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Redis server (for caching)
- Hedera Testnet account with HBAR balance (minimum 10 HBAR recommended)
- Expo CLI (for frontend)

### Step 1: Clone Repository

```bash
git clone [https://github.com/Darryldn9/Direla_Hedera_Frontend/]
cd hedera-hackathon
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp env.example .env
```

Edit `.env` with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx
HEDERA_NETWORK=testnet

# Token IDs (create tokens first - see below)
USD_TOKEN_ID=0.0.xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx

# Database Configuration
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx

# Redis Configuration; we used a remote Redis DB
REDIS_URL=redis://localhost:6379
REDIS_TTL_SECONDS=30

# HCS Topic ID (create topic first or leave empty to auto-create)
HCS_TOPIC_ID=0.0.xxxxx

# BNPL Smart Contract (deploy contract first)
BNPL_ADDRESS=0x...
HEDERA_EVM_RPC_URL=https://testnet.hashio.io/api
HEDERA_EVM_PRIVATE_KEY=0x...

# Currency API (for exchange rates)
FREE_CURRENCY_API_KEY=xxx
```

### Step 4: Create Stablecoins (Optional)

Run the stablecoin creation script:

```bash
cd backend
./create-stablecoins.sh
# or
node create-stablecoins.js
```

This creates USD and ZAR stablecoins. Update your `.env` file with the generated token IDs and supply keys.

### Step 5: Deploy BNPL Smart Contract (Optional)

```bash
cd backend
npx hardhat compile
npx hardhat deploy --network hedera_testnet
```

Update `BNPL_ADDRESS` in your `.env` file with the deployed contract address.

### Step 6: Create HCS Topic (if not in .env)

```bash
cd backend
npx tsx src/utils/hcs-setup.ts
```

Update `HCS_TOPIC_ID` in your `.env` file with the created topic ID.

### Step 7: Set Up Database

Apply migrations:

```bash
cd backend
# If using Supabase, migrations are in supabase/migrations/
# Apply them via Supabase dashboard or CLI
```

### Step 8: Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

### Step 9: Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
```

### Step 10: Configure Frontend API

Edit `frontend/services/api/config.ts` and update the `MY_IP` variable with your local IP address (for mobile device testing).

### Step 11: Start Frontend

```bash
cd frontend
npm run dev
```

Follow the Expo CLI prompts to:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

---

## Running Environment

### Backend

- **Development:** `npm run dev` in `backend/` directory
- **Production:** `npm run build && npm start` in `backend/` directory
- **Port:** 3000 (configurable via `PORT` environment variable)
- **API Base URL:** `http://localhost:3000/api`
- **Interactive API Docs:** `http://localhost:3000/api-docs`

### Frontend

- **Development:** `npm run dev` in `frontend/` directory
- **Expo Dev Server:** Runs on default Expo ports (19000, 19001, 19002)
- **Mobile App:** Opens in iOS Simulator, Android Emulator, or Expo Go app

### Required Services

- **PostgreSQL/Supabase:** Database for user and account data
- **Redis:** Caching layer for transaction history and currency quotes
- **Hedera Testnet:** All blockchain operations use Hedera Testnet

---

## Architecture Diagrams
- Diagram 1 [https://drive.google.com/file/d/1Oa-3A_7HuBzHPhU_dRI3f2s72gVg26qM/view?usp=drive_link]
- Diagram 2 [https://drive.google.com/file/d/1PHIKoTkryirP9P5cuUcl_zi7I9RZjx2f/view?usp=drive_link]

---

## Deployed Hedera IDs

### Testnet Account IDs

- **Operator Account:** `0.0.6435129` - Main backend operator account
- **Treasury Account:** `0.0.6435129` - Token operations treasury

### HTS Token IDs

- **USD Stablecoin Token ID:** `0.0.6869755`
  - Name: Demo USD Stablecoin
  - Symbol: DUSD
  - Decimals: 2

- **ZAR Stablecoin Token ID:** `0.0.6889204`
  - Name: Demo ZAR Stablecoin
  - Symbol: DZAR
  - Decimals: 2

### HCS Topic IDs

- **DID & Transaction Logging Topic:** `0.0.6880055`
  - Used for: DID creation events, transaction logs, BNPL lifecycle events

### Smart Contract Addresses

- **BNPL Contract Address:** `0x94321C28ED728cbCA13B916618485D919bABE63F`
  - Network: Hedera EVM Testnet
  - Contract: BNPL.sol

---

## Additional Notes

- All deployments are on Hedera **Testnet**
- The stablecoin creation script generates token IDs and supply keys that must be added to `.env`
- The BNPL contract must be deployed before the application can process BNPL agreements
- HCS topics can be created automatically if not provided in `.env`

---

## Support & Documentation

- **Backend API Documentation:** `http://localhost:3000/api-docs` (when server is running)
- **Backend README:** `backend/README.md`
- **Frontend README:** `frontend/README.md`
- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **BNPL Documentation:** `BNPL_CURRENCY_CONVERSION.md`

