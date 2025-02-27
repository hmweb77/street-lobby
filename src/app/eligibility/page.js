"use client";
import StepProcessBar from "@/components/booking/ProcessBar";
import EligibilityCheck from "@/components/EligibilityCheck";
import PaymentSelector from "@/components/PaymentSelectors";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function page() {
   const router = useRouter();
    const [step , setStep] = useState(2);
    const handleLeft = () => {
      router.back();
    };

  return (
    <main className="max-w-2xl mx-auto">
        <StepProcessBar currentStep={step} handleLeft={handleLeft} />
        { step === 2 && (
          <EligibilityCheck onNext={() => setStep(3)} />
        ) }

        {
          step === 3 && (
            <PaymentSelector />
          )
        }
        
    </main>
  );
}

export default page;
