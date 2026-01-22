import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PROBLEMS_SOLVED, SERVICES } from '../constants';
import ROICalculator from '../components/ROICalculator';
import QuickAssessment from '../components/QuickAssessment';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white pt-24 pb-32 overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:w-2/3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Replace manual busywork with <span className="text-blue-400">systems that scale</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              AE Software Solutions helps Pennsylvania small businesses modernize how work gets done. We build automated workflows so you spend less time on spreadsheets and more time on revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/25">
                Book a Free Consult
              </Link>
              <Link to="/services" className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-600 text-base font-semibold rounded-lg text-slate-200 hover:bg-slate-800 transition">
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Solved */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">The Problem</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Growth shouldn't create chaos
            </p>
            <p className="mt-4 max-w-2xl text-lg text-slate-500 mx-auto">
              If you're hiring more people just to manage paper and data entry, your operations are the bottleneck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROBLEMS_SOLVED.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:shadow-md transition duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Assessment Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuickAssessment />
        </div>
      </section>

      {/* Interactive ROI Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 mb-10 lg:mb-0">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Calculate your potential savings
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Small inefficiencies compound over time. See how much budget you could reclaim by automating routine tasks like scheduling, invoicing, and data sync.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Eliminate double-entry errors",
                  "Speed up client onboarding",
                  "Get paid faster with automated invoicing",
                  "Real-time operational visibility"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/process" className="text-blue-600 font-semibold flex items-center hover:text-blue-700">
                See how we do it <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="lg:col-span-7">
              <ROICalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-900">How we help</h2>
              <p className="mt-4 text-lg text-slate-600">
                We don't just recommend software; we implement it, integrate it, and ensure your team knows how to use it.
              </p>
            </div>
            <Link to="/services" className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-700 mt-4 md:mt-0">
              View all services <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.slice(0, 3).map((service) => (
              <div key={service.id} className="group relative bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <service.icon size={64} className="text-blue-600" />
                </div>
                <service.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 mb-4 line-clamp-3">{service.description}</p>
                <Link to="/services" className="text-sm font-semibold text-slate-900 underline decoration-blue-500/30 hover:decoration-blue-500 transition-all">
                  Learn more
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-8 md:hidden text-center">
             <Link to="/services" className="text-blue-600 font-semibold hover:text-blue-700">
              View all services &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to stop doing busywork?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Book a free discovery call. We'll discuss your current bottlenecks and sketch out a plan to fix them.
          </p>
          <Link to="/contact" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-lg transition transform hover:-translate-y-1">
            Book Your Consultation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;