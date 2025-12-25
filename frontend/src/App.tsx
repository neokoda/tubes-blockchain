import { useState } from 'react';
import { Landing } from './components/Landing';
import { BorrowerDashboard } from './components/BorrowerDashboard';
import { InvestorMarketplace } from './components/InvestorMarketplace';
import { Portfolio } from './components/Portfolio';
import { WalletWidget } from './components/WalletWidget';
import { BusinessProfileModal } from './components/BusinessProfileModal';
import { Zap, User, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type View = 'landing' | 'borrower' | 'investor' | 'portfolio';
type Mode = 'borrower' | 'investor';

interface BusinessProfile {
  name: string;
  description: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [mode, setMode] = useState<Mode>('borrower');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(10000);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFaucet, setShowFaucet] = useState(false);

  const handleConnectWallet = () => {
    const mockAddress = '0x' + Math.random().toString(16).slice(2, 10);
    setWalletAddress(mockAddress);
    setIsWalletConnected(true);
    setCurrentView('borrower');
    // Show business profile modal on first connection
    setShowProfileModal(true);
  };

  const handleClaimFaucet = () => {
    setBalance(prev => prev + 10000);
    toast.success('10,000 IDRS received!', {
      duration: 3000,
    });
  };

  const handleSaveProfile = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setShowProfileModal(false);
    toast.success('Business profile saved!');
  };

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'borrower') {
      setCurrentView('borrower');
    } else {
      setCurrentView('investor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      {isWalletConnected && (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF007A] to-[#4C82FB] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">CV</span>
                </div>
                <span className="font-['Outfit'] font-bold">ChainVoice</span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => handleModeSwitch('borrower')}
                  className={`px-4 py-2 rounded-full transition-all font-['Plus_Jakarta_Sans'] text-sm ${
                    mode === 'borrower'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Borrower
                  </div>
                </button>
                <button
                  onClick={() => handleModeSwitch('investor')}
                  className={`px-4 py-2 rounded-full transition-all font-['Plus_Jakarta_Sans'] text-sm ${
                    mode === 'investor'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Investor
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode-specific navigation */}
              {mode === 'borrower' && (
                <>
                  <button
                    onClick={() => setCurrentView('borrower')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'borrower' ? 'bg-gray-900/10' : 'hover:bg-gray-900/5'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="px-4 py-2 rounded-lg hover:bg-gray-900/5 transition-colors"
                  >
                    Profile
                  </button>
                </>
              )}

              {mode === 'investor' && (
                <>
                  <button
                    onClick={() => setCurrentView('investor')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'investor' ? 'bg-gray-900/10' : 'hover:bg-gray-900/5'
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => setCurrentView('portfolio')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'portfolio' ? 'bg-gray-900/10' : 'hover:bg-gray-900/5'
                    }`}
                  >
                    Portfolio
                  </button>
                </>
              )}

              {/* Faucet Button */}
              <button
                onClick={handleClaimFaucet}
                className="px-4 py-2 rounded-full bg-[#50E3C2]/20 text-[#50E3C2] hover:bg-[#50E3C2]/30 transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-semibold">Claim IDRS</span>
              </button>

              <WalletWidget address={walletAddress} balance={balance} />
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main>
        {currentView === 'landing' && (
          <Landing
            onConnectWallet={handleConnectWallet}
            isWalletConnected={isWalletConnected}
          />
        )}
        {currentView === 'borrower' && isWalletConnected && (
          <BorrowerDashboard
            balance={balance}
            setBalance={setBalance}
            businessProfile={businessProfile}
            walletAddress={walletAddress}
          />
        )}
        {currentView === 'investor' && isWalletConnected && (
          <InvestorMarketplace balance={balance} setBalance={setBalance} />
        )}
        {currentView === 'portfolio' && isWalletConnected && (
          <Portfolio />
        )}
      </main>

      {/* Business Profile Modal */}
      {showProfileModal && (
        <BusinessProfileModal
          profile={businessProfile}
          onSave={handleSaveProfile}
          onClose={() => {
            if (businessProfile) {
              setShowProfileModal(false);
            }
          }}
          isFirstTime={!businessProfile}
        />
      )}
    </div>
  );
}