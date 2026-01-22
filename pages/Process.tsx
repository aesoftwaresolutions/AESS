import React from 'react';
import { Link } from 'react-router-dom';
import { PROCESS_STEPS } from '../constants';
import { ArrowDown } from 'lucide-react';

const Process: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
       <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Our Process</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            We follow a structured engagement model to ensure we build exactly what you need, on time and on budget.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block"></div>

            <div className="space-y-12">
                {PROCESS_STEPS.map((step, index) => (
                    <div key={step.number} className="relative flex flex-col md:flex-row gap-8">
                        {/* Number Bubble */}
                        <div className="flex-shrink-0 z-10">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">
                                {step.number}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 transition">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h2>
                            <p className="text-slate-600 mb-6 text-lg">{step.description}</p>
                            
                            <div className="bg-white p-4 rounded-lg border border-slate-200 border-l-4 border-l-blue-400">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Role</h4>
                                <p className="text-slate-800 text-sm font-medium">{step.clientRole}</p>
                            </div>
                        </div>
                        
                        {/* Mobile connector */}
                        {index < PROCESS_STEPS.length - 1 && (
                             <div className="md:hidden flex justify-center text-slate-300">
                                <ArrowDown />
                             </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-20 p-8 bg-blue-50 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to start Discovery?</h3>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                The first step is a no-pressure conversation to see if we're a good fit for your business needs.
            </p>
            <Link to="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition">
                Book Discovery Call
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Process;