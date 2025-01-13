// app/components/booking/StepProcessBar.tsx
'use client';

import { Check } from 'lucide-react';



const StepProcessBar = ({ currentStep = 1 }) => {
  const steps = [
    { number: 1, label: 'Bookings' },
    { number: 2, label: 'Eligibility check' },
    { number: 3, label: 'Payment' }
  ];

  return (
    <nav className="w-full py-4" aria-label="Booking process">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center flex-1">
            <div className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${currentStep > step.number 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.number 
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500'}
                `}
                aria-current={currentStep === step.number ? 'step' : undefined}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`
                    h-0.5 w-full mx-4
                    ${currentStep > step.number + 1 
                      ? 'bg-green-500'
                      : 'bg-gray-200'}
                  `}
                  aria-hidden="true"
                />
              )}
            </div>
            <span 
              className={`
                mt-2 text-sm
                ${currentStep === step.number 
                  ? 'text-black font-medium' 
                  : 'text-gray-500'}
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default StepProcessBar;