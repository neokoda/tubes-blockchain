import { useState } from 'react';
import { Upload, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Loan {
  id: string;
  title: string;
  description: string;
  amount: number;
  duration: number;
  interestRate: number;
  status: 'verifying' | 'open' | 'funded' | 'repaid';
  fundedAmount: number;
  invoiceUrl?: string;
  borrowerAddress: string;
  businessName: string;
  businessDescription: string;
}

interface BusinessProfile {
  name: string;
  description: string;
}

interface BorrowerDashboardProps {
  balance: number;
  setBalance: (balance: number) => void;
  businessProfile: BusinessProfile | null;
  walletAddress: string;
}

export function BorrowerDashboard({ balance, setBalance, businessProfile, walletAddress }: BorrowerDashboardProps) {
  const [loanTitle, setLoanTitle] = useState('');
  const [loanDescription, setLoanDescription] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState(30);
  const [interestRate, setInterestRate] = useState('5');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: 'L001',
      title: 'Inventory Expansion',
      description: 'Need funding for seasonal inventory purchase',
      amount: 50000000,
      duration: 30,
      interestRate: 8,
      status: 'funded',
      fundedAmount: 50000000,
      borrowerAddress: walletAddress,
      businessName: businessProfile?.name || '',
      businessDescription: businessProfile?.description || '',
    },
    {
      id: 'L002',
      title: 'Equipment Upgrade',
      description: 'Purchasing new manufacturing equipment',
      amount: 25000000,
      duration: 60,
      interestRate: 10,
      status: 'open',
      fundedAmount: 18000000,
      borrowerAddress: walletAddress,
      businessName: businessProfile?.name || '',
      businessDescription: businessProfile?.description || '',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success('Invoice uploaded successfully');
    }
  };

  const handleSubmitApplication = () => {
    if (!loanTitle || !loanDescription || !loanAmount || !uploadedFile) {
      toast.error('Please fill all fields and upload an invoice');
      return;
    }

    if (!businessProfile) {
      toast.error('Please complete your business profile first');
      return;
    }

    const newLoan: Loan = {
      id: `L${String(loans.length + 1).padStart(3, '0')}`,
      title: loanTitle,
      description: loanDescription,
      amount: parseInt(loanAmount),
      duration,
      interestRate: parseFloat(interestRate),
      status: 'verifying',
      fundedAmount: 0,
      borrowerAddress: walletAddress,
      businessName: businessProfile.name,
      businessDescription: businessProfile.description,
    };

    setLoans([...loans, newLoan]);
    
    // Simulate oracle verification
    setTimeout(() => {
      setLoans(prev =>
        prev.map(loan =>
          loan.id === newLoan.id ? { ...loan, status: 'open' } : loan
        )
      );
      toast.success('Invoice verified! Loan is now open for funding');
    }, 3000);

    // Reset form
    setLoanTitle('');
    setLoanDescription('');
    setLoanAmount('');
    setUploadedFile(null);
    toast.success('Loan application submitted');
  };

  const handleWithdraw = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan && loan.status === 'funded') {
      setBalance(balance + loan.fundedAmount);
      toast.success(`${loan.fundedAmount.toLocaleString()} IDRS withdrawn to your wallet`);
    }
  };

  const handleRepay = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan && loan.status === 'funded') {
      const repaymentAmount = loan.fundedAmount * (1 + loan.interestRate / 100);
      if (balance >= repaymentAmount) {
        setBalance(balance - repaymentAmount);
        setLoans(prev =>
          prev.map(l =>
            l.id === loanId ? { ...l, status: 'repaid' as const } : l
          )
        );
        toast.success('Loan repaid successfully!');
      } else {
        toast.error('Insufficient balance to repay loan');
      }
    }
  };

  const getStatusConfig = (status: Loan['status']) => {
    switch (status) {
      case 'verifying':
        return {
          label: 'Verifying...',
          color: 'bg-gray-200 text-gray-600',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        };
      case 'open':
        return {
          label: 'Open for Funding',
          color: 'bg-[#4C82FB]/20 text-[#4C82FB]',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'funded':
        return {
          label: 'Funded',
          color: 'bg-[#50E3C2]/20 text-[#50E3C2]',
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case 'repaid':
        return {
          label: 'Repaid',
          color: 'bg-[#50E3C2]/20 text-[#50E3C2]',
          icon: <CheckCircle className="w-3 h-3" />,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Loan Card */}
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">Create Loan Request</h2>

          <div className="space-y-6">
            {/* Loan Title */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Title
              </label>
              <input
                type="text"
                value={loanTitle}
                onChange={e => setLoanTitle(e.target.value)}
                placeholder="Enter loan title"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            {/* Loan Description */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Description
              </label>
              <textarea
                value={loanDescription}
                onChange={e => setLoanDescription(e.target.value)}
                placeholder="Enter loan description"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            {/* Loan Amount */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Loan Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-right text-3xl font-['Outfit'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-['Plus_Jakarta_Sans']">
                  IDRS
                </span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Duration
              </label>
              <select
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block">
                Interest Rate (%)
              </label>
              <input
                type="text"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value.replace(/[^\d.]/g, ''))}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            {/* Upload Invoice */}
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
                    <span className="font-['Plus_Jakarta_Sans'] text-gray-900">{uploadedFile.name}</span>
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

            {/* Submit Button */}
            <button
              onClick={handleSubmitApplication}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 transition-opacity font-['Outfit'] font-semibold shadow-lg"
            >
              Submit Application
            </button>
          </div>
        </div>

        {/* My Loans Status */}
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 lg:col-span-1 shadow-lg">
          <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">My Loans</h2>

          <div className="space-y-4">
            {loans.map(loan => {
              const statusConfig = getStatusConfig(loan.status);
              const fundingProgress = (loan.fundedAmount / loan.amount) * 100;

              return (
                <div
                  key={loan.id}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-['Outfit'] mb-1 text-gray-900">Loan #{loan.id}</div>
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

                  {loan.status === 'open' && (
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
                        {loan.fundedAmount.toLocaleString()} / {loan.amount.toLocaleString()} IDRS
                      </div>
                    </>
                  )}

                  {loan.status === 'funded' && (
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