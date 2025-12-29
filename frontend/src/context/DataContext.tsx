import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { BusinessProfile, Loan } from "../types";
import { useBlockchain } from "../utils/useBlockchain";
import { useWallet } from "./WalletContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface DataContextType {
  businessProfile: BusinessProfile | null;
  setBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  loans: Loan[];
  addLoan: (loan: Loan) => void;
  updateLoanStatus: (
    loanId: string,
    status: Loan["status"],
    fundedAmount?: number
  ) => void;
  refreshProfile: () => Promise<void>;
  refreshLoans: () => Promise<void>;
  fundLoan: (loanId: string, amount: number) => Promise<void>;
  createBlockchainLoan: (
    amount: number,
    interestRate: number,
    ipfsHash: string,
    invoiceNumber: string
  ) => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const {
    fetchLoans,
    fundLoan: blockchainFundLoan,
    createLoan,
    isConnected,
  } = useBlockchain();

  const [businessProfile, setBusinessProfileState] =
    useState<BusinessProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address && isConnected) {
      refreshProfile();
      refreshLoans();
    } else if (!address) {
      setBusinessProfileState(null);
      setLoans([]);
    }
  }, [address, isConnected]);

  const refreshProfile = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${BACKEND_URL}/profile/${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.business_name) {
          setBusinessProfileState({
            name: data.business_name,
            description: data.description,
            npwp: data.npwp,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const refreshLoans = async () => {
    console.log("🔍 refreshLoans called, isConnected:", isConnected);
    
    if (!isConnected) {
      console.log("❌ Not connected, returning early");
      return;
    }
  
    setLoading(true);
    try {
      console.log("📡 Calling fetchLoans...");
      const blockchainLoans = await fetchLoans();
      console.log("✅ Blockchain loans fetched:", blockchainLoans);
      
      const transformedLoans: Loan[] = blockchainLoans.map((loan: any) => ({
        id: loan.id,
        borrowerAddress: loan.borrowerAddress,
        amount: loan.amount,
        fundedAmount: loan.fundedAmount,
        interestRate: loan.interestRate,
        duration: loan.duration || 30,
        status: loan.status as Loan["status"],
        ipfsHash: loan.ipfsHash,
        invoiceNumber: loan.invoiceNumber,
        investors: loan.investors || [],
      }));
  
      console.log("✅ Transformed loans:", transformedLoans);
      setLoans(transformedLoans);
    } catch (error) {
      console.error("❌ Error fetching loans from blockchain:", error);
      toast.error("Failed to fetch loans from blockchain");
    } finally {
      setLoading(false);
    }
  };

  const setBusinessProfile = async (profile: BusinessProfile) => {
    if (!address) {
      toast.error("Connect wallet first!");
      return;
    }

    try {
      const payload = {
        wallet_address: address,
        business_name: profile.name,
        description: profile.description,
        npwp: profile.npwp,
      };

      const res = await fetch(`${BACKEND_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setBusinessProfileState(profile);
      toast.success("Business profile saved to database!");
    } catch (error) {
      console.error(error);
      toast.error("Error saving profile to backend");
    }
  };

  const addLoan = (loan: Loan) => {
    setLoans((prev) => [...prev, loan]);
  };

  const updateLoanStatus = (
    loanId: string,
    status: Loan["status"],
    fundedAmount?: number
  ) => {
    setLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          return {
            ...loan,
            status,
            fundedAmount:
              fundedAmount !== undefined ? fundedAmount : loan.fundedAmount,
          };
        }
        return loan;
      })
    );
  };

  const fundLoan = async (loanId: string, amount: number) => {
    if (!isConnected) {
      toast.error("Wallet not connected!");
      return;
    }
  
    setLoading(true);
    try {
      await blockchainFundLoan(loanId, amount);
      toast.success("Loan funded successfully!");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await refreshLoans();
    } catch (error: any) {
      console.error("Error funding loan:", error);
      toast.error(error.message || "Failed to fund loan");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createBlockchainLoan = async (
    amount: number,
    interestRate: number,
    ipfsHash: string,
    invoiceNumber: string
  ) => {
    if (!isConnected || !address) {
      toast.error("Wallet not connected!");
      return;
    }

    setLoading(true);
    try {
      const receipt = await createLoan(amount, interestRate, ipfsHash, invoiceNumber);
      toast.success("Loan request created on blockchain!");
      
      try {
        const payload = {
          wallet_address: address,
          amount,
          interest_rate: interestRate,
          ipfs_hash: ipfsHash,
          invoice_number: invoiceNumber,
          tx_hash: receipt.hash,
        };

        await fetch(`${BACKEND_URL}/loans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (backendError) {
        console.error("Backend save failed, but blockchain tx succeeded:", backendError);
      }

      await refreshLoans();
    } catch (error: any) {
      console.error("Error creating loan:", error);
      toast.error(error.message || "Failed to create loan");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        businessProfile,
        setBusinessProfile,
        loans,
        addLoan,
        updateLoanStatus,
        refreshProfile,
        refreshLoans,
        fundLoan,
        createBlockchainLoan,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}