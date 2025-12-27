import { useState } from "react";
import { X, FileText, CheckCircle2, TrendingUp, Building2 } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface LoanOpportunity {
  id: string;
  title: string;
  description: string;
  borrowerAddress: string;
  businessName: string;
  businessDescription: string;
  creditScore: number;
  targetAmount: number;
  currentAmount: number;
  apr: number;
  term: number;
  verified: boolean;
  invoiceUrl?: string;
}

interface LoanDetailsModalProps {
  loan: LoanOpportunity;
  balance: number;
  setBalance: (balance: number) => void;
  onClose: () => void;
  onFundingComplete: (loanId: string, amount: number) => void;
}

export function LoanDetailsModal({
  loan,
  balance = 0,
  setBalance,
  onClose,
  onFundingComplete,
}: LoanDetailsModalProps) {
  const [fundAmount, setFundAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  if (!loan) return null;

  const safeTargetAmount = loan.targetAmount || 0;
  const safeCurrentAmount = loan.currentAmount || 0;
  const remainingAmount = safeTargetAmount - safeCurrentAmount;

  const estimatedReturn = fundAmount
    ? (parseInt(fundAmount) * (1 + (loan.apr || 0) / 100)).toFixed(0)
    : "0";

  const handleApprove = async () => {
    if (!fundAmount || parseInt(fundAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseInt(fundAmount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsApproving(true);

    setTimeout(() => {
      setIsApproved(true);
      setIsApproving(false);
      toast.success("IDRS approved successfully");
    }, 2000);
  };

  const handleFund = async () => {
    if (!isApproved) {
      toast.error("Please approve IDRS first");
      return;
    }

    setIsFunding(true);

    setTimeout(() => {
      const amount = parseInt(fundAmount);
      setBalance(balance - amount);
      onFundingComplete(loan.id, amount);
      setIsFunding(false);
      toast.success("Loan funded successfully!");
      onClose();
    }, 2000);
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
          <h2 className="font-['Outfit'] font-extrabold text-3xl mb-2 text-gray-900">
            {loan.title}
          </h2>
          <p className="text-gray-600 font-['Plus_Jakarta_Sans'] mb-8">
            {loan.description}
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
                      {loan.businessName}
                    </div>
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                      {loan.borrowerAddress}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                  {loan.businessDescription}
                </p>
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
                      Oracle Validation Complete
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                    <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                      Invoice #{loan.id}
                    </div>
                    <div className="text-xs text-gray-400 font-['Plus_Jakarta_Sans'] mt-1">
                      PDF Document
                    </div>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="font-['Outfit'] font-bold mb-4 text-gray-900">
                  Credit Information
                </h3>
                <div className="space-y-3 text-sm font-['Plus_Jakarta_Sans']">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Score</span>
                    <span className="text-[#50E3C2] font-semibold">
                      {loan.creditScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification Status</span>
                    <span className="text-[#50E3C2] font-semibold">
                      ✓ Verified
                    </span>
                  </div>
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
                      {safeTargetAmount.toLocaleString()} IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Funded</span>
                    <span className="text-gray-900 font-semibold">
                      {safeCurrentAmount.toLocaleString()} IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining</span>
                    <span className="text-gray-900 font-semibold">
                      {remainingAmount.toLocaleString()} IDRS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">APR</span>
                    <span className="text-[#50E3C2] flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      {loan.apr}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="text-gray-900 font-semibold">
                      {loan.term} Days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="font-['Outfit'] font-bold text-xl mb-6 text-gray-900">
                  Fund This Loan
                </h3>

                <div className="mb-6">
                  <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                    Amount to Fund
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fundAmount}
                      onChange={(e) =>
                        setFundAmount(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="0"
                      className={`w-full bg-white border ${
                        fundAmount && parseInt(fundAmount) > balance
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-2xl px-6 py-4 text-left text-2xl font-['Outfit'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors`}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-['Plus_Jakarta_Sans']">
                      IDRS
                    </span>
                  </div>
                  {fundAmount && parseInt(fundAmount) > balance && (
                    <div className="text-xs text-red-500 mt-2 font-['Plus_Jakarta_Sans']">
                      Insufficient balance
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-['Plus_Jakarta_Sans']">
                    <span>
                      Available: {(balance || 0).toLocaleString()} IDRS
                    </span>
                    <button
                      onClick={() =>
                        setFundAmount(
                          Math.min(balance, remainingAmount).toString()
                        )
                      }
                      className="text-[#4C82FB] hover:underline"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#50E3C2]/10 to-[#4C82FB]/10 border border-[#50E3C2]/30 rounded-2xl p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-1 font-['Plus_Jakarta_Sans']">
                    Estimated Return (including principal)
                  </div>
                  <div className="text-2xl font-['Outfit'] font-bold text-[#50E3C2]">
                    {parseInt(estimatedReturn).toLocaleString()} IDRS
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">
                    After {loan.term} days
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={
                      isApproved ||
                      isApproving ||
                      !fundAmount ||
                      parseInt(fundAmount) <= 0 ||
                      parseInt(fundAmount) > balance
                    }
                    className={`w-full py-4 rounded-full font-['Outfit'] font-semibold transition-all ${
                      isApproved
                        ? "bg-[#50E3C2]/20 text-[#50E3C2] cursor-not-allowed"
                        : isApproving
                        ? "bg-gray-100 cursor-wait text-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isApproving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                        Approving...
                      </span>
                    ) : isApproved ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        IDRS Approved
                      </span>
                    ) : (
                      "Approve IDRS"
                    )}
                  </button>

                  <button
                    onClick={handleFund}
                    disabled={
                      !isApproved ||
                      isFunding ||
                      !fundAmount ||
                      parseInt(fundAmount) <= 0 ||
                      parseInt(fundAmount) > balance
                    }
                    className={`w-full py-4 rounded-full font-['Outfit'] font-semibold transition-all ${
                      isApproved && !isFunding
                        ? "bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 shadow-lg"
                        : "bg-gray-100 text-gray-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isFunding ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Funding Loan...
                      </span>
                    ) : (
                      "Fund Loan"
                    )}
                  </button>
                </div>

                <div className="mt-6 text-xs text-gray-400 font-['Plus_Jakarta_Sans'] text-center">
                  By funding this loan, you agree to the terms and conditions.
                  Your funds will be locked for {loan.term} days.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
