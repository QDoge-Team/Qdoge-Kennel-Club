# Frontend-Backend Integration for QDOGE Purchase Tracking

This document describes the complete integration between the frontend and backend for tracking QDOGE purchases from Qswap.

## Overview

The system provides real-time tracking of QDOGE token purchases with:
- Backend API endpoints for querying purchase data
- Frontend UI for viewing and filtering purchases
- Real-time updates via Socket.IO
- State management with Jotai
- Navigation integration

## Backend Components

### Database Model
**Table:** `qdoge_purchase`
- Stores all QDOGE purchases from Qswap
- Tracks buyer, amount, shares, timestamp, etc.
- Unique constraints prevent duplicates
- Indexes for performance

### API Endpoints

#### Public Endpoints
1. **GET `/api/qdoge-purchases`**
   - Query params: `page`, `size`, `buyer` (optional)
   - Returns paginated list of purchases

2. **GET `/api/qdoge-purchases/wallet/{wallet_id}`**
   - Query params: `page`, `size`
   - Returns purchases for specific wallet with total shares

3. **GET `/api/epochs/{epoch_num}/qdoge-purchases`**
   - Returns purchases within a specific epoch

#### Admin Endpoints
1. **POST `/api/admin/qdoge-purchases/sync`**
   - Manually trigger purchase sync
   - Requires `X-Admin-API-Key` header

### Background Service
- Runs every 5 minutes (configurable)
- Fetches new transactions from Qubic RPC API
- Parses 48-byte inputData structure
- Filters for QDOGE tokens only
- Stores in database with duplicate detection

### Socket.IO Events
**Event:** `qdoge_purchases_updated`
```json
{
  "inserted": 5,
  "fetched": 10
}
```

## Frontend Components

### Service Layer (`src/services/backend.service.ts`)

#### Types
```typescript
export interface QdogePurchase {
  purchase_id: number;
  tx_hash: string;
  buyer: string;
  source: string;
  amount: string;
  number_of_shares: string;
  tick_number: number;
  timestamp: string;
  issuer: string;
  asset_name: string;
}

export interface QdogePurchasesResponse {
  page: number;
  size: number;
  purchases: QdogePurchase[];
}

export interface WalletQdogePurchasesResponse {
  wallet_id: string;
  page: number;
  size: number;
  total_shares_purchased: string;
  purchases: QdogePurchase[];
}

export interface EpochQdogePurchasesResponse {
  epoch_num: number;
  purchases: QdogePurchase[];
}
```

#### API Functions
```typescript
// Fetch all QDOGE purchases (paginated)
fetchQdogePurchases(page = 0, size = 100, buyer?: string): Promise<QdogePurchase[]>

// Fetch QDOGE purchases for a specific wallet
fetchWalletQdogePurchases(walletId: string, page = 0, size = 100): Promise<WalletQdogePurchasesResponse>

// Fetch QDOGE purchases for a specific epoch
fetchEpochQdogePurchases(epochNum: number): Promise<QdogePurchase[]>

// Admin: Manually trigger QDOGE purchase sync
syncQdogePurchases(apiKey: string): Promise<{ success: boolean; fetched: number; inserted: number; skipped: number }>
```

### State Management (`src/store/qdogePurchases.ts`)
```typescript
import { atom } from "jotai";
import type { QdogePurchase } from "@/services/backend.service";

export const qdogePurchasesAtom = atom<QdogePurchase[]>([]);
```

### Real-time Updates (`src/hooks/useRealtimeUpdates.ts`)
- Listens for `qdoge_purchases_updated` Socket.IO event
- Automatically refetches purchases when new data is available
- Updates the Jotai atom for reactive UI updates

### UI Page (`src/pages/qswap-purchases/index.tsx`)

Features:
- Displays paginated list of QDOGE purchases
- Search/filter by buyer wallet address
- Shows buyer, amount, shares, price per share, tx hash, tick, timestamp
- Links to entity pages and explorer
- Real-time updates via Socket.IO
- Responsive table with scroll area

### Navigation

#### Route (`src/router/index.tsx`)
```typescript
{
  path: "/qswap-purchases",
  element: <QswapPurchases />,
}
```

