import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { BusinessProfile, Loan } from "../types";
import { useWallet } from "./WalletContext";
import { toast } from "sonner";

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();

  const [businessProfile, setBusinessProfileState] =
    useState<BusinessProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (address) {
      refreshProfile();
    } else {
      setBusinessProfileState(null);
    }
  }, [address]);

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

  return (
    <DataContext.Provider
      value={{
        businessProfile,
        setBusinessProfile,
        loans,
        addLoan,
        updateLoanStatus,
        refreshProfile,
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
