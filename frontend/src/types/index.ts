export type UserMode = 'borrower' | 'investor';

export interface BusinessProfile {
  name: string;
  description: string;
  npwp: string;
}

export interface Loan {
  id: string;
  title: string;
  description: string;
  amount: number;
  duration: number;
  interestRate: number;
  status: 'verifying' | 'open' | 'funded' | 'repaid' | 'default' | 'rejected';
  fundedAmount: number;
  borrowerAddress: string;
  businessName: string;
  businessDescription: string;
  ipfsHash?: string;
  invoiceNumber: string;
  createdAt: number;
}