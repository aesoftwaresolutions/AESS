import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { COMPANY_INFO } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Process', path: '/process' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center gap-3">
              <Link to="/" className="flex flex-col">
                <span className="font-bold text-xl text-slate-900 tracking-tight leading-none">AE Software</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Solutions LLC</span>
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path) 
                      ? 'text-blue-600' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/contact"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Book a Consult <ChevronRight size={16} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-500 hover:text-slate-900 focus:outline-none p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 absolute w-full">
            <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-3 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4">
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-md font-semibold"
                >
                  Book a Consult
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-white font-bold text-lg mb-4">AE Software Solutions</h3>
              <p className="text-sm leading-relaxed mb-4 text-slate-400">
                Helping Pennsylvania small businesses modernize operations through practical automation and clear systems.
              </p>
              <p className="text-sm font-medium text-slate-500">{COMPANY_INFO.location}</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/services" className="hover:text-blue-400 transition">Workflow Automation</Link></li>
                <li><Link to="/services" className="hover:text-blue-400 transition">Consulting</Link></li>
                <li><Link to="/services" className="hover:text-blue-400 transition">Systems Integration</Link></li>
                <li><Link to="/services" className="hover:text-blue-400 transition">Operational Setup</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link to="/process" className="hover:text-blue-400 transition">Our Process</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition">Contact</Link></li>
                <li><Link to="/legal" className="hover:text-blue-400 transition">Privacy & Terms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Get in Touch</h4>
              <p className="text-sm mb-4 text-slate-400">Ready to remove bottlenecks?</p>
              <Link to="/contact" className="inline-block bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm transition font-medium">
                Book a Free Discovery Call
              </Link>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link to="/legal" className="hover:text-slate-300">Privacy Policy</Link>
              <Link to="/legal" className="hover:text-slate-300">Terms of Service</Link>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-600 text-center md:text-left">
            Disclaimer: AE Software Solutions LLC provides technical consulting and operational advice. We do not provide legal or tax advice.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;