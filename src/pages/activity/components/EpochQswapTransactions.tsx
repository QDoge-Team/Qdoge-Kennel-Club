import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchEpochQSwapTransactions, type QSwapTransaction } from "@/services/backend.service";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { EXPLORER_URL } from "@/constants";
import { cn } from "@/utils";

const fmt = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return abs >= 1e6 ? `${sign}${(abs / 1e6).toFixed(1)}M` : abs >= 1e3 ? `${sign}${(abs / 1e3).toFixed(0)}K` : n.toLocaleString();
};
const short = (s: string) => `${s.slice(0, 5)}...${s.slice(-5)}`;

const WalletDisplay = ({ wallet, connectedWallet }: { wallet: string; connectedWallet: string | null }) => {
  const isYou = connectedWallet && wallet === connectedWallet;
  return isYou ? (
    <span className="text-yellow-500 font-semibold">YOU</span>
  ) : (
    <Link to={`/entity/${wallet}`} className="text-primary hover:text-primary/70">{short(wallet)}</Link>
  );
};

const tableClass = "table-auto [&_td]:whitespace-nowrap [&_td]:text-center [&_th]:text-center";
const headerClass = "text-xs sticky top-0 z-20 border-b border-border/60 bg-card/90 backdrop-blur-sm [&_th]:sticky [&_th]:top-0 [&_th]:bg-card/90 [&_th]:text-card-foreground [&_th]:shadow-sm";
const bodyClass = "divide-y divide-border/40 text-muted-foreground text-xs";
const cardClass = "flex-1 min-h-0 border border-border/60 bg-card/70 p-2 shadow-inner shadow-black/5 dark:shadow-black/40";

