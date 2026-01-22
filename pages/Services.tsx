import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Trophy } from 'lucide-react';
import { SERVICES, PRICING_TIERS } from '../constants';

const Services: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            From quick audits to full-scale operational overhauls, we provide the technical muscle to modernize your business.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
        {SERVICES.map((service, index) => (
          <div key={service.id} id={service.id} className={`flex flex-col lg:flex-row gap-12 items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
            <div className="lg:w-1/2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <service.icon size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{service.title}</h2>
              </div>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {service.description}
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Key Deliverables
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                    {service.deliverables.map((d, i) => (
                      <li key={i} className="text-slate-600 text-sm list-disc">{d}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                     <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" /> Typical Timeline
                    </h4>
                    <p className="text-slate-600 text-sm">{service.timeline}</p>
                  </div>
                  <div>
                     <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-amber-500" /> Outcome
                    </h4>
                    <p className="text-slate-600 text-sm">{service.outcome}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Is this for you?</h3>
              <p className="text-slate-600 mb-6">
                This service is designed for small businesses who are feeling the growing pains of manual processes. If you find yourself copying data between screens, chasing down status updates via email, or losing track of customer details, this is the solution.
              </p>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2">Perfect for:</h4>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li>• Service businesses (HVAC, Landscaping, Cleaning)</li>
                  <li>• Professional Services (Legal, Accounting, Consulting)</li>
                  <li>• Niche Retail & E-commerce</li>
                  <li>• Manufacturing & Logistics</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-600">Invest in systems that pay for themselves.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.name} className="flex flex-col bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-3xl font-bold text-blue-600">{tier.price}</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 h-10">{tier.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="block w-full text-center bg-white border border-slate-300 text-slate-900 font-semibold py-3 rounded-lg hover:bg-slate-50 hover:border-blue-400 transition">
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;