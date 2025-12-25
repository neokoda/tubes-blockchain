import { useState } from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { LoanDetailsModal } from './LoanDetailsModal';

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

const mockLoans: LoanOpportunity[] = [
  {
    id: 'L001',
    title: 'Inventory Expansion',
    description: 'Need funding for seasonal inventory purchase to meet Q4 demand',
    borrowerAddress: '0x1234...5678',
    businessName: 'Acme Manufacturing Co.',
    businessDescription: 'Leading manufacturer of industrial components with 15 years of experience',
    creditScore: 850,
    targetAmount: 100000000,
    currentAmount: 70000000,
    apr: 12,
    term: 30,
    verified: true,
  },
  {
    id: 'L002',
    title: 'Equipment Upgrade',
    description: 'Purchasing new CNC machinery to improve production efficiency',
    borrowerAddress: '0x8765...4321',
    businessName: 'TechParts Industries',
    businessDescription: 'Precision engineering company specializing in automotive parts',
    creditScore: 780,
    targetAmount: 50000000,
    currentAmount: 25000000,
    apr: 10,
    term: 60,
    verified: true,
  },
  {
    id: 'L003',
    title: 'Marketing Campaign',
    description: 'Digital marketing push for new product line launch',
    borrowerAddress: '0xabcd...ef12',
    businessName: 'GreenLeaf Organics',
    businessDescription: 'Organic food distributor serving retail chains nationwide',
    creditScore: 820,
    targetAmount: 75000000,
    currentAmount: 15000000,
    apr: 11.5,
    term: 45,
    verified: true,
  },
  {
    id: 'L004',
    title: 'Warehouse Expansion',
    description: 'Lease new warehouse space to support growing logistics operations',
    borrowerAddress: '0x9876...1234',
    businessName: 'QuickShip Logistics',
    businessDescription: 'Third-party logistics provider with nationwide coverage',
    creditScore: 795,
    targetAmount: 120000000,
    currentAmount: 96000000,
    apr: 9.5,
    term: 30,
    verified: true,
  },
  {
    id: 'L005',
    title: 'Raw Material Purchase',
    description: 'Bulk purchase of premium fabrics for upcoming fashion season',
    borrowerAddress: '0x5555...9999',
    businessName: 'Elite Fashion House',
    businessDescription: 'Premium clothing brand with retail presence across major cities',
    creditScore: 865,
    targetAmount: 200000000,
    currentAmount: 50000000,
    apr: 13,
    term: 90,
    verified: true,
  },
  {
    id: 'L006',
    title: 'Working Capital',
    description: 'Short-term working capital for operational expenses',
    borrowerAddress: '0x3333...7777',
    businessName: 'Metro Construction',
    businessDescription: 'Commercial construction company with portfolio of major projects',
    creditScore: 740,
    targetAmount: 60000000,
    currentAmount: 42000000,
    apr: 8.5,
    term: 30,
    verified: true,
  },
];

interface InvestorMarketplaceProps {
  balance: number;
  setBalance: (balance: number) => void;
}

export function InvestorMarketplace({ balance, setBalance }: InvestorMarketplaceProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanOpportunity | null>(null);
  const [loans, setLoans] = useState(mockLoans);

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-[#50E3C2]';
    if (score >= 700) return 'text-[#4C82FB]';
    return 'text-[#FFB020]';
  };

  const getScoreRing = (score: number) => {
    const percentage = (score / 900) * 100;
    return {
      stroke: score >= 800 ? '#50E3C2' : score >= 700 ? '#4C82FB' : '#FFB020',
      dashoffset: 251.2 - (251.2 * percentage) / 100,
    };
  };

  const handleFundingComplete = (loanId: string, amount: number) => {
    setLoans(prevLoans =>
      prevLoans.map(loan =>
        loan.id === loanId
          ? { ...loan, currentAmount: loan.currentAmount + amount }
          : loan
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Loan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map(loan => {
          const fundingProgress = (loan.currentAmount / loan.targetAmount) * 100;
          const scoreRing = getScoreRing(loan.creditScore);

          return (
            <div
              key={loan.id}
              className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-6 hover:border-gray-300 hover:transform hover:-translate-y-2 transition-all cursor-pointer shadow-lg hover:shadow-xl"
              onClick={() => setSelectedLoan(loan)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-1">
                    Borrower
                  </div>
                  <div className="font-['Outfit'] text-gray-900">{loan.borrowerAddress}</div>
                </div>
                
                {loan.verified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#50E3C2]/20 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-[#50E3C2]" />
                    <span className="text-xs text-[#50E3C2] font-['Plus_Jakarta_Sans']">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Credit Score Circle */}
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
                    <div className={`text-xl font-['Outfit'] font-bold ${getScoreColor(loan.creditScore)}`}>
                      {loan.creditScore}
                    </div>
                    <div className="text-xs text-gray-400 font-['Plus_Jakarta_Sans']">Score</div>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                  <span className="text-gray-600">Target</span>
                  <span className="text-gray-900 font-semibold">{(loan.targetAmount / 1000000).toFixed(1)}M IDRS</span>
                </div>
                <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                  <span className="text-gray-600">APR</span>
                  <span className="text-[#50E3C2] flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    {loan.apr}%
                  </span>
                </div>
                <div className="flex justify-between font-['Plus_Jakarta_Sans']">
                  <span className="text-gray-600">Term</span>
                  <span className="text-gray-900 font-semibold">{loan.term} Days</span>
                </div>
              </div>

              {/* Progress Bar */}
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

              {/* View Details Button */}
              <button className="w-full py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-['Plus_Jakarta_Sans'] font-semibold text-gray-900">
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          balance={balance}
          setBalance={setBalance}
          onClose={() => setSelectedLoan(null)}
          onFundingComplete={handleFundingComplete}
        />
      )}
    </div>
  );
}