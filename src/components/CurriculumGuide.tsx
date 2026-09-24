import React, { useState } from 'react';
import { SvpwmState } from '../types';
import { CURRICULUM_STEPS } from '../data/curriculum';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  Play
} from 'lucide-react';

interface CurriculumGuideProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
  onGoToVisualizer: () => void;
}

export const CurriculumGuide: React.FC<CurriculumGuideProps> = ({
  state,
  onUpdateState,
  onGoToVisualizer,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const step = CURRICULUM_STEPS[currentStepIndex];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentStepIndex]: optionIndex,
    }));
    setShowExplanation((prev) => ({
      ...prev,
      [currentStepIndex]: true,
    }));
  };

  const applySuggestedPreset = () => {
    if (step.suggestedPreset) {
      onUpdateState({
        ...step.suggestedPreset,
        isPlaying: false,
      });
      onGoToVisualizer();
    }
  };

  const hasAnswered = selectedAnswers[currentStepIndex] !== undefined;
  const isCorrect = step.quiz && selectedAnswers[currentStepIndex] === step.quiz.correctIndex;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 max-w-4xl mx-auto space-y-6">
      {/* Top Header & Step Progress */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                SVPWM Masterclass & Laboratory
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {step.title}
              </h2>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Step {currentStepIndex + 1} of {CURRICULUM_STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / CURRICULUM_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">
          {step.subtitle}
        </h3>

        {/* Formatted Description */}
        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          {step.description}
        </div>

        {/* Key Takeaways */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Key Concepts
          </span>
          <div className="grid grid-cols-1 gap-2">
            {step.keyPoints.map((point, i) => (
              <div
                key={`kp-${i}`}
                className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
              >
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Apply Suggested Preset */}
        {step.suggestedPreset && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/80 border border-indigo-100 mt-2">
            <div className="text-xs text-indigo-900">
              <strong>Interactive Demo:</strong> Load the recommended vector angle and modulation index for this step.
            </div>
            <button
              onClick={applySuggestedPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Simulate in Lab</span>
            </button>
          </div>
        )}

        {/* Interactive Concept Quiz */}
        {step.quiz && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Check Your Understanding
              </h4>
            </div>

            <p className="text-sm font-medium text-slate-800">
              {step.quiz.question}
            </p>

            <div className="space-y-2 mt-2">
              {step.quiz.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentStepIndex] === optIdx;
                const isCorrectOption = optIdx === step.quiz!.correctIndex;
                let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                if (hasAnswered) {
                  if (isSelected && isCorrectOption) {
                    btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                  } else if (isSelected && !isCorrectOption) {
                    btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                  } else if (isCorrectOption) {
                    btnStyle = 'bg-emerald-50/60 border-emerald-200 text-emerald-800';
                  }
                }

                return (
                  <button
                    key={`opt-${optIdx}`}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {hasAnswered && isSelected && isCorrectOption && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {hasAnswered && (
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed mt-3 ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-bold mb-1">
                  {isCorrect ? 'Correct!' : 'Not quite.'}
                </div>
                <p>{step.quiz.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Step</span>
        </button>

        <span className="text-xs text-slate-400">
          Module {currentStepIndex + 1} of {CURRICULUM_STEPS.length}
        </span>

        <button
          onClick={() => setCurrentStepIndex((prev) => Math.min(CURRICULUM_STEPS.length - 1, prev + 1))}
          disabled={currentStepIndex === CURRICULUM_STEPS.length - 1}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
        >
          <span>Next Step</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
