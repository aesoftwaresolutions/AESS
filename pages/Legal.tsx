import React from 'react';
import { COMPANY_INFO } from '../constants';

const Legal: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Legal Essentials</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Privacy Policy</h2>
          <p className="text-sm text-slate-500 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
          <p>
            {COMPANY_INFO.name} ("we", "us", or "our") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit our website.
          </p>
          <h3 className="text-lg font-semibold mt-4 mb-2">Information We Collect</h3>
          <p>
            We collect information you provide directly to us when filling out our contact forms, such as your name, email address, company name, and specific business needs. We also collect anonymous usage data to improve our website performance.
          </p>
          <h3 className="text-lg font-semibold mt-4 mb-2">How We Use Your Information</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>To provide you with information, products, or services that you request from us.</li>
            <li>To fulfill our obligations and enforce our rights arising from any contracts entered into between you and us.</li>
            <li>To notify you about changes to our services.</li>
          </ul>
          <h3 className="text-lg font-semibold mt-4 mb-2">Data Security</h3>
          <p>
            We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls.
          </p>
        </section>

        <hr className="my-8 border-slate-200"/>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Terms of Service</h2>
          <p>
            By accessing this website, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the website or use any services.
          </p>
          <h3 className="text-lg font-semibold mt-4 mb-2">Consulting Services</h3>
          <p>
            Specific terms regarding our consulting engagements, deliverables, payment schedules, and intellectual property rights will be governed by a separate Master Services Agreement (MSA) signed upon engagement.
          </p>
          <h3 className="text-lg font-semibold mt-4 mb-2">Disclaimer</h3>
          <p>
            The materials on {COMPANY_INFO.name}'s website are provided on an 'as is' basis. {COMPANY_INFO.name} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
          </p>
           <h3 className="text-lg font-semibold mt-4 mb-2">Governing Law</h3>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Legal;