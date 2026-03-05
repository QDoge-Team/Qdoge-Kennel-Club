# Qswap Buy/Sell Transaction Tracking

## Overview
Extended the QDOGE purchase tracking system to support both buy and sell transactions on Qswap.

## Changes Made

### Backend Changes

#### 1. Database Model (`backend/app/core/db.py`)
- **Added `QdogePurchase` model** with the following fields:
  - `transaction_type`: VARCHAR(10) - 'buy' or 'sell'
  - `input_type`: BIGINT - Original inputType from RPC API (6-9)
  - Added check constraint to validate transaction_type
  - Added index on transaction_type for efficient filtering

#### 2. Service Layer (`backend/app/services/qdoge_purchase.py`)
- **Updated RPC query** to fetch inputType 6-9 (previously 6-7):
  - inputType 6-7: Buy transactions (user sends Qubic, receives QDOGE)
  - inputType 8-9: Sell transactions (user sends QDOGE, receives Qubic)
- **Added `_get_transaction_type()` method** to determine transaction type based on inputType
- **Updated `update_purchases()` method** to:
  - Filter transactions by inputType 6-9
  - Determine transaction type for each transaction
  - Store transaction_type and input_type in database

#### 3. Database Migration
- Created migration script: `backend/migrations/001_add_transaction_type_to_qdoge_purchase.sql`
- Adds new columns with defaults for existing records
- Adds constraints and indexes

### Frontend Changes

#### 1. TypeScript Types (`src/services/backend.service.ts`)
- **Updated `QdogePurchase` interface** to include:
  - `transaction_type`: "buy" | "sell"
  - `input_type`: number

#### 2. UI Components

**EpochQswapPurchases** (`src/pages/activity/components/EpochQswapPurchases.tsx`):
- Updated title from "Purchases" to "Transactions"
- **Enhanced stats summary** with 8 cards:
  - Buy Shares (green)
  - Sell Shares (red)
  - Buy Amount (blue)
  - Sell Amount (orange)
  - Buy Transactions (purple)
  - Sell Transactions (pink)
  - Unique Buyers (cyan)
  - Unique Sellers (yellow)
- **Updated transaction table** to show:
  - Transaction Type column (BUY/SELL with color coding)
  - Shares with +/- prefix (green for buy, red for sell)
- **Split rankings** into two sections:
  - Top Buyers (green theme)
  - Top Sellers (red theme)

**EpochRangeQswapPurchases** (`src/pages/activity/components/EpochRangeQswapPurchases.tsx`):
- Applied same changes as EpochQswapPurchases for epoch ranges

## Transaction Types

### Buy Transactions (inputType 6-7)
- User sends Qubic to Qswap contract
- User receives QDOGE shares
- Displayed in green with "+" prefix

### Sell Transactions (inputType 8-9)
- User sends QDOGE shares to Qswap contract
- User receives Qubic
- Displayed in red with "-" prefix

## Data Structure

### Database Schema
```sql
CREATE TABLE qdoge_purchase (
    purchase_id BIGINT PRIMARY KEY,
    tx_hash VARCHAR(128) NOT NULL,
    buyer VARCHAR(60) NOT NULL,  -- For sell, this is the seller
    source VARCHAR(60) NOT NULL,
    amount NUMERIC(38,0) NOT NULL,
    number_of_shares NUMERIC(38,0) NOT NULL,
    tick_number BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    issuer VARCHAR(60) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL DEFAULT 'buy',
    input_type BIGINT NOT NULL,
    CONSTRAINT ck_qdoge_purchase_type_valid CHECK (transaction_type IN ('buy', 'sell'))
);
```

### API Response
```typescript
{
  purchase_id: number;
  tx_hash: string;
  buyer: string;  // For sell, this is the seller
  source: string;
  amount: string;
  number_of_shares: string;
  tick_number: number;
  timestamp: string;
  issuer: string;
  asset_name: string;
  transaction_type: "buy" | "sell";
  input_type: number;
}
```

## Migration Steps

1. **Apply database migration**:
   ```bash
   psql -U <user> -d <database> -f backend/migrations/001_add_transaction_type_to_qdoge_purchase.sql
   ```

2. **Restart backend** to load new model:
   ```bash
   cd backend
   python -m app.main
   ```

3. **Sync new transactions**:
   - Background task will automatically fetch new transactions every 5 minutes
   - Or manually trigger: `POST /api/admin/qdoge-purchases/sync`

## Testing

1. Check backend logs for successful transaction fetching
2. Verify both buy and sell transactions appear in the database
3. Navigate to Activity page → Select epoch → Click "Qswap" tab
4. Verify:
   - Stats show separate buy/sell metrics
   - Transaction table shows type column
   - Top Buyers and Top Sellers sections display correctly

## Notes

- Existing records default to transaction_type='buy' and input_type=6
- The `buyer` field name is kept for backward compatibility (it represents the wallet address for both buys and sells)
- All API endpoints remain unchanged and work with both transaction types
- Frontend automatically separates buy/sell transactions for display
