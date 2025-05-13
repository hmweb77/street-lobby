import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const PageTitle = ({ title, isShowBack = true }) => {
  const router = useRouter();
  const handleKeepBooking = () => router.push("/");
  return (
    <div className="w-auto max-w-5xl mx-auto my-2 flex justify-center gap-1">
      <div className="relative flex-1 flex justify-center items-center min-h-[60px] px-10">
        {isShowBack && (
          <ChevronLeft
            onClick={handleKeepBooking}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 text-black"
            size={40}
          />
        )}
        <h1 className="relative  text-center sm:text-5xl text-4xl font-black tracking-wide">
          <span className={`absolute sm:-right-[4px] text-[#32F232] z-0 ${title.length >= 16 ? "-right-[6px]" : "-right-[4px]"}`}>
            {title}
          </span>
          <span className="relative text-black z-10">{title}</span>
        </h1>
      </div>
    </div>
  );
};

export default PageTitle;
