# Qswap Transaction Tracking - Complete Refactoring

## Summary
Renamed all files, functions, tables, and imports from "purchase" terminology to "transaction" to accurately reflect that the system tracks both buy AND sell operations on Qswap.

## Backend Changes

### 1. Database Model (`backend/app/core/db.py`)
- **Renamed**: `QSwapHistory` → `QSwapTransaction`
- **Table**: `qswap_history` → `qswap_transaction`
- **Fields renamed**:
  - `purchase_id` → `transaction_id`
  - `buyer` → `wallet` (more accurate for both buys and sells)
- **Constraints renamed**: All `uq_qdoge_purchase_*` → `uq_qswap_tx_*`
- **Indexes renamed**: All `ix_qdoge_purchase_*` → `ix_qswap_tx_*`

### 2. Service Layer
- **File renamed**: `backend/app/services/qdoge_purchase.py` → `backend/app/services/qswap.py`
- **Class renamed**: `QdogePurchaseService` → `QSwapService`
- **Method renamed**: `update_purchases()` → `update_transactions()`
- **Instance renamed**: `service_qdoge_purchase` → `service_qswap`
- **Internal variables**: `purchases_to_insert` → `transactions_to_insert`

### 3. API Endpoints (`backend/app/main.py`)
- `/qdoge-purchases` → `/qswap-transactions`
- `/qdoge-purchases/wallet/{wallet_id}` → `/qswap-transactions/wallet/{wallet_id}`
- `/epochs/{epoch_num}/qdoge-purchases` → `/epochs/{epoch_num}/qswap-transactions`
- `/admin/qdoge-purchases/sync` → `/admin/admin/qswap-transactions/sync`

**Query parameter**: `buyer` → `wallet`

**Response fields**:
- `purchase_id` → `transaction_id`
- `buyer` → `wallet`
- Added: `transaction_type`, `input_type`
- Wallet endpoint now returns: `total_shares_bought`, `total_shares_sold`, `net_shares`

### 4. Background Tasks
- Function renamed: `update_qdoge_purchases_periodically()` → `update_qswap_transactions_periodically()`
- Task variable: `qdoge_purchase_task` → `qswap_task`
- Socket.IO event: `qdoge_purchases_updated` → `qswap_transactions_updated`

## Frontend Changes

### 1. TypeScript Types (`src/services/backend.service.ts`)
- **Interface renamed**: `QdogePurchase` → `QSwapTransaction`
- **Response types renamed**:
  - `QdogePurchasesResponse` → `QSwapTransactionsResponse`
  - `WalletQdogePurchasesResponse` → `WalletQSwapTransactionsResponse`
  - `EpochQdogePurchasesResponse` → `EpochQSwapTransactionsResponse`
- **Fields renamed**:
  - `purchase_id` → `transaction_id`
  - `buyer` → `wallet`
  - `purchases` → `transactions`

### 2. API Functions (`src/services/backend.service.ts`)
- `fetchQdogePurchases()` → `fetchQSwapTransactions()`
- `fetchWalletQdogePurchases()` → `fetchWalletQSwapTransactions()`
- `fetchEpochQdogePurchases()` → `fetchEpochQSwapTransactions()`
- `syncQdogePurchases()` → `syncQSwapTransactions()`

### 3. State Management
- **File renamed**: `src/store/qdogePurchases.ts` → `src/store/qswapTransactions.ts`
- **Atom renamed**: `qdogePurchasesAtom` → `qswapTransactionsAtom`

### 4. Components
- **EpochQswapPurchases** (`src/pages/activity/components/EpochQswapPurchases.tsx`):
  - Updated all imports and type references
  - Variable names: `purchases` → `transactions`
  - Uses `fetchEpochQSwapTransactions()`
  
- **EpochRangeQswapPurchases** (`src/pages/activity/components/EpochRangeQswapPurchases.tsx`):
  - Updated all imports and type references
  - Uses `fetchQSwapTransactions()`

### 5. Hooks (`src/hooks/useRealtimeUpdates.ts`)
- Socket.IO event listener: `qdoge_purchases_updated` → `qswap_transactions_updated`
- Function call: `fetchQdogePurchases()` → `fetchQSwapTransactions()`
- State setter: `setQdogePurchases` → `setQSwapTransactions`

## Migration Required

### Database Migration
Run this SQL to rename existing table and columns:

```sql
-- Rename table
ALTER TABLE qdoge_purchase RENAME TO qswap_transaction;

-- Rename columns
ALTER TABLE qswap_transaction RENAME COLUMN purchase_id TO transaction_id;
ALTER TABLE qswap_transaction RENAME COLUMN buyer TO wallet;

-- Rename constraints
ALTER TABLE qswap_transaction RENAME CONSTRAINT uq_qdoge_purchase_unique TO uq_qswap_tx_unique;
ALTER TABLE qswap_transaction RENAME CONSTRAINT ck_qdoge_purchase_amount_positive TO ck_qswap_tx_amount_positive;
ALTER TABLE qswap_transaction RENAME CONSTRAINT ck_qdoge_purchase_shares_positive TO ck_qswap_tx_shares_positive;
ALTER TABLE qswap_transaction RENAME CONSTRAINT ck_qdoge_purchase_type_valid TO ck_qswap_tx_type_valid;

-- Rename indexes
ALTER INDEX ix_qdoge_purchase_buyer RENAME TO ix_qswap_tx_wallet;
ALTER INDEX ix_qdoge_purchase_timestamp RENAME TO ix_qswap_tx_timestamp;
ALTER INDEX ix_qdoge_purchase_tick_number RENAME TO ix_qswap_tx_tick_number;
ALTER INDEX ix_qdoge_purchase_transaction_type RENAME TO ix_qswap_tx_type;
```

## Benefits of Refactoring

1. **Clarity**: "Transaction" accurately describes both buy and sell operations
2. **Consistency**: Field names match their actual purpose (wallet vs buyer)
3. **Maintainability**: Clear naming makes code easier to understand
4. **Scalability**: Better foundation for future Qswap features

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database migration applied successfully
- [ ] API endpoints respond correctly
- [ ] Frontend compiles without TypeScript errors
- [ ] Activity page shows Qswap tab
- [ ] Qswap transactions display with buy/sell types
- [ ] Real-time updates work
- [ ] Admin sync endpoint functions
- [ ] Wallet-specific queries work
- [ ] Epoch-specific queries work

## Files Modified

**Backend:**
- `backend/app/core/db.py`
- `backend/app/services/qdoge_purchase.py` → `backend/app/services/qswap.py`
- `backend/app/main.py`

**Frontend:**
- `src/services/backend.service.ts`
- `src/store/qdogePurchases.ts` → `src/store/qswapTransactions.ts`
- `src/hooks/useRealtimeUpdates.ts`
- `src/pages/activity/components/EpochQswapPurchases.tsx`
- `src/pages/activity/components/EpochRangeQswapPurchases.tsx`
- `src/pages/qswap-purchases/index.tsx`
