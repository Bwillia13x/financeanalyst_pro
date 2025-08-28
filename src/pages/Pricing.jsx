import { Check, Crown, Users, Zap, ArrowRight } from 'lucide-react';
import React from 'react';

import { useLicense } from '../services/licensing';

const PricingPage = () => {
  const { license } = useLicense();

  const plans = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      period: '14 days',
      description: 'Perfect for trying out our platform',
      icon: Zap,
      features: [
        'Company analysis tools',
        'Real-time market data',
        'Basic charts & visualizations',
        'Community support',
        'Up to 5 analyses'
      ],
      limitations: [
        'No private analysis workspace',
        'No AI assistant',
        'No data export',
        'Single user only'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      period: 'month',
      description: 'For investment professionals and analysts',
      icon: Crown,
      features: [
        'Everything in Trial',
        'Private analysis workspace',
        'Advanced financial modeling (DCF, LBO, 3-Statement)',
        'AI financial assistant',
        'Scenario analysis & Monte Carlo',
        'Data export (Excel, PDF, CSV)',
        'Email support',
        'Up to 5 team members',
        'Unlimited analyses'
      ],
      limitations: ['No API access', 'No priority support'],
      cta: 'Upgrade to Professional',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      period: 'month',
      description: 'For teams and organizations',
      icon: Users,
      features: [
        'Everything in Professional',
        'API access for custom integrations',
        'Advanced user management & permissions',
        'Priority support & training',
        'Custom branding options',
        'Advanced security features',
        'Unlimited team members',
        'Dedicated customer success manager'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const handlePlanSelect = planId => {
    if (planId === 'trial') {
      window.location.href = '/signup';
    } else if (planId === 'enterprise') {
      window.location.href = '/contact-sales';
    } else {
      window.location.href = `/billing/upgrade?plan=${planId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock powerful financial analysis tools with flexible pricing designed for individual
            analysts and teams
          </p>
        </div>

        {/* Current License Status */}
        {license && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800">
              <Crown className="w-4 h-4 mr-2" />
              Current Plan: {license.type.charAt(0).toUpperCase() + license.type.slice(1)}
              {license.daysUntilExpiry > 0 && (
                <span className="ml-2">• {license.daysUntilExpiry} days remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => {
            const IconComponent = plan.icon;
            const isCurrentPlan = license?.type === plan.id;
            const cardClasses = [
              'relative bg-white rounded-xl shadow-lg p-8',
              plan.popular && 'ring-2 ring-blue-500 transform scale-105',
              isCurrentPlan && 'ring-2 ring-green-500'
            ]
              .filter(Boolean)
              .join(' ');
            const ctaBase =
              'w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200';
            const ctaState = isCurrentPlan
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : plan.popular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-gray-800';
            const ctaClasses = [ctaBase, ctaState].join(' ');

            return (
              <div key={plan.id} className={cardClasses}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <IconComponent className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isCurrentPlan}
                  className={ctaClasses}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.cta}
                  {!isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2 inline" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can change your plan at any time. Upgrades take effect immediately, and
                downgrades take effect at the end of your current billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and can arrange ACH transfers for
                Enterprise customers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a long-term contract?</h3>
              <p className="text-gray-600">
                No, all plans are month-to-month with no long-term commitment. Enterprise customers
                can opt for annual billing for additional savings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer academic discounts?</h3>
              <p className="text-gray-600">
                Yes, we offer special academic pricing for students, faculty, and educational
                institutions. Contact us for details.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Need a Custom Solution?</h3>
          <p className="text-gray-600 mb-6">
            Our Enterprise plan can be customized for large organizations with specific
            requirements.
          </p>
          <button
            onClick={() => (window.location.href = '/contact-sales')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Contact Sales Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
