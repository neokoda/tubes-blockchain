import { Building2, CheckCircle2, FileText, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Loan } from "../types";
import { useWallet } from "../context/WalletContext";

interface LoanDetailsModalProps {
  loan: Loan;
  balance: number;
  setBalance: (balance: number) => void;
  onClose: () => void;
  onFundingComplete: (loanId: string, amount: number) => Promise<void>;
}

export function LoanDetailsModal({
  loan,
  balance = 0,
  setBalance,
  onClose,
  onFundingComplete,
}: LoanDetailsModalProps) {
  const { address } = useWallet();
  const [fundAmount, setFundAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!loan) return null;

  const isOwner = address?.toLowerCase() === loan.borrowerAddress.toLowerCase();

  const remainingAmount = loan.amount - loan.fundedAmount;
  const maxFundAmount = Math.min(remainingAmount, balance);
  const fundingProgress = (loan.fundedAmount / loan.amount) * 100;

  const estimatedReturn = fundAmount
    ? (parseFloat(fundAmount) * (1 + loan.interestRate / 10000)).toFixed(2)
    : "0";

  const handleFund = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(fundAmount);

    if (amount > remainingAmount) {
      toast.error(
        `Maximum amount you can fund: ${remainingAmount.toFixed(2)} IDRS`
      );
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      await onFundingComplete(loan.id, amount);
      onClose();
    } catch (error: any) {
      console.error("Funding error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white border border-gray-200 rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-['Outfit'] font-extrabold text-3xl text-gray-900">
              {loan.businessName || "Business Loan"}
            </h2>
            <div className="flex items-center gap-1 px-2 py-1 bg-[#50E3C2]/20 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-[#50E3C2]" />
              <span className="text-xs text-[#50E3C2] font-['Plus_Jakarta_Sans']">
                Verified
              </span>
            </div>
          </div>
          <p className="text-gray-600 font-['Plus_Jakarta_Sans'] mb-8">
            {loan.businessDescription || `Invoice: ${loan.invoiceNumber}`}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF007A] to-[#4C82FB] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-['Outfit'] font-bold text-gray-900">
                      Borrower
                    </div>
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                      {loan.borrowerAddress.slice(0, 10)}...
                      {loan.borrowerAddress.slice(-8)}
                    </div>
                  </div>
                </div>
                {loan.businessDescription && (
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                    {loan.businessDescription}
                  </p>
                )}
              </div>

              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#50E3C2]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#50E3C2]" />
                  </div>
                  <div>
                    <div className="font-['Outfit'] font-bold text-gray-900">
                      Invoice Verified
                    </div>
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                      On-Chain Validation Complete
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-center mb-4">
                    <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                      Invoice #{loan.invoiceNumber}
                    </div>
                    <div className="text-xs text-gray-400 font-['Plus_Jakarta_Sans'] mt-1">
                      IPFS: {loan.ipfsHash && loan.ipfsHash.slice(0, 15)}...
                    </div>
                  </div>

                  {loan.ipfsHash && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${loan.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#50E3C2] text-gray-900 hover:bg-[#50E3C2]/90 rounded-xl transition-colors font-['Plus_Jakarta_Sans'] font-semibold text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      View Invoice Document
                    </a>
                  )}
                </div>
              </div>

              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="font-['Outfit'] font-bold mb-4 text-gray-900">
                  Loan Terms
                </h3>
                <div className="space-y-3 text-sm font-['Plus_Jakarta_Sans']">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Amount</span>
                    <span className="text-gray-900 font-semibold">
                      {(loan.amount / 1000000).toFixed(1)}M IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Funded</span>
                    <span className="text-gray-900 font-semibold">
                      {(loan.fundedAmount / 1000000).toFixed(1)}M IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining</span>
                    <span className="text-[#FF007A] font-semibold">
                      {(remainingAmount / 1000000).toFixed(1)}M IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">APR</span>
                    <span className="text-[#50E3C2] flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      {loan.interestRate / 100}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="text-gray-900 font-semibold">
                      {loan.duration} Days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="text-[#4C82FB] font-semibold capitalize">
                      {loan.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2 font-['Plus_Jakarta_Sans']">
                    <span>Funding Progress</span>
                    <span>{fundingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] transition-all duration-1000"
                      style={{ width: `${fundingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="font-['Outfit'] font-bold text-xl mb-6 text-gray-900">
                  Fund This Loan
                </h3>

                {isOwner ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-2xl border border-yellow-200 text-sm font-['Plus_Jakarta_Sans'] text-center">
                    You cannot fund your own loan request.
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                        Amount to Fund
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          max={maxFundAmount}
                          placeholder="0"
                          disabled={isOwner}
                          className={`w-full bg-white border ${
                            fundAmount && parseFloat(fundAmount) > maxFundAmount
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-2xl px-6 py-4 text-left text-2xl font-['Outfit'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors`}
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-['Plus_Jakarta_Sans']">
                          IDRS
                        </span>
                      </div>
                      {fundAmount && parseFloat(fundAmount) > maxFundAmount && (
                        <div className="text-xs text-red-500 mt-2 font-['Plus_Jakarta_Sans']">
                          {parseFloat(fundAmount) > remainingAmount
                            ? `Maximum amount: ${remainingAmount.toFixed(
                                2
                              )} IDRS (loan limit)`
                            : "Insufficient balance"}
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-['Plus_Jakarta_Sans']">
                        <span>Available: {balance.toLocaleString()} IDRS</span>
                        <button
                          onClick={() =>
                            setFundAmount(maxFundAmount.toString())
                          }
                          className="text-[#4C82FB] hover:underline"
                        >
                          Max: {maxFundAmount.toFixed(2)}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-[#50E3C2]/10 to-[#4C82FB]/10 border border-[#50E3C2]/30 rounded-2xl p-4 mb-6">
                      <div className="text-sm text-gray-600 mb-1 font-['Plus_Jakarta_Sans']">
                        Estimated Return (including principal)
                      </div>
                      <div className="text-2xl font-['Outfit'] font-bold text-[#50E3C2]">
                        {parseFloat(estimatedReturn).toLocaleString()} IDRS
                      </div>
                      <div className="text-xs text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">
                        After {loan.duration} days
                      </div>
                    </div>

                    <button
                      onClick={handleFund}
                      disabled={
                        loading ||
                        !fundAmount ||
                        parseFloat(fundAmount) <= 0 ||
                        parseFloat(fundAmount) > maxFundAmount ||
                        isOwner
                      }
                      className="w-full py-4 rounded-full font-['Outfit'] font-semibold transition-all bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Funding Loan...
                        </span>
                      ) : (
                        "Fund Loan"
                      )}
                    </button>

                    <div className="mt-6 text-xs text-gray-400 font-['Plus_Jakarta_Sans'] text-center">
                      By funding this loan, you agree to the terms and
                      conditions. Your funds will be locked for {loan.duration}{" "}
                      days.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
