// InvestorMarketplace.tsx
import { CheckCircle2, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useWallet } from "../context/WalletContext";
import { Loan } from "../types";
import { LoanDetailsModal } from "./LoanDetailsModal";

export function InvestorMarketplace() {
  const { address, balance: walletBalance } = useWallet();
  const { loans, fundLoan, refreshLoans, loading } = useData();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (address) {
      refreshLoans();
    }
  }, [address]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLoans();
    setRefreshing(false);
  };

  const handleFundingComplete = async (loanId: string, amount: number) => {
    try {
      await fundLoan(loanId, amount);
      setSelectedLoan(null);
    } catch (error) {
      console.error("Funding failed:", error);
    }
  };

  const openLoans = loans.filter(
    (l) => l.status === "open" || l.status === "active"
  );

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-[#50E3C2]";
    if (score >= 700) return "text-[#4C82FB]";
    return "text-[#FFB020]";
  };

  const getScoreRing = (score: number = 750) => {
    const percentage = (score / 900) * 100;
    return {
      stroke: score >= 800 ? "#50E3C2" : score >= 700 ? "#4C82FB" : "#FFB020",
      dashoffset: 251.2 - (251.2 * percentage) / 100,
    };
  };

  if (!address) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Wallet className="w-20 h-20 text-gray-400" />
          <h2 className="text-3xl font-['Outfit'] font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 font-['Plus_Jakarta_Sans'] text-center max-w-md">
            Connect your wallet to view and invest in available loan opportunities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-['Outfit'] font-bold text-gray-900 mb-2">
            Investment Marketplace
          </h1>
          <p className="text-gray-600 font-['Plus_Jakarta_Sans']">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-3">
            <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-1">
              Your Balance
            </div>
            <div className="text-xl font-['Outfit'] font-bold text-gray-900">
              {parseFloat(walletBalance).toLocaleString()} IDRS
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-[#4C82FB]" />
        </div>
      ) : openLoans.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 font-['Plus_Jakarta_Sans'] text-lg">
            No loans available at the moment
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-['Plus_Jakarta_Sans']"
          >
            Refresh Loans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {openLoans.map((loan) => {
            const fundingProgress = (loan.fundedAmount / loan.amount) * 100;
            const score = 750;
            const scoreRing = getScoreRing(score);

            return (
              <div
                key={loan.id}
                className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-6 hover:border-gray-300 hover:transform hover:-translate-y-2 transition-all cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => setSelectedLoan(loan)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-1">
                      Borrower
                    </div>
                    <div className="font-['Outfit'] text-gray-900">
                      {loan.borrowerAddress.slice(0, 10)}...
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 bg-[#50E3C2]/20 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-[#50E3C2]" />
                    <span className="text-xs text-[#50E3C2] font-['Plus_Jakarta_Sans']">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={scoreRing.stroke}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={scoreRing.dashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className={`text-xl font-['Outfit'] font-bold ${getScoreColor(score)}`}
                      >
                        {score}
                      </div>
                      <div className="text-xs text-gray-400 font-['Plus_Jakarta_Sans']">
                        Score
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                    <span className="text-gray-600">Target</span>
                    <span className="text-gray-900 font-semibold">
                      {(loan.amount / 1000000).toFixed(1)}M IDRS
                    </span>
                  </div>
                  <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                    <span className="text-gray-600">APR</span>
                    <span className="text-[#50E3C2] flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      {loan.interestRate}%
                    </span>
                  </div>
                  <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                    <span className="text-gray-600">Term</span>
                    <span className="text-gray-900 font-semibold">
                      {loan.duration} Days
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2 font-['Plus_Jakarta_Sans']">
                    <span>Funded</span>
                    <span>{fundingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] transition-all duration-1000"
                      style={{ width: `${fundingProgress}%` }}
                    />
                  </div>
                </div>

                <button className="w-full py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-['Plus_Jakarta_Sans'] font-semibold text-gray-900">
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          balance={parseFloat(walletBalance)}
          setBalance={() => {}}
          onClose={() => setSelectedLoan(null)}
          onFundingComplete={handleFundingComplete}
        />
      )}
    </div>
  );
}