import React from 'react';
import { MapPin, Shield, UserCheck, Briefcase } from 'lucide-react';
import { COMPANY_INFO } from '../constants';

const About: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
       <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Practical technology solutions for Pennsylvania small businesses.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Story Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
          <div className="prose prose-lg text-slate-600">
            <p className="mb-4">
              AE Software Solutions LLC is a computer software consulting firm based in <strong>Chambersburg, Pennsylvania</strong>. We were founded on a simple premise: small businesses shouldn't be held back by "busywork."
            </p>
            <p className="mb-4">
              We see too many business owners trapped in spreadsheets, manual data entry, and chaotic email threads. They want to grow, but their back-office operations can't handle the scale.
            </p>
            <p>
              Our goal is to remove those bottlenecks. We design automated workflows and implement specialized tools that fit how your business actually operates—not how a generic software vendor thinks you should operate.
            </p>
          </div>
        </section>

        {/* Business Details / Trust */}
        <section className="bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-16">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                    <MapPin className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-900">Location</h4>
                        <p className="text-slate-600">{COMPANY_INFO.location}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <Briefcase className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-900">Entity Type</h4>
                        <p className="text-slate-600">{COMPANY_INFO.entityType}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Shield className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-900">Data Handling</h4>
                        <p className="text-slate-600 text-sm">
                            We take security seriously. We use encrypted password managers for all client credentials and adhere to strict data access protocols. We do not store your customer PII on our own servers.
                        </p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <UserCheck className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-900">Service Boundaries</h4>
                        <p className="text-slate-600 text-sm">
                            While we optimize financial and operational workflows, we are technical consultants, not CPAs or Lawyers. We do not provide legal or tax advice.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Work With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">Local & Accessible</h4>
                    <p className="text-sm text-slate-600">Based in PA, we understand the local business climate and are available during your working hours.</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">Vendor Agnostic</h4>
                    <p className="text-sm text-slate-600">We don't resell software. We recommend the tools that are best for <em>you</em>, not the ones that pay us a commission.</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">Focus on ROI</h4>
                    <p className="text-sm text-slate-600">Every project starts with "How much time/money will this save?" If the math doesn't work, we don't build it.</p>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default About;