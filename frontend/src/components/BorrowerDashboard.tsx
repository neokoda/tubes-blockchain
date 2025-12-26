import { useState } from "react";
import { Upload, FileText, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { useData } from "../context/DataContext";
import { Loan } from "../types";

export function BorrowerDashboard() {
  const { address, balance } = useWallet();
  const { businessProfile, loans, addLoan } = useData();

  const [loanTitle, setLoanTitle] = useState("");
  const [loanDescription, setLoanDescription] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [interestRate, setInterestRate] = useState("5");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const myLoans = loans.filter((l) => l.borrowerAddress === address);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success("Invoice uploaded successfully");
    }
  };

  const handleSubmitApplication = () => {
    if (!loanTitle || !loanDescription || !loanAmount || !uploadedFile) {
      toast.error("Please fill all fields and upload an invoice");
      return;
    }

    if (!businessProfile) {
      toast.error("Please complete your business profile first");
      return;
    }

    const newLoan: Loan = {
      id: `L${String(loans.length + 1).padStart(3, "0")}`,
      title: loanTitle,
      description: loanDescription,
      amount: parseInt(loanAmount),
      duration,
      interestRate: parseFloat(interestRate),
      status: "verifying",
      fundedAmount: 0,
      borrowerAddress: address || "",
      businessName: businessProfile.name,
      businessDescription: businessProfile.description,
      createdAt: Date.now(),
    };

    addLoan(newLoan);

    setTimeout(() => {
      toast.success("Invoice verified! Loan is now open for funding");
    }, 3000);

    setLoanTitle("");
    setLoanDescription("");
    setLoanAmount("");
    setUploadedFile(null);
    toast.success("Loan application submitted");
  };

  const handleWithdraw = (loanId: string) => {
    const loan = myLoans.find((l) => l.id === loanId);
    if (loan && loan.status === "funded") {
      toast.success(
        `${loan.fundedAmount.toLocaleString()} IDRS withdrawn to your wallet`
      );
    }
  };

  const handleRepay = (loanId: string) => {
    const loan = myLoans.find((l) => l.id === loanId);
    if (loan && loan.status === "funded") {
      const repaymentAmount = loan.fundedAmount * (1 + loan.interestRate / 100);
      if (parseFloat(balance) >= repaymentAmount) {
        toast.success("Loan repaid successfully!");
      } else {
        toast.error("Insufficient balance to repay loan");
      }
    }
  };

  const getStatusConfig = (status: Loan["status"]) => {
    switch (status) {
      case "verifying":
        return {
          label: "Verifying...",
          color: "bg-gray-200 text-gray-600",
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        };
      case "open":
        return {
          label: "Open for Funding",
          color: "bg-[#4C82FB]/20 text-[#4C82FB]",
          icon: <Clock className="w-3 h-3" />,
        };
      case "funded":
        return {
          label: "Funded",
          color: "bg-[#50E3C2]/20 text-[#50E3C2]",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "repaid":
        return {
          label: "Repaid",
          color: "bg-[#50E3C2]/20 text-[#50E3C2]",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      default:
        return { label: "", color: "", icon: null };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">
            Create Loan Request
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Title
              </label>
              <input
                type="text"
                value={loanTitle}
                onChange={(e) => setLoanTitle(e.target.value)}
                placeholder="Enter loan title"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Description
              </label>
              <textarea
                value={loanDescription}
                onChange={(e) => setLoanDescription(e.target.value)}
                placeholder="Enter loan description"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) =>
                    setLoanAmount(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-right text-3xl font-['Outfit'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-['Plus_Jakarta_Sans']">
                  IDRS
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Interest Rate (%)
              </label>
              <input
                type="text"
                value={interestRate}
                onChange={(e) =>
                  setInterestRate(e.target.value.replace(/[^\d.]/g, ""))
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Upload Invoice
              </label>
              <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#4C82FB] transition-colors bg-gray-50">
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-[#50E3C2]" />
                    <span className="font-['Plus_Jakarta_Sans'] text-gray-900">
                      {uploadedFile.name}
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-gray-600 font-['Plus_Jakarta_Sans']">
                      Click to upload invoice (PDF, JPG, PNG)
                    </div>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleSubmitApplication}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 transition-opacity font-['Outfit'] font-semibold shadow-lg"
            >
              Submit Application
            </button>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">
            My Loans
          </h2>

          <div className="space-y-4">
            {myLoans.length === 0 && (
              <p className="text-gray-400 text-center py-10 font-['Plus_Jakarta_Sans']">
                No active loans.
              </p>
            )}
            {myLoans.map((loan) => {
              const statusConfig = getStatusConfig(loan.status);
              const fundingProgress = (loan.fundedAmount / loan.amount) * 100;

              return (
                <div
                  key={loan.id}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-['Outfit'] mb-1 text-gray-900">
                        Loan #{loan.id}
                      </div>
                      <div className="text-2xl font-['Outfit'] font-bold text-gray-900">
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}
                    >
                      {statusConfig.icon}
                      <span className="text-xs font-['Plus_Jakarta_Sans']">
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm font-['Plus_Jakarta_Sans']">
                    <div className="flex justify-between text-gray-600">
                      <span>Duration:</span>
                      <span>{loan.duration} days</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Interest Rate:</span>
                      <span>{loan.interestRate}%</span>
                    </div>
                  </div>

                  {loan.status === "open" && (
                    <>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1 font-['Plus_Jakarta_Sans']">
                          <span>Funding Progress</span>
                          <span>{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] transition-all"
                            style={{ width: `${fundingProgress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 font-['Plus_Jakarta_Sans']">
                        {loan.fundedAmount.toLocaleString()} /{" "}
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </>
                  )}

                  {loan.status === "funded" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleWithdraw(loan.id)}
                        className="flex-1 py-2 rounded-full bg-[#50E3C2] text-gray-900 hover:bg-[#50E3C2]/90 transition-colors font-['Plus_Jakarta_Sans'] font-semibold shadow-md"
                      >
                        Withdraw Funds
                      </button>
                      <button
                        onClick={() => handleRepay(loan.id)}
                        className="flex-1 py-2 rounded-full bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors font-['Plus_Jakarta_Sans'] font-semibold"
                      >
                        Repay Loan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
