import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMonthlyAirdropPreview, type MonthlyAirdropResult } from "@/services/backend.service";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface MonthlyAirdropRangeResultsProps {
  startEpoch: number;
  endEpoch: number;
  searchTerm?: string;
  connectedWallet?: string | null;
  isAdmin?: boolean;
}

const MEDAL_EMOJIS = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;

const WalletCell = ({ wallet, isZealyRegistered, connectedWallet }: { wallet: string; isZealyRegistered: boolean; connectedWallet: string | null }) => {
  const isYou = connectedWallet && wallet === connectedWallet;
  return (
    <div className="flex items-center gap-1">
      {isYou ? (
        <span className="text-yellow-500 font-semibold">YOU</span>
      ) : (
        <Link to={`/entity/${wallet}`} className="text-primary hover:text-primary/70">
          {wallet.slice(0, 5)}...{wallet.slice(-5)}
        </Link>
      )}
      {isZealyRegistered && <span className="text-green-500 text-xs">✅</span>}
    </div>
  );
};

const fmt = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
};

const tableClass = "table-auto [&_td]:whitespace-nowrap [&_td]:text-center [&_th]:text-center";
const headerClass = "text-xs sticky top-0 z-20 border-b border-border/60 bg-card/90 backdrop-blur-sm [&_th]:sticky [&_th]:top-0 [&_th]:bg-card/90 [&_th]:text-card-foreground [&_th]:shadow-sm";
const bodyClass = "divide-y divide-border/40 text-muted-foreground text-xs";
const cardClass = "flex-1 min-h-0 border border-border/60 bg-card/70 p-2 shadow-inner shadow-black/5 dark:shadow-black/40";

const MonthlyAirdropRangeResults: React.FC<MonthlyAirdropRangeResultsProps> = ({ startEpoch, endEpoch, searchTerm = "", connectedWallet = null, isAdmin = false }) => {
  const [results, setResults] = useState<MonthlyAirdropResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAirdrop, setTotalAirdrop] = useState<string>("0");
  const [isOngoing, setIsOngoing] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Early return if not admin
      if (!isAdmin || !connectedWallet) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchMonthlyAirdropPreview(startEpoch, endEpoch, connectedWallet);
        setResults(data.results);
        setTotalAirdrop(data.total_airdrop);
        setIsOngoing(data.is_ongoing);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch monthly airdrop");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [startEpoch, endEpoch, isAdmin, connectedWallet]);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results;
    const term = searchTerm.toLowerCase();
    return results.filter((r) => r.wallet_id.toLowerCase().includes(term));
  }, [results, searchTerm]);

  const handleDownloadExcel = useCallback(() => {
    if (results.length === 0) return;
    const excelData = results.map((r) => ({
      rank: r.rank,
      wallet_id: r.wallet_id,
      buy_amt: r.buy_amount,
      buy_token: r.token_amount,
      airdrop_amt: r.airdrop_amount,
      is_zealy_registered: r.is_zealy_registered ? "yes" : "no",
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [{ wch: 8 }, { wch: 62 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Airdrop");
    XLSX.writeFile(workbook, `monthly_airdrop_${startEpoch}~${endEpoch}.xlsx`);
  }, [results, startEpoch, endEpoch]);

  // Admin-only access check (after all hooks)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="rounded-lg border-2 border-dashed border-border p-6 md:p-10 bg-muted/10 w-full max-w-2xl text-center">
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Monthly airdrop results are only available to administrators.</p>
        </div>
      </div>
    );
  }

  const requirements = (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground mb-2">Monthly Airdrop Requirements</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Window: 4 consecutive epochs ({startEpoch}~{endEpoch})</li>
        <li>In <strong>each</strong> of the 4 epochs: <strong>buy_amount</strong> &gt; epoch threshold, <strong>no sells</strong>, and <strong>no sending transfers</strong> (receiving is allowed)</li>
        <li>Ranking: by total buy amount across the 4 epochs (descending)</li>
        <li>Top <strong>100</strong> wallets qualify</li>
        <li>Total airdrop: <strong>25,000,000</strong> — split equally among winners (remainder to rank #1)</li>
      </ul>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xl font-bold">Monthly Airdrop Results</p>
          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
            {startEpoch}~{endEpoch}
          </Badge>
          {isOngoing && (
            <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
              Live Preview
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalAirdrop !== "0" && (
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{fmt(Number(totalAirdrop))}</span>
            </div>
          )}
          {isAdmin && results.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          )}
        </div>
      </div>

      {requirements}

      <div className={cardClass}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading monthly airdrop results...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No monthly airdrop results available</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No results match "{searchTerm}"</p>
          </div>
        ) : (
          <ScrollArea type="hover" scrollHideDelay={200} className="h-[500px]">
            <div className="pr-1">
              {searchTerm && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Showing {filteredResults.length} of {results.length} results
                </div>
              )}
              <Table wrapperClassName="h-full min-h-0 !overflow-visible" className={`${tableClass} min-w-[820px]`}>
                <TableHeader className={headerClass}>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Wallet ID</TableHead>
                    <TableHead>Buy Amt</TableHead>
                    <TableHead>Buy Token</TableHead>
                    <TableHead>Airdrop Amt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={bodyClass}>
                  {filteredResults.map((r) => (
                    <TableRow key={r.rank}>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {MEDAL_EMOJIS[r.rank as keyof typeof MEDAL_EMOJIS] && (
                            <span>{MEDAL_EMOJIS[r.rank as keyof typeof MEDAL_EMOJIS]}</span>
                          )}
                          <span className="font-semibold">{r.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <WalletCell wallet={r.wallet_id} isZealyRegistered={r.is_zealy_registered} connectedWallet={connectedWallet} />
                      </TableCell>
                      <TableCell className="!text-right text-green-500 font-medium">
                        {fmt(Number(r.buy_amount))}
                      </TableCell>
                      <TableCell className="!text-right text-blue-500 font-medium">
                        {fmt(Number(r.token_amount))}
                      </TableCell>
                      <TableCell className="!text-right text-primary font-semibold">
                        {fmt(Number(r.airdrop_amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default MonthlyAirdropRangeResults;

