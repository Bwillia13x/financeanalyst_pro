import { AlertCircle, Crown, Users, Calendar, ArrowRight } from 'lucide-react';
import React from 'react';

import { useLicense } from '../../services/licensing';

export const LicenseBanner = () => {
  const { license, loading } = useLicense();

  if (loading || !license) return null;

  // Don't show banner for enterprise licenses
  if (license.type === 'enterprise') return null;

  const getBannerConfig = () => {
    switch (license.type) {
      case 'trial':
        return {
          icon: AlertCircle,
          bgColor: license.isTrialExpiringSoon ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
          textColor: license.isTrialExpiringSoon ? 'text-red-800' : 'text-amber-800',
          iconColor: license.isTrialExpiringSoon ? 'text-red-500' : 'text-amber-500',
          message: license.isTrialExpiringSoon
            ? `Trial expires in ${license.daysUntilExpiry} days`
            : `${license.daysUntilExpiry} days left in trial`,
          cta: 'Upgrade Now'
        };
      case 'professional':
        return {
          icon: Crown,
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500',
          message: `Professional Plan • ${license.daysUntilExpiry} days until renewal`,
          cta: 'Manage Billing'
        };
      case 'academic':
        return {
          icon: Users,
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-500',
          message: `Academic License • ${license.daysUntilExpiry} days remaining`,
          cta: 'Renew License'
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  const handleUpgrade = () => {
    if (license.type === 'trial') {
      window.open('/pricing', '_blank');
    } else {
      window.open('/billing', '_blank');
    }
  };

  return (
    <div className={`${config.bgColor} border-l-4 ${config.textColor} p-4 m-4 rounded-r-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <config.icon className={`w-5 h-5 ${config.iconColor}`} />
          <div>
            <p className="font-medium">{config.message}</p>
            {license.type === 'trial' && (
              <p className="text-sm mt-1 opacity-75">
                Unlock advanced modeling, AI insights, and data export
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          className={`
            inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
            bg-white ${config.textColor} border border-current
            hover:bg-opacity-10 transition-colors duration-200
          `}
        >
          {config.cta}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default LicenseBanner;
