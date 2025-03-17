import React from 'react';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Basic',
    id: 'tier-basic',
    href: '#',
    priceMonthly: '$0',
    description: 'Perfect for individuals just getting started with photo organization.',
    features: [
      '5 GB of storage',
      'Basic AI categorization',
      'Access on 2 devices',
      'Standard support',
      'Basic editing tools',
    ],
    mostPopular: false,
  },
  {
    name: 'Premium',
    id: 'tier-premium',
    href: '#',
    priceMonthly: '$9.99',
    description: 'Ideal for photography enthusiasts with growing collections.',
    features: [
      '100 GB of storage',
      'Advanced AI categorization',
      'Access on 5 devices',
      'Priority support',
      'Advanced editing tools',
      'Family sharing (up to 3 users)',
    ],
    mostPopular: true,
  },
  {
    name: 'Professional',
    id: 'tier-professional',
    href: '#',
    priceMonthly: '$19.99',
    description: 'For professional photographers and serious enthusiasts.',
    features: [
      'Unlimited storage',
      'Premium AI categorization',
      'Access on unlimited devices',
      '24/7 dedicated support',
      'Professional editing suite',
      'Family sharing (up to 6 users)',
      'RAW file support',
      'Custom metadata',
    ],
    mostPopular: false,
  },
];

const Pricing = () => {
  return (
    <div id="pricing" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose the perfect plan for your needs
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Whether you're an individual with a few photos or a professional with thousands, we have a plan that's right for you.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={`${
                tier.mostPopular
                  ? 'relative bg-white shadow-2xl'
                  : 'relative bg-white shadow-md sm:mx-8 lg:mx-0'
              } rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10 ${
                tier.mostPopular
                  ? 'lg:z-10 lg:rounded-b-none'
                  : tierIdx === 0
                  ? 'lg:rounded-r-none'
                  : 'lg:rounded-l-none'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={`text-lg font-semibold leading-8 ${
                      tier.mostPopular ? 'text-indigo-600' : 'text-gray-900'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={`${
                  tier.mostPopular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                    : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'
                } mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
              >
                Get started today
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;