import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Send } from "lucide-react";

interface OnboardingEvaluationProps {
  onCompleted: (results: any) => void;
}

type AnswerPath = "age_13_19" | "age_20_plus" | "not_sure_yet" | "clear_path";

interface OnboardingData {
  ageGroup: "13-19" | "20+" | null;
  description: string | null;
  wantToBecome: string | null;
  primaryGoal: string | null;
  interestArea: string | null;
  obstacle: string | null;
  weeklyTime: string | null;
  whatMatters: string | null;
  pathType: AnswerPath;
}

export default function OnboardingEvaluation({ onCompleted }: OnboardingEvaluationProps) {
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [answers, setAnswers] = useState<OnboardingData>({
    ageGroup: null,
    description: null,
    wantToBecome: null,
    primaryGoal: null,
    interestArea: null,
    obstacle: null,
    weeklyTime: null,
    whatMatters: null,
    pathType: "age_13_19"
  });

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers };
    
    switch (currentQuestion) {
      case 1:
        newAnswers.ageGroup = answer as "13-19" | "20+";
        newAnswers.pathType = answer === "13-19" ? "age_13_19" : "age_20_plus";
        break;
      case 2:
        if (answers.pathType === "age_13_19") {
          newAnswers.description = answer;
          if (answer === "Not Sure Yet") {
            newAnswers.pathType = "not_sure_yet";
          }
        } else {
          newAnswers.description = answer;
        }
        break;
      case 3:
        if (answers.pathType === "not_sure_yet") {
          newAnswers.interestArea = answer;
          // Skip to common questions
          setCurrentQuestion(5);
          setAnswers(newAnswers);
          return;
        } else if (answers.pathType === "age_20_plus") {
          newAnswers.wantToBecome = answer;
        } else {
          newAnswers.primaryGoal = answer;
          // Skip to common questions  
          setCurrentQuestion(5);
          setAnswers(newAnswers);
          return;
        }
        break;
      case 4:
        if (answers.pathType === "age_20_plus") {
          newAnswers.primaryGoal = answer;
        } else {
          // Should not reach here for 13-19 path
          newAnswers.wantToBecome = answer;
        }
        break;
      case 5:
        newAnswers.obstacle = answer;
        break;
      case 6:
        newAnswers.weeklyTime = answer;
        break;
      case 7:
        newAnswers.whatMatters = answer;
        break;
    }
    
    setAnswers(newAnswers);
    
    if (currentQuestion < 7) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Completed
      onCompleted(answers);
    }
  };

  const goBack = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-8">What is your age group?</h2>
            <div className="space-y-3">
              {["13–19", "20+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        if (answers.pathType === "age_13_19") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">Which best describes you?</h2>
              <div className="space-y-3">
                {["Student", "Student + Learning Skills Online", "Student + Building Projects", "Student + Freelancing", "Not Sure Yet"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">Which best describes you?</h2>
              <div className="space-y-3">
                {["College Student", "Working Professional", "Founder", "Freelancer", "Creator", "Between Careers"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

      case 3:
        if (answers.pathType === "not_sure_yet") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">Which sounds most interesting?</h2>
              <div className="space-y-3">
                {["Technology", "AI", "Business", "Startups", "Design", "Content Creation", "Research", "Finance"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        } else if (answers.pathType === "age_20_plus") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">What do you want to become?</h2>
              <div className="space-y-3">
                {["Founder", "AI Engineer", "Software Engineer", "Product Manager", "Designer", "Creator", "Investor", "Researcher", "Not Sure Yet"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">What do you want most in the next 12 months?</h2>
              <div className="space-y-3">
                {["Better Grades", "Learn Valuable Skills", "Earn My First Money Online", "Build My First Project", "Start A Business", "Figure Out My Direction"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

      case 4:
        if (answers.pathType === "age_20_plus") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">What is your primary goal for the next 12 months?</h2>
              <div className="space-y-3">
                {["Increase Income", "Build A Company", "Get A Better Job", "Learn AI", "Build Products", "Gain Freedom"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        } else {
          // For 13-19 path, this would be about what they want to become
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-8">What do you want to become?</h2>
              <div className="space-y-3">
                {["Founder", "AI Engineer", "Software Engineer", "Product Manager", "Designer", "Creator", "Investor", "Researcher", "Not Sure Yet"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-8">What is your biggest obstacle?</h2>
            <div className="space-y-3">
              {["Lack Of Direction", "Lack Of Skills", "Procrastination", "Inconsistency", "Lack Of Time", "Lack Of Confidence", "No Accountability"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-8">How much time can you realistically commit each week?</h2>
            <div className="space-y-3">
              {["1–5 Hours", "5–10 Hours", "10–20 Hours", "20–40 Hours", "40+ Hours"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-8">What matters most?</h2>
            <div className="space-y-3">
              {["Money", "Freedom", "Impact", "Mastery", "Building Something Great", "Recognition"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-4 border border-[#3b494b]/30 bg-[#131313] hover:bg-[#1a1a1a] hover:border-[#00f0ff]/50 transition-all duration-200 text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <div className="text-[#00f0ff] text-sm font-mono mb-2">QUESTION {currentQuestion}</div>
          <div className="w-full h-[1px] bg-[#3b494b]/30"></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={goBack}
            disabled={currentQuestion === 1}
            className="flex items-center gap-2 text-[#b9cacb]/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          
          <div className="text-[#b9cacb]/30 text-sm">
            {currentQuestion} / 7
          </div>
        </div>
      </div>
    </div>
  );
}