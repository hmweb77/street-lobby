"use client";
import StepProcessBar from "@/components/booking/ProcessBar";
import EligibilityCheck from "@/components/EligibilityCheck";
import PaymentSelector from "@/components/PaymentSelectors";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function page() {
   const router = useRouter();
   const [isEligible, setIsEligible] = useState(null);
   const { urlSearchParams } = useUrlSearchParams();
    const [step , setStep] = useState(2);
    const handleLeft = () => {
      if(isEligible === false) router.push("/");
      if(step > 2 && step !== 4 ) {
        setStep(prev => prev-1);
      } else{
        router.push(urlSearchParams);
      }
    };

    const onSuccess = () => {
      setStep(4);
    }

  return (
    <main className="max-w-2xl mx-auto">
        <StepProcessBar currentStep={step} handleLeft={handleLeft} />
        { step === 2 && (
          <EligibilityCheck isEligible={isEligible} setIsEligible={setIsEligible}  onNext={() => setStep(3)} />
        ) }

        {
          (step === 3 || step === 4 ) && (
            <PaymentSelector onSuccess={onSuccess} />
          )
        }
        
    </main>
  );
}

export default page;
