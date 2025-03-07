import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'

const PageTitle = ({title}) => {
  const router = useRouter();
  const handleKeepBooking = () => router.push("/");
  return (
    <div className="w-auto max-w-5xl mx-auto my-2 md:my-8 flex justify-center gap-1">
        <div className="relative flex-1 flex justify-center">
          <ChevronLeft
            onClick={handleKeepBooking}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 text-black"
            size={40}
          />
          <h1 className="relative ml-8 text-center sm:text-5xl text-4xl font-black mb-2 tracking-wide">
            <span className="absolute -right-1 text-[#4AE54A] z-0">{title}</span>
            <span className="relative text-black z-10">{title}</span>
          </h1>
        </div>
      </div>
  )
}

export default PageTitle
