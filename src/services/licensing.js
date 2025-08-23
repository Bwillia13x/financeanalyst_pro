// Licensing and Subscription Management Service
export class LicensingService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
  }

  // License Types
  static LICENSE_TYPES = {
    TRIAL: 'trial',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
    ACADEMIC: 'academic'
  };

  // Feature Sets by License
  static FEATURES = {
    [this.LICENSE_TYPES.TRIAL]: {
      companyAnalysis: true,
      privateAnalysis: false,
      aiAssistant: false,
      advancedModeling: false,
      dataExport: false,
      apiAccess: false,
      userLimit: 1,
      analysisLimit: 5,
      supportLevel: 'community'
    },
    [this.LICENSE_TYPES.PROFESSIONAL]: {
      companyAnalysis: true,
      privateAnalysis: true,
      aiAssistant: true,
      advancedModeling: true,
      dataExport: true,
      apiAccess: false,
      userLimit: 5,
      analysisLimit: 100,
      supportLevel: 'email'
    },
    [this.LICENSE_TYPES.ENTERPRISE]: {
      companyAnalysis: true,
      privateAnalysis: true,
      aiAssistant: true,
      advancedModeling: true,
      dataExport: true,
      apiAccess: true,
      userLimit: -1, // unlimited
      analysisLimit: -1, // unlimited
      supportLevel: 'priority'
    },
    [this.LICENSE_TYPES.ACADEMIC]: {
      companyAnalysis: true,
      privateAnalysis: true,
      aiAssistant: false,
      advancedModeling: false,
      dataExport: false,
      apiAccess: false,
      userLimit: 50,
      analysisLimit: 200,
      supportLevel: 'community'
    }
  };

  // User Roles and Permissions
  static ROLES = {
    VIEWER: 'viewer',
    ANALYST: 'analyst',
    SENIOR_ANALYST: 'senior_analyst',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  };

  static PERMISSIONS = {
    [this.ROLES.VIEWER]: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canManageUsers: false,
      canAccessAPI: false,
      canUseAI: false
    },
    [this.ROLES.ANALYST]: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: false,
      canManageUsers: false,
      canAccessAPI: false,
      canUseAI: false
    },
    [this.ROLES.SENIOR_ANALYST]: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canManageUsers: false,
      canAccessAPI: false,
      canUseAI: true
    },
    [this.ROLES.ADMIN]: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canManageUsers: true,
      canAccessAPI: true,
      canUseAI: true
    },
    [this.ROLES.SUPER_ADMIN]: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canManageUsers: true,
      canAccessAPI: true,
      canUseAI: true,
      canManageLicense: true,
      canAccessBilling: true
    }
  };

  // Get current license information
  async getCurrentLicense() {
    const cached = this.cache.get('currentLicense');
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }

    try {
      // In production, this would fetch from API
      const license = this.getMockLicense();
      this.cache.set('currentLicense', {
        data: license,
        timestamp: Date.now()
      });
      return license;
    } catch (error) {
      console.error('Failed to fetch license:', error);
      return this.getDefaultLicense();
    }
  }

  // Check if feature is available
  async hasFeature(featureName) {
    const license = await this.getCurrentLicense();
    const features = LicensingService.FEATURES[license.type] || {};
    return features[featureName] === true;
  }

  // Check user permissions
  async hasPermission(permission, userRole = null) {
    const license = await this.getCurrentLicense();
    const role = userRole || license.userRole || LicensingService.ROLES.VIEWER;
    const permissions = LicensingService.PERMISSIONS[role] || {};
    return permissions[permission] === true;
  }

  // Check usage limits
  async checkUsageLimit(limitType) {
    const license = await this.getCurrentLicense();
    const features = LicensingService.FEATURES[license.type] || {};
    const limit = features[`${limitType}Limit`];

    if (limit === -1) return { allowed: true, unlimited: true };

    const currentUsage = await this.getCurrentUsage(limitType);
    return {
      allowed: currentUsage < limit,
      current: currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage)
    };
  }

  // Get license status for UI display
  async getLicenseStatus() {
    const license = await this.getCurrentLicense();
    const isExpired = new Date(license.expiresAt) < new Date();
    const daysUntilExpiry = Math.ceil(
      (new Date(license.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return {
      type: license.type,
      status: isExpired ? 'expired' : license.status,
      expiresAt: license.expiresAt,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      isExpired,
      isTrialExpiringSoon: license.type === 'trial' && daysUntilExpiry <= 7,
      features: LicensingService.FEATURES[license.type] || {},
      userRole: license.userRole,
      permissions: LicensingService.PERMISSIONS[license.userRole] || {}
    };
  }

  // License upgrade flow
  async upgradeLicense(newLicenseType) {
    // In production, this would integrate with payment processor
    return {
      success: true,
      redirectUrl: `/billing/upgrade?plan=${newLicenseType}`,
      message: `Upgrading to ${newLicenseType} license...`
    };
  }

  // Mock license for development
  getMockLicense() {
    const licenseType = process.env.NODE_ENV === 'development'
      ? LicensingService.LICENSE_TYPES.ENTERPRISE
      : LicensingService.LICENSE_TYPES.TRIAL;

    return {
      id: 'lic_mock_12345',
      type: licenseType,
      status: 'active',
      organizationId: 'org_valor_ivx',
      organizationName: 'Valor IVX Pro',
      userRole: LicensingService.ROLES.ADMIN,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      features: LicensingService.FEATURES[licenseType],
      billingCycle: 'monthly',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Default trial license
  getDefaultLicense() {
    return {
      id: 'lic_trial_default',
      type: LicensingService.LICENSE_TYPES.TRIAL,
      status: 'active',
      organizationId: null,
      organizationName: null,
      userRole: LicensingService.ROLES.VIEWER,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      features: LicensingService.FEATURES[LicensingService.LICENSE_TYPES.TRIAL]
    };
  }

  // Mock usage data
  async getCurrentUsage(limitType) {
    // In production, this would fetch from analytics/usage API
    const mockUsage = {
      analysis: 15,
      user: 3,
      apiCall: 245,
      export: 8
    };
    return mockUsage[limitType] || 0;
  }

  // License validation
  async validateLicense() {
    const license = await this.getCurrentLicense();
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);

    return {
      isValid: license.status === 'active' && expiresAt > now,
      license,
      errors: [
        ...(license.status !== 'active' ? ['License is not active'] : []),
        ...(expiresAt <= now ? ['License has expired'] : [])
      ]
    };
  }

  // Event listeners for license changes
  onLicenseChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of license changes
  notifyLicenseChange(license) {
    this.listeners.forEach(callback => {
      try {
        callback(license);
      } catch (error) {
        console.error('License change callback error:', error);
      }
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const licensingService = new LicensingService();

// React hook for license integration
export const useLicense = () => {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLicense = async() => {
      try {
        setLoading(true);
        const licenseData = await licensingService.getLicenseStatus();
        setLicense(licenseData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();

    // Listen for license changes
    const unsubscribe = licensingService.onLicenseChange(fetchLicense);
    return unsubscribe;
  }, []);

  const hasFeature = useCallback(async(featureName) => {
    return licensingService.hasFeature(featureName);
  }, []);

  const hasPermission = useCallback(async(permission) => {
    return licensingService.hasPermission(permission);
  }, []);

  return {
    license,
    loading,
    error,
    hasFeature,
    hasPermission,
    upgrade: licensingService.upgradeLicense.bind(licensingService)
  };
};
