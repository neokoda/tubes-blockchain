import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { useData } from "../context/DataContext";
import { Loan } from "../types";
import { uploadToPinata } from "../utils/pinata";
import { ethers } from "ethers";
import { INVOICE_LENDING_ADDRESS, INVOICE_LENDING_ABI } from "../config";

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
    default:
      return "verifying";
  }
};

export function BorrowerDashboard() {
  const { address, provider } = useWallet();
  const { businessProfile } = useData();

  const [loanTitle, setLoanTitle] = useState("");
  const [loanDescription, setLoanDescription] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [duration, setDuration] = useState(30);
  const [interestRate, setInterestRate] = useState("5");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [blockchainLoans, setBlockchainLoans] = useState<Loan[]>([]);

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
      const tempLoans: Loan[] = [];

      for (let i = 1; i < nextId; i++) {
        const loanData = await contract.loans(i);

        if (loanData[1].toLowerCase() === address?.toLowerCase()) {
          const statusUI = mapSCStatusToUI(Number(loanData[7]));

          tempLoans.push({
            id: loanData[0].toString(),
            title: `Invoice #${loanData[5]}`,
            description: `Loan Request for Invoice ${loanData[5]}`,
            amount: Number(ethers.formatEther(loanData[2])),
            duration: 30,
            interestRate: Number(loanData[6]),
            status: statusUI,
            fundedAmount: Number(ethers.formatEther(loanData[3])),
            borrowerAddress: loanData[1],
            businessName: businessProfile?.name || "My Business",
            businessDescription: "...",
            createdAt: Date.now(),
          });
        }
      }
      setBlockchainLoans(tempLoans);
    } catch (err) {
      console.error("Error fetching loans:", err);
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
    if (
      !loanTitle ||
      !loanDescription ||
      !loanAmount ||
      !uploadedFile ||
      !invoiceNumber
    ) {
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

      const tx = await contract.createLoanRequest(
        amountWei,
        interestRate,
        ipfsHash,
        invoiceNumber
      );

      toast.info("Transaction submitted. Waiting for verification...");
      await tx.wait();

      toast.success("Loan application submitted successfully!");

      setLoanTitle("");
      setLoanDescription("");
      setLoanAmount("");
      setInvoiceNumber("");
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
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block font-bold text-[#FF007A]">
                Invoice Number (Must match Tax Data)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2024-001"
                className="w-full bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors tracking-wide"
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
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                </select>
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4"
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

        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">
            My Loans
          </h2>
          <div className="space-y-4">
            {blockchainLoans.length === 0 && (
              <p className="text-gray-400 text-center py-10">
                No active loans.
              </p>
            )}
            {blockchainLoans.map((loan) => {
              const statusConfig = getStatusConfig(loan.status);
              const fundingProgress =
                loan.amount > 0 ? (loan.fundedAmount / loan.amount) * 100 : 0;
              return (
                <div
                  key={loan.id}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-['Outfit'] mb-1 text-gray-900">
                        {loan.title}
                      </div>
                      <div className="text-2xl font-['Outfit'] font-bold text-gray-900">
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}
                    >
                      {statusConfig.icon}{" "}
                      <span className="text-xs">{statusConfig.label}</span>
                    </div>
                  </div>

                  {(loan.status === "open" || loan.status === "funded") && (
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB]"
                          style={{ width: `${fundingProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {loan.fundedAmount.toLocaleString()} /{" "}
                        {loan.amount.toLocaleString()} IDRS
                      </div>
                    </div>
                  )}

                  {loan.status === "funded" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleWithdraw(loan.id)}
                        className="flex-1 py-2 rounded-full bg-[#50E3C2] text-gray-900 font-semibold text-sm"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => handleRepay(loan.id)}
                        className="flex-1 py-2 rounded-full bg-gray-200 text-gray-900 font-semibold text-sm"
                      >
                        Repay
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
