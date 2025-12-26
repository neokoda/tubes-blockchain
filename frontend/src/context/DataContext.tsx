import React, { createContext, useContext, useState, ReactNode } from "react";
import { BusinessProfile, Loan } from "../types";
import { useWallet } from "./WalletContext";

interface DataContextType {
  businessProfile: BusinessProfile | null;
  setBusinessProfile: (profile: BusinessProfile) => void;
  loans: Loan[];
  addLoan: (loan: Loan) => void;
  updateLoanStatus: (
    loanId: string,
    status: Loan["status"],
    fundedAmount?: number
  ) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // const { address } = useWallet();

  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);

  const [loans, setLoans] = useState<Loan[]>([
    {
      id: "L001",
      title: "Inventory Expansion",
      description: "Need funding for seasonal inventory purchase",
      amount: 50000000,
      duration: 30,
      interestRate: 8,
      status: "funded",
      fundedAmount: 50000000,
      borrowerAddress: "0x123...mock",
      businessName: "Acme Corp",
      businessDescription: "Global supplier",
      createdAt: Date.now(),
    },
    {
      id: "L002",
      title: "Equipment Upgrade",
      description: "Purchasing new CNC machinery",
      amount: 25000000,
      duration: 60,
      interestRate: 10,
      status: "open",
      fundedAmount: 18000000,
      borrowerAddress: "0x888...mock",
      businessName: "TechParts",
      businessDescription: "Precision engineering",
      createdAt: Date.now(),
    },
  ]);

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