#### Header Link (`src/layouts/Header.tsx`)
- Shopping cart icon in header navigation
- Tooltip: "Qswap Purchases"
- Links to `/qswap-purchases`

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Qubic RPC API                            │
│  https://rpc.qubic.org/query/v1/getTransactionsForIdentity  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Service (Python)                        │
│  - Fetches transactions (inputType 6-7)                     │
│  - Parses 48-byte inputData                                 │
│  - Filters for QDOGE tokens                                 │
│  - Stores in PostgreSQL database                            │
│  - Emits Socket.IO event                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─────────────────┐
                     │                 │
                     ▼                 ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   REST API Endpoints     │  │   Socket.IO Events       │
│   /api/qdoge-purchases   │  │   qdoge_purchases_updated│
└────────────┬─────────────┘  └──────────┬───────────────┘
             │                           │
             │                           │
             ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)                   │
│  - Fetches data via API                                     │
│  - Listens for Socket.IO events                             │
│  - Updates Jotai state                                      │
│  - Renders UI with real-time updates                        │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### View All Purchases
1. Navigate to `/qswap-purchases` or click shopping cart icon in header
2. View paginated list of recent QDOGE purchases
3. Purchases update automatically when new data arrives

### Filter by Wallet
1. Enter wallet address in search box
2. Click "Search" or press Enter
3. View purchases for that specific wallet
4. Click "Clear" to remove filter

### View Purchase Details
- Click buyer address to view entity page
- Click tx hash to view transaction on explorer
- See amount paid, shares received, and price per share

### Admin: Manual Sync
```typescript
import { syncQdogePurchases } from "@/services/backend.service";

const result = await syncQdogePurchases(adminApiKey);
console.log(`Synced: ${result.inserted} new purchases`);
```

## Real-time Updates

The system automatically updates when:
1. Background task fetches new purchases (every 5 minutes)
2. Admin manually triggers sync
3. Socket.IO event is emitted
4. Frontend receives event and refetches data
5. UI updates reactively via Jotai

## Configuration

### Backend
- `TRADE_UPDATE_INTERVAL`: Sync interval in seconds (default: 300)
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_API_KEY`: Admin authentication key

### Frontend
- `VITE_API_URL`: Backend API URL (default: `/api`)
- Socket.IO connects to same origin as API

## Testing

### Backend
```bash
cd backend
python -m pytest tests/unit/test_qdoge_purchase_service.py -v
```

### Frontend
```bash
npm run dev
# Navigate to http://localhost:5173/qswap-purchases
```

### Manual API Testing
```bash
# Get all purchases
curl http://localhost/api/qdoge-purchases

# Get purchases for wallet
curl http://localhost/api/qdoge-purchases/wallet/WALLETADDRESS

# Get purchases in epoch
curl http://localhost/api/epochs/1/qdoge-purchases

# Admin: Trigger sync
curl -X POST http://localhost/api/admin/qdoge-purchases/sync \
  -H "X-Admin-API-Key: your-key"
```

## Performance Considerations

### Backend
- Incremental updates (only new transactions)
- Batch processing (500 records at a time)
- Database-level duplicate detection
- Strategic indexes for fast queries
- Pagination support

### Frontend
- Lazy loading with pagination
- Real-time updates without polling
- Efficient state management with Jotai
- Virtualized scrolling for large lists
- Debounced search input

## Future Enhancements

1. **Analytics Dashboard**
   - Total volume charts
   - Top buyers leaderboard
   - Price trends over time

2. **Advanced Filtering**
   - Date range picker
   - Amount range filter
   - Sort by various columns

3. **Export Functionality**
   - CSV/Excel export
   - PDF reports
   - Custom date ranges

4. **Notifications**
   - Browser notifications for large purchases
   - Email alerts for specific wallets
   - Webhook integrations

5. **Mobile Optimization**
   - Responsive table design
   - Touch-friendly controls
   - Progressive Web App (PWA)

## Troubleshooting

### No purchases showing
- Check backend logs for sync errors
- Verify database connection
- Ensure RPC API is accessible
- Check Socket.IO connection status

### Real-time updates not working
- Verify Socket.IO connection in browser console
- Check CORS configuration
- Ensure backend is emitting events
- Verify frontend is listening for events

### Slow performance
- Check database indexes
- Reduce page size
- Enable pagination
- Optimize queries

## Summary

The QDOGE purchase tracking system is fully integrated between frontend and backend with:
- Complete REST API for querying purchase data
- Real-time updates via Socket.IO
- Responsive UI with search and filtering
- State management with Jotai
- Navigation integration in header
- Background sync every 5 minutes
- Admin controls for manual sync

The system is production-ready and provides a seamless user experience for tracking QDOGE purchases from Qswap.
