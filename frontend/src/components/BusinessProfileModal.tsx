import { useState } from 'react';
import { X, Building2 } from 'lucide-react';

interface BusinessProfile {
  name: string;
  description: string;
}

interface BusinessProfileModalProps {
  profile: BusinessProfile | null;
  onSave: (profile: BusinessProfile) => void;
  onClose: () => void;
  isFirstTime: boolean;
}

export function BusinessProfileModal({
  profile,
  onSave,
  onClose,
  isFirstTime,
}: BusinessProfileModalProps) {
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      return;
    }
    onSave({ name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white border border-gray-200 rounded-3xl shadow-2xl">
        {/* Close Button - only show if not first time */}
        {!isFirstTime && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
        )}

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF007A] to-[#4C82FB] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-3xl text-gray-900">
                {isFirstTime ? 'Create Business Profile' : 'Edit Business Profile'}
              </h2>
              <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mt-1">
                {isFirstTime
                  ? 'Complete your profile to start borrowing'
                  : 'Update your business information'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block font-semibold">
                Business Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Acme Manufacturing Co."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors"
              />
            </div>

            {/* Business Description */}
            <div>
              <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block font-semibold">
                Business Description *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your business, what you do, your market, etc."
                rows={6}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-['Plus_Jakarta_Sans'] text-gray-900 focus:outline-none focus:border-[#4C82FB] transition-colors resize-none"
              />
            </div>

            {isFirstTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-900 font-['Plus_Jakarta_Sans']">
                  💡 This information will be visible to investors when you request loans. Make sure to provide accurate details about your business.
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || !description.trim()}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 transition-opacity font-['Outfit'] font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFirstTime ? 'Create Profile' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
