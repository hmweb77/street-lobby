// app/components/booking/StepProcessBar.tsx
"use client";

import { Check } from "lucide-react";
import { ChevronLeft } from "lucide-react";
const StepProcessBar = ({ currentStep, setCurrentStep , showPrev = true }) => {
  const steps = [
    { number: 1, label: "Bookings" },
    { number: 2, label: "Eligibility check" },
    { number: 3, label: "Payment" }
  ];
  const handleLeft = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  return (
    <nav className=" py-4 px-2 ml-5" aria-label="Booking process">
      <div className="flex">
        <ChevronLeft
          className={`${showPrev ? "" : "hidden"} relative top-1 right-2 hover:cursor-pointer`}
          onClick={() => {
            handleLeft();
          }}
        />
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`flex flex-col ${
              step.number === 3 ? "w-14 " : "flex-1"
            }`}
          >
            <div className="">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                
                  ${
                    currentStep > step.number
                      ? "bg-black text-white"
                      : currentStep === step.number
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
                aria-current={currentStep === step.number ? "step" : undefined}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className=" ">
                  <div
                    className={`
                  h-0.5 mx-4 
                  relative -top-4 left-4 
                  ${
                    currentStep >= step.number + 1
                      ? "bg-black"
                      : "bg-gray-200"
                  }
                `}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            <span
              className={`
                mt-2 text-sm 
                relative  right-2
                ${
                  currentStep === step.number
                    ? "text-black font-medium"
                    : "text-gray-500"
                }
               
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
