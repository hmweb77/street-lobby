"use client";

import { Check, ChevronLeft } from "lucide-react";

const StepProcessBar = ({ currentStep, handleLeft, showPrev = true }) => {
  const steps = [
    { number: 1, label: "Selection" },
    { number: 2, label: "Eligibility check" },
    { number: 3, label: "Payment" },
  ];

  return (
    <nav className="py-10 px-4" aria-label="Booking process">
      <div className="relative max-w-4xl mx-auto flex items-center justify-center">
        {/* Back Arrow */}
        {/* {showPrev && (
          <button
            onClick={handleLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
        )} */}

        {/* Step Wrapper */}
        <div className="flex flex-1 justify-between items-center relative w-full">
          {/* Connector Line Behind Steps */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />

          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-center flex-1"
              >
                {/* Step circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${
                      isCompleted || isActive
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-sm text-center ${
                    isActive ? "text-black font-medium" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default StepProcessBar;
