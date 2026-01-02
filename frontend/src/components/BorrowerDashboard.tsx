import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Clock,
  Loader2,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { useData } from "../context/DataContext";
import { uploadToPinata } from "../utils/pinata";
import { ethers } from "ethers";
import { INVOICE_LENDING_ADDRESS, INVOICE_LENDING_ABI } from "../config";
import { Loan } from "../types";

const mapSCStatusToUI = (scStatus: number): Loan["status"] => {
  switch (scStatus) {
    case 0:
      return "verifying";
    case 1:
      return "open";
    case 2:
      return "funded";
    case 3:
      return "repaid";
    case 4:
      return "rejected";
    default:
      return "verifying";
  }
};

export function BorrowerDashboard() {
  const { address, provider } = useWallet();
  const { businessProfile } = useData();

  const [loanAmount, setLoanAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [duration, setDuration] = useState<number | "">(30);
  const [interestRate, setInterestRate] = useState("5");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  // Using any here to accommodate new fields not yet in Loan type if not updated
  const [blockchainLoans, setBlockchainLoans] = useState<any[]>([]);

  useEffect(() => {
    if (address && provider) {
      fetchBlockchainLoans();
      const interval = setInterval(fetchBlockchainLoans, 5000);
      return () => clearInterval(interval);
    }
  }, [address, provider]);

  const fetchBlockchainLoans = async () => {
    try {
      if (!provider) return;
      const contract = new ethers.Contract(
        INVOICE_LENDING_ADDRESS,
        INVOICE_LENDING_ABI,
        provider
      );

      const nextId = await contract.nextLoanId();
      const tempLoans: any[] = [];

      for (let i = 1; i < nextId; i++) {
        const loanData = await contract.loans(i);

        if (loanData[1].toLowerCase() === address?.toLowerCase()) {
          // Struct indices:
          // 0: id, 1: borrower, 2: requested, 3: funded, 4: ipfs,
          // 5: invoice, 6: interest, 7: duration, 8: startTime, 9: state
          const statusUI = mapSCStatusToUI(Number(loanData[9]));

          tempLoans.push({
            id: loanData[0].toString(),
            amount: Number(ethers.formatEther(loanData[2])),
            duration: Number(loanData[7]), // Duration in seconds
            startTime: Number(loanData[8]), // Start timestamp
            interestRate: Number(loanData[6]),
            status: statusUI,
            fundedAmount: Number(ethers.formatEther(loanData[3])),
            borrowerAddress: loanData[1],
            businessName: businessProfile?.name || "My Business",
            invoiceNumber: loanData[5],
            ipfsHash: loanData[4],
          });
        }
      }
      setBlockchainLoans(tempLoans);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success("Invoice PDF selected");
    }
  };

  const handleSubmitApplication = async () => {
    if (!loanAmount || !uploadedFile || !invoiceNumber || !duration) {
      toast.error("Please fill all fields including Invoice Number!");
      return;
    }

    if (!businessProfile || !businessProfile.npwp) {
      toast.error("Please complete your business profile (NPWP) first!");
      return;
    }

    if (!provider) {
      toast.error("Wallet not connected");
      return;
    }

    setIsLoading(true);

    try {
      toast.info("Uploading document to IPFS...");
      const ipfsHash = await uploadToPinata(uploadedFile);
      if (!ipfsHash) throw new Error("IPFS Upload Failed");

      toast.info("Please sign transaction in wallet...");
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        INVOICE_LENDING_ADDRESS,
        INVOICE_LENDING_ABI,
        signer
      );

      const amountWei = ethers.parseUnits(loanAmount, 18);
      const durationSeconds = Number(duration) * 24 * 60 * 60; // Convert days to seconds
      const interestBps = Math.round(parseFloat(interestRate) * 100);

      const tx = await contract.createLoanRequest(
        amountWei,
        interestBps,
        durationSeconds,
        ipfsHash,
        invoiceNumber
      );

      toast.info("Transaction submitted. Waiting for verification...");
      await tx.wait();

      toast.success("Loan application submitted successfully!");
      setLoanAmount("");
      setInvoiceNumber("");
      setDuration(30);
      setUploadedFile(null);
      fetchBlockchainLoans();
    } catch (error: any) {
      console.error(error);
      toast.error("Submission failed: " + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (loanId: string) => {
    try {
      if (!provider) return;
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        INVOICE_LENDING_ADDRESS,
        INVOICE_LENDING_ABI,
        signer
      );

      toast.info("Withdrawing funds...");
      const tx = await contract.withdrawFunds(loanId);
      await tx.wait();

      toast.success("Funds withdrawn!");
      fetchBlockchainLoans();
    } catch (error: any) {
      toast.error("Withdraw failed: " + (error.reason || error.message));
    }
  };

  const handleRepay = async (loanId: string) => {
    try {
      if (!provider) return;
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        INVOICE_LENDING_ADDRESS,
        INVOICE_LENDING_ABI,
        signer
      );

      const tokenAddress = await contract.token();
      const tokenAbi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

      toast.info("Approving Token...");
      const approveTx = await tokenContract.approve(
        INVOICE_LENDING_ADDRESS,
        ethers.MaxUint256
      );
      await approveTx.wait();

      toast.info("Repaying Loan...");
      const tx = await contract.repayLoan(loanId);
      await tx.wait();

      toast.success("Loan repaid successfully!");
      fetchBlockchainLoans();
    } catch (error: any) {
      toast.error("Repayment failed: " + (error.reason || error.message));
    }
  };

  const getStatusStyle = (status: Loan["status"]) => {
    switch (status) {
      case "verifying":
        return {
          bg: "#FEF9C3",
          text: "#A16207",
          icon: <Loader2 size={16} className="animate-spin" />,
        };
      case "open":
        return { bg: "#DBEAFE", text: "#1D4ED8", icon: <Clock size={16} /> };
      case "funded":
        return {
          bg: "#D1FAE5",
          text: "#047857",
          icon: <CheckCircle2 size={16} />,
        };
      case "repaid":
        return {
          bg: "#DCFCE7",
          text: "#15803D",
          icon: <CheckCircle2 size={16} />,
        };
      case "rejected":
        return { bg: "#FEE2E2", text: "#B91C1C", icon: <XCircle size={16} /> };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          icon: <AlertCircle size={16} />,
        };
    }
  };

  const formatRepayDate = (startTime: number, durationSeconds: number) => {
    if (startTime === 0) return "-";
    const deadline = new Date((startTime + durationSeconds) * 1000);
    return deadline.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Loan Form */}
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg h-fit">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">
            Create Loan Request
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block font-bold">
                Invoice Number (Must Match Tax Data)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2024-001"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors tracking-wide"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Amount (IDRS)
              </label>
              <input
                type="text"
                value={loanAmount}
                onChange={(e) =>
                  setLoanAmount(e.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-right text-3xl font-['Outfit'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) =>
                    setDuration(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                  Interest (%)
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
                      Click to upload invoice
                    </div>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleSubmitApplication}
              disabled={isLoading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 font-['Outfit'] font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </div>

        {/* My Loans */}
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg h-fit">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">
            My Loans
          </h2>

          <div className="space-y-4">
            {blockchainLoans.length === 0 && (
              <p className="text-gray-400 text-center py-10 font-['Plus_Jakarta_Sans']">
                No active loans found.
              </p>
            )}

            {blockchainLoans.map((loan) => {
              const statusStyle = getStatusStyle(loan.status);
              const fundingProgress =
                loan.amount > 0 ? (loan.fundedAmount / loan.amount) * 100 : 0;
              const isFunded = loan.status === "funded"; // Maps to ACTIVE in SC

              return (
                <div
                  key={loan.id}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-['Outfit'] mb-1 text-gray-900 font-semibold">
                        Invoice #{loan.invoiceNumber}
                      </div>
                      <div className="text-2xl font-['Outfit'] font-bold text-gray-900">
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    >
                      {statusStyle.icon}
                      <span className="text-xs font-['Plus_Jakarta_Sans'] font-medium">
                        {loan.status.charAt(0).toUpperCase() +
                          loan.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm font-['Plus_Jakarta_Sans']">
                    <div className="flex justify-between text-gray-600">
                      <span>Interest Rate:</span>
                      <span className="font-medium text-gray-900">
                        {loan.interestRate / 100}%
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>
                        {isFunded ? "Repayment Deadline:" : "Duration:"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {isFunded
                          ? formatRepayDate(loan.startTime, loan.duration)
                          : `${loan.duration / 86400} Days`}
                      </span>
                    </div>

                    {loan.ipfsHash && (
                      <div className="flex justify-between text-gray-600 items-center">
                        <span>Contract Document:</span>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${loan.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[#4C82FB] hover:text-[#3867d6] hover:underline transition-colors font-medium cursor-pointer group"
                        >
                          <FileText size={14} />
                          <div>View Invoice</div>
                        </a>
                      </div>
                    )}
                  </div>

                  {(loan.status === "open" || loan.status === "funded") && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1 font-['Plus_Jakarta_Sans']">
                        <span>Funding Progress</span>
                        <span>{fundingProgress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] transition-all duration-500"
                          style={{ width: `${fundingProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">
                        {loan.fundedAmount.toLocaleString()} /{" "}
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </div>
                  )}

                  {loan.status === "open" && loan.fundedAmount >= loan.amount && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleWithdraw(loan.id)}
                        className="w-full py-2 rounded-full bg-[#50E3C2] text-gray-900 hover:bg-[#50E3C2]/90 transition-colors font-['Plus_Jakarta_Sans'] font-semibold shadow-sm text-sm"
                      >
                        Withdraw Funds
                      </button>
                    </div>
                  )}

                  {loan.status === "funded" && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleRepay(loan.id)}
                        className="w-full py-2 rounded-full bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors font-['Plus_Jakarta_Sans'] font-semibold text-sm"
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
