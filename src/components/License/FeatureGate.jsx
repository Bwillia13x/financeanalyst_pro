import { Lock, Crown, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useLicense } from '../../services/licensing';

export const FeatureGate = ({
  feature,
  permission,
  children,
  fallback,
  showUpgrade = true
}) => {
  const { license, hasFeature, hasPermission } = useLicense();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async() => {
      try {
        let featureAccess = true;
        let permissionAccess = true;

        if (feature) {
          featureAccess = await hasFeature(feature);
        }

        if (permission) {
          permissionAccess = await hasPermission(permission);
        }

        setHasAccess(featureAccess && permissionAccess);
      } catch (error) {
        console.error('Feature gate check failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature, permission, hasFeature, hasPermission]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-md h-8 w-32" />
    );
  }

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgrade) {
    return null;
  }

  return <UpgradePrompt feature={feature} permission={permission} license={license} />;
};

const UpgradePrompt = ({ feature, permission, license }) => {
  const getUpgradeMessage = () => {
    if (feature === 'privateAnalysis') {
      return {
        title: 'Advanced Financial Modeling',
        description: 'Build sophisticated DCF, LBO, and 3-statement models',
        icon: Crown,
        upgradeTarget: 'professional'
      };
    }

    if (feature === 'aiAssistant') {
      return {
        title: 'AI Financial Assistant',
        description: 'Get intelligent insights and automated analysis',
        icon: Crown,
        upgradeTarget: 'professional'
      };
    }

    if (feature === 'dataExport') {
      return {
        title: 'Data Export',
        description: 'Export analyses to Excel, PDF, and other formats',
        icon: Crown,
        upgradeTarget: 'professional'
      };
    }

    if (feature === 'apiAccess') {
      return {
        title: 'API Access',
        description: 'Programmatic access to financial data and models',
        icon: Crown,
        upgradeTarget: 'enterprise'
      };
    }

    if (permission === 'canManageUsers') {
      return {
        title: 'User Management',
        description: 'Manage team members and permissions',
        icon: Users,
        upgradeTarget: 'professional'
      };
    }

    return {
      title: 'Premium Feature',
      description: 'This feature requires a higher license tier',
      icon: Lock,
      upgradeTarget: 'professional'
    };
  };

  const config = getUpgradeMessage();
  const IconComponent = config.icon;

  const handleUpgrade = () => {
    window.open(`/pricing?plan=${config.upgradeTarget}`, '_blank');
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
      <IconComponent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {config.title}
      </h3>
      <p className="text-gray-600 mb-4">
        {config.description}
      </p>
      <div className="space-y-2">
        <button
          onClick={handleUpgrade}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Upgrade to {config.upgradeTarget === 'professional' ? 'Professional' : 'Enterprise'}
        </button>
        {license?.type === 'trial' && (
          <p className="text-sm text-gray-500">
            {license.daysUntilExpiry} days left in trial
          </p>
        )}
      </div>
    </div>
  );
};

export default FeatureGate;