const EpochQswapTransactions: React.FC<{ epoch: number; searchTerm?: string; connectedWallet?: string | null }> = ({ epoch, searchTerm = "", connectedWallet = null }) => {
  const [transactions, setTransactions] = useState<QSwapTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchEpochQSwapTransactions(epoch)
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fetch"))
      .finally(() => setIsLoading(false));
  }, [epoch]);

  // Filter transactions by search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(p => p.wallet.toLowerCase().includes(term));
  }, [transactions, searchTerm]);

  const { topBuyers, topSellers, totalStats } = useMemo(() => {
    const buyerMap = new Map<string, { shares: number; amount: number; count: number }>();
    const sellerMap = new Map<string, { shares: number; amount: number; count: number }>();

    let totalBuyShares = 0;
    let totalSellShares = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let buyCount = 0;
    let sellCount = 0;

    filteredTransactions.forEach(({ wallet, number_of_shares, amount, transaction_type }) => {
      const sharesNum = Number(number_of_shares);
      const amountNum = Number(amount);

      if (transaction_type === "buy") {
        const b = buyerMap.get(wallet) || { shares: 0, amount: 0, count: 0 };
        b.shares += sharesNum;
        b.amount += amountNum;
        b.count += 1;
        buyerMap.set(wallet, b);
        totalBuyShares += sharesNum;
        totalBuyAmount += amountNum;
        buyCount += 1;
      } else if (transaction_type === "sell") {
        const s = sellerMap.get(wallet) || { shares: 0, amount: 0, count: 0 };
        s.shares += sharesNum;
        s.amount += amountNum;
        s.count += 1;
        sellerMap.set(wallet, s);
        totalSellShares += sharesNum;
        totalSellAmount += amountNum;
        sellCount += 1;
      }
    });

    const buyers = [...buyerMap].map(([wallet, { shares, amount, count }]) => ({ 
      wallet, 
      shares, 
      amount, 
      count,
      avgPrice: amount / shares
    })).sort((a, b) => b.shares - a.shares);

    const sellers = [...sellerMap].map(([wallet, { shares, amount, count }]) => ({ 
      wallet, 
      shares, 
      amount, 
      count,
      avgPrice: amount / shares
    })).sort((a, b) => b.shares - a.shares);

    return { 
      topBuyers: buyers,
      topSellers: sellers,
      totalStats: { 
        totalBuyShares, 
        totalSellShares, 
        totalBuyAmount, 
        totalSellAmount, 
        buyCount, 
        sellCount,
        uniqueBuyers: buyers.length,
        uniqueSellers: sellers.length
      }
    };
  }, [filteredTransactions]);

  if (isLoading || error || !transactions.length) {
    return (
      <div className={`${cardClass} flex items-center justify-center min-h-[200px]`}>
        <p className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}>{isLoading ? "Loading..." : error || "No Qswap transactions"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm md:text-base font-semibold">Epoch {epoch} Qswap QDOGE Transactions</span>
        <span className="text-xs text-muted-foreground">
          {searchTerm ? `${filteredTransactions.length} / ${transactions.length}` : `${transactions.length}`} transactions
        </span>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Buy Shares</p>
          <p className="text-sm font-semibold text-green-500">{fmt(totalStats.totalBuyShares)}</p>
        </div>
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Sell Shares</p>
          <p className="text-sm font-semibold text-red-500">{fmt(totalStats.totalSellShares)}</p>
        </div>
        <div className="rounded-md border border-blue-500/50 bg-blue-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Buy Amount</p>
          <p className="text-sm font-semibold text-blue-500">{fmt(totalStats.totalBuyAmount)} Qu</p>
        </div>
        <div className="rounded-md border border-orange-500/50 bg-orange-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Sell Amount</p>
          <p className="text-sm font-semibold text-orange-500">{fmt(totalStats.totalSellAmount)} Qu</p>
        </div>
        <div className="rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Buy Txs</p>
          <p className="text-sm font-semibold text-purple-500">{totalStats.buyCount}</p>
        </div>
        <div className="rounded-md border border-pink-500/50 bg-pink-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Sell Txs</p>
          <p className="text-sm font-semibold text-pink-500">{totalStats.sellCount}</p>
        </div>
        <div className="rounded-md border border-cyan-500/50 bg-cyan-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Unique Buyers</p>
          <p className="text-sm font-semibold text-cyan-500">{totalStats.uniqueBuyers}</p>
        </div>
        <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Unique Sellers</p>
          <p className="text-sm font-semibold text-yellow-500">{totalStats.uniqueSellers}</p>
        </div>
      </div>

      <div className="grid w-full gap-3 grid-cols-1 md:grid-cols-2">
        {/* Purchases Table */}
        <section className="flex flex-col h-[240px] md:h-[220px] md:col-span-2">
          <div className={cardClass}>
            <ScrollArea type="hover" scrollHideDelay={200} className="h-full">
              <div className="pr-1">
                <Table wrapperClassName="h-full min-h-0 !overflow-visible" className={`${tableClass} min-w-[700px] md:min-w-[900px]`}>
                  <TableHeader className={headerClass}>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Amount (Qu)</TableHead>
                      <TableHead>QDOGE Shares</TableHead>
                      <TableHead>Price/Share</TableHead>
                      <TableHead className="hidden md:table-cell">TxID</TableHead>
                      <TableHead>Tick</TableHead>
                      <TableHead>Date&Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={bodyClass}>
                    {filteredTransactions.map((p) => {
                      const pricePerShare = Number(p.amount) / Number(p.number_of_shares);
                      const isBuy = p.transaction_type === "buy";
                      return (
                        <TableRow key={p.transaction_id}>
                          <TableCell>
                            <span className={cn("text-xs font-semibold uppercase", isBuy ? "text-green-500" : "text-red-500")}>
                              {p.transaction_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <WalletDisplay wallet={p.wallet} connectedWallet={connectedWallet} />
                          </TableCell>
                          <TableCell className="!text-right text-blue-500">{Number(p.amount).toLocaleString()}</TableCell>
                          <TableCell className={cn("!text-right font-semibold", isBuy ? "text-green-500" : "text-red-500")}>
                            {isBuy ? "+" : "-"}{Number(p.number_of_shares).toLocaleString()}
                          </TableCell>
                          <TableCell className="!text-right">{pricePerShare.toFixed(2)}</TableCell>
                          <TableCell className="hidden md:table-cell truncate">
                            <Link to={`${EXPLORER_URL}/network/tx/${p.tx_hash}`} target="_blank" className="text-primary hover:text-primary/70">{short(p.tx_hash)}</Link>
                          </TableCell>
                          <TableCell className="!text-right">{p.tick_number.toLocaleString()}</TableCell>
                          <TableCell>{new Date(p.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </section>

        {/* Top Buyers and Sellers */}
        <section className="flex flex-col h-[240px] md:h-[240px]">
          <div className="rounded-md border border-green-500/50 bg-green-500/10 px-2 py-1 mb-1.5">
            <p className="text-[10px] font-medium text-green-500">Top Buyers: {topBuyers.length}</p>
          </div>
          <div className={cardClass}>
            <ScrollArea type="hover" scrollHideDelay={200} className="h-full">
              <div className="pr-1">
                <Table wrapperClassName="h-full min-h-0 !overflow-visible" className={`${tableClass} min-w-[500px]`}>
                  <TableHeader className={headerClass}>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Buys</TableHead>
                      <TableHead>Total Shares</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={bodyClass}>
                    {topBuyers.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-primary">{i + 1}</TableCell>
                        <TableCell>
                          <WalletDisplay wallet={b.wallet} connectedWallet={connectedWallet} />
                        </TableCell>
                        <TableCell className="!text-right">{b.count}</TableCell>
                        <TableCell className="!text-right text-green-500 font-semibold">{fmt(b.shares)}</TableCell>
                        <TableCell className="!text-right text-blue-500">{fmt(b.amount)}</TableCell>
                        <TableCell className="!text-right">{b.avgPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </section>

        <section className="flex flex-col h-[240px] md:h-[240px]">
          <div className="rounded-md border border-red-500/50 bg-red-500/10 px-2 py-1 mb-1.5">
            <p className="text-[10px] font-medium text-red-500">Top Sellers: {topSellers.length}</p>
          </div>
          <div className={cardClass}>
            <ScrollArea type="hover" scrollHideDelay={200} className="h-full">
              <div className="pr-1">
                <Table wrapperClassName="h-full min-h-0 !overflow-visible" className={`${tableClass} min-w-[500px]`}>
                  <TableHeader className={headerClass}>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Sells</TableHead>
                      <TableHead>Total Shares</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={bodyClass}>
                    {topSellers.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-primary">{i + 1}</TableCell>
                        <TableCell>
                          <WalletDisplay wallet={s.wallet} connectedWallet={connectedWallet} />
                        </TableCell>
                        <TableCell className="!text-right">{s.count}</TableCell>
                        <TableCell className="!text-right text-red-500 font-semibold">{fmt(s.shares)}</TableCell>
                        <TableCell className="!text-right text-orange-500">{fmt(s.amount)}</TableCell>
                        <TableCell className="!text-right">{s.avgPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EpochQswapTransactions;
