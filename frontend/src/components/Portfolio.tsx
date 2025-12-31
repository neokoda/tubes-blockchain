import { ethers } from 'ethers';
import { DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useWallet } from '../context/WalletContext';

interface Investment {
  loanId: string;
  amountInvested: number;
  interestEarned: number;
  status: 'active' | 'repaid';
  apr: number;
  daysRemaining: number;
  borrower: string;
  invoiceNumber: string;
}

export function Portfolio() {
  const { address, provider } = useWallet();
  const { loans } = useData();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address && provider && loans.length > 0) {
      fetchMyInvestments();
    }
  }, [address, provider, loans]);

  const fetchMyInvestments = async () => {
    setLoading(true);
    try {
      const myInvestments: Investment[] = [];

      const LENDING_ABI = [
        "function contributions(uint256, address) view returns (uint256)"
      ];
      
      const contract = new ethers.Contract(
        import.meta.env.VITE_INVOICE_LENDING_ADDRESS,
        LENDING_ABI,
        provider!
      );

      for (const loan of loans) {
        try {
          const myContribution = await contract.contributions(loan.id, address);
          const invested = parseFloat(ethers.formatEther(myContribution));

          if (invested > 0) {
            const interest = (invested * loan.interestRate) / 100;
            
            let status: 'active' | 'repaid' = 'active';
            if (loan.status === 'closed') status = 'repaid';

            myInvestments.push({
              loanId: loan.id,
              amountInvested: invested,
              interestEarned: interest,
              status: status,
              apr: loan.interestRate,
              daysRemaining: loan.duration,
              borrower: loan.borrowerAddress,
              invoiceNumber: loan.invoiceNumber
            });
          }
        } catch (error) {
          console.log(`Could not fetch contribution for loan ${loan.id}:`, error);
        }
      }
      setInvestments(myInvestments);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLent = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const totalEarned = investments.reduce((sum, inv) => sum + inv.interestEarned, 0);
  const activeInvestments = investments.filter(inv => inv.status === 'active').length;

  const chartData = [
    { month: 'Jan', value: 20 },
    { month: 'Feb', value: 35 },
    { month: 'Mar', value: 45 },
    { month: 'Apr', value: 55 },
    { month: 'May', value: 75 },
    { month: 'Jun', value: 95 },
    { month: 'Jul', value: 120 },
    { month: 'Aug', value: 145 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  if (!address) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <h2 className="text-3xl font-['Outfit'] font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 font-['Plus_Jakarta_Sans'] text-center max-w-md">
            Connect your wallet to view your investment portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-6 hover:border-gray-300 transition-colors shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#4C82FB]/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#4C82FB]" />
            </div>
            <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Total Lent</div>
          </div>
          <div className="text-3xl font-['Outfit'] font-extrabold mb-1 text-gray-900">
            {(totalLent / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-400 font-['Plus_Jakarta_Sans']">IDRS</div>
        </div>

        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-6 hover:border-gray-300 transition-colors shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#50E3C2]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#50E3C2]" />
            </div>
            <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Profit Earned</div>
          </div>
          <div className="text-3xl font-['Outfit'] font-extrabold mb-1 text-[#50E3C2]">
            +{(totalEarned / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-400 font-['Plus_Jakarta_Sans']">IDRS</div>
        </div>

        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-6 hover:border-gray-300 transition-colors shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FF007A]/20 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-[#FF007A]" />
            </div>
            <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
              Active Investments
            </div>
          </div>
          <div className="text-3xl font-['Outfit'] font-extrabold mb-1 text-gray-900">{activeInvestments}</div>
          <div className="text-sm text-gray-400 font-['Plus_Jakarta_Sans']">Loans</div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-lg">
        <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">Total Value Locked</h2>
        
        <div className="h-64 flex items-end gap-4">
          {chartData.map((data, index) => {
            const height = (data.value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end h-48">
                  <div
                    className="w-full bg-gradient-to-t from-[#FF007A] to-[#4C82FB] rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-xs font-['Plus_Jakarta_Sans'] whitespace-nowrap">
                      {data.value}M IDRS
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 font-['Plus_Jakarta_Sans']">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
        <h2 className="font-['Outfit'] font-bold text-2xl mb-6 text-gray-900">My Investments</h2>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600 font-['Plus_Jakarta_Sans']">Loading investments...</p>
          </div>
        ) : investments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 font-['Plus_Jakarta_Sans']">No investments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Loan ID
                  </th>
                  <th className="text-left py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Invoice
                  </th>
                  <th className="text-right py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Amount Invested
                  </th>
                  <th className="text-right py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    APR
                  </th>
                  <th className="text-right py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Interest Earned
                  </th>
                  <th className="text-right py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Status
                  </th>
                  <th className="text-right py-4 px-4 text-sm text-gray-600 font-['Plus_Jakarta_Sans'] font-semibold">
                    Days Remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 font-['Outfit'] font-semibold text-gray-900">
                      #{investment.loanId}
                    </td>
                    <td className="py-4 px-4 font-['Plus_Jakarta_Sans'] text-gray-900">
                      {investment.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 text-right font-['Plus_Jakarta_Sans'] text-gray-900">
                      {investment.amountInvested.toLocaleString()} IDRS
                    </td>
                    <td className="py-4 px-4 text-right font-['Plus_Jakarta_Sans'] text-gray-900">
                      {investment.apr}%
                    </td>
                    <td className="py-4 px-4 text-right text-[#50E3C2] font-['Plus_Jakarta_Sans'] font-semibold">
                      +{investment.interestEarned.toLocaleString()} IDRS
                    </td>
                    <td className="py-4 px-4 text-right">
                      {investment.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#4C82FB]/20 text-[#4C82FB] rounded-full text-xs font-['Plus_Jakarta_Sans'] font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#50E3C2]/20 text-[#50E3C2] rounded-full text-xs font-['Plus_Jakarta_Sans'] font-semibold">
                          ✓ Repaid
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-['Plus_Jakarta_Sans'] text-gray-900">
                      {investment.status === 'active' ? `${investment.daysRemaining} days` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}