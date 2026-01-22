import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';

// Define the logic keys matching service IDs in constants.ts
type RecommendationId = 'automation' | 'consulting' | 'integration' | 'ops-setup' | 'support';

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    points: RecommendationId[]; // Which service(s) this answer supports
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is the biggest bottleneck in your daily operations?",
    options: [
      { text: "Repetitive manual tasks (data entry, copy-pasting)", points: ['automation'] },
      { text: "Tools don't talk to each other (siloed data)", points: ['integration'] },
      { text: "Chaos when onboarding new clients or staff", points: ['ops-setup'] },
      { text: "Unsure which software to buy or use", points: ['consulting'] }
    ]
  },
  {
    id: 2,
    text: "How much time does your team spend on admin work per week?",
    options: [
      { text: "Less than 5 hours", points: ['support'] },
      { text: "5-10 hours", points: ['ops-setup', 'consulting'] },
      { text: "10-20 hours", points: ['automation'] },
      { text: "20+ hours (We are drowning)", points: ['automation', 'integration'] }
    ]
  },
  {
    id: 3,
    text: "How often do operational errors (wrong data, missed follow-ups) occur?",
    options: [
      { text: "Rarely, we are pretty organized", points: ['support'] },
      { text: "Occasionally, usually due to miscommunication", points: ['ops-setup'] },
      { text: "Weekly, usually due to manual entry mistakes", points: ['automation'] },
      { text: "Daily, it's affecting customer trust", points: ['consulting', 'integration'] }
    ]
  },
  {
    id: 4,
    text: "Where does your critical business data live right now?",
    options: [
      { text: "Scattered across Excel/Google Sheets", points: ['automation', 'integration'] },
      { text: "In physical folders, whiteboards, or sticky notes", points: ['ops-setup'] },
      { text: "Locked inside software tools that don't talk to each other", points: ['integration', 'consulting'] },
      { text: "We have a central database, but need better reporting", points: ['support', 'automation'] }
    ]
  },
  {
    id: 5,
    text: "How does your team handle task handoffs (e.g., Sales to Fulfillment)?",
    options: [
      { text: "Endless email chains or chat messages", points: ['ops-setup', 'automation'] },
      { text: "Verbal updates or manual 'to-do' lists", points: ['ops-setup', 'consulting'] },
      { text: "We manually re-enter info from one system to another", points: ['integration', 'automation'] },
      { text: "We use a system, but adoption is low or inconsistent", points: ['support', 'consulting'] }
    ]
  },
  {
    id: 6,
    text: "What is your primary goal for the next 6 months?",
    options: [
      { text: "Scale the team without breaking things", points: ['ops-setup'] },
      { text: "Reduce errors and manual workload", points: ['automation'] },
      { text: "Get a single view of all business data", points: ['integration'] },
      { text: "Modernize our tech stack completely", points: ['consulting'] }
    ]
  }
];

const STORAGE_KEY = 'ae_assessment_result';

const QuickAssessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [recommendedServiceId, setRecommendedServiceId] = useState<string>('');

  // Load saved result from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.serviceId) {
          setRecommendedServiceId(parsed.serviceId);
          setShowResult(true);
        }
      } catch (error) {
        console.error('Failed to parse saved assessment result', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleOptionClick = (points: RecommendationId[]) => {
    // Update scores
    const newScores = { ...scores };
    points.forEach(p => {
      newScores[p] = (newScores[p] || 0) + 1;
    });
    setScores(newScores);

    // Next step or finish
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores: Record<string, number>) => {
    // Find the key with the highest value
    let maxScore = 0;
    let winner = 'consulting'; // Default fallback

    Object.entries(finalScores).forEach(([key, value]) => {
      if (value > maxScore) {
        maxScore = value;
        winner = key;
      }
    });

    setRecommendedServiceId(winner);
    setShowResult(true);
    
    // Save result to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      serviceId: winner, 
      timestamp: new Date().toISOString() 
    }));
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setScores({});
    setShowResult(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const recommendedService = SERVICES.find(s => s.id === recommendedServiceId) || SERVICES[0];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
        {/* Left Side: Context */}
        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <HelpCircle className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Quick Assessment</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Not sure where to start? Answer a few questions about your current operations, and we'll point you to the right solution.
            </p>
          </div>
          {!showResult && (
            <div className="mt-8">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Progress</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-slate-400 mt-2">
                Step {currentStep + 1} of {QUESTIONS.length}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Questions/Results */}
        <div className="md:w-2/3 p-8 md:p-10 flex flex-col justify-center">
          {!showResult ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">
                {QUESTIONS[currentStep].text}
              </h3>

              <div className="space-y-3">
                {QUESTIONS[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option.points)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-blue-700">{option.text}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Recommended Solution</h3>
              <h4 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">{recommendedService.title}</h4>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                Based on your needs, <strong>{recommendedService.title.toLowerCase()}</strong> is the best starting point. This service helps {recommendedService.outcome.toLowerCase()}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg hover:shadow-blue-500/25"
                >
                  Book a Consult
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <button 
                  onClick={resetQuiz}
                  className="inline-flex items-center justify-center text-slate-500 hover:text-slate-700 font-medium py-3 px-4 hover:bg-slate-50 rounded-lg transition"
                >
                  <RefreshCw className="mr-2 w-4 h-4" /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAssessment;