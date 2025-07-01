import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { client } from "@/sanity/lib/client"; // Adjust path to your Sanity client

const PageTitle = ({ title, isShowBack = true }) => {
  const router = useRouter();
  const [titleAccentColor, setTitleAccentColor] = useState("#32F232"); // Default fallback color

  const handleKeepBooking = () => router.push("/");

  // Fetch the color setting from Sanity
  useEffect(() => {
    const fetchColorSettings = async () => {
      try {
        const query = `*[_type == "settings"][0]{
          titleAccentColor
        }`;
        
        const settings = await client.fetch(query);
        
        if (settings?.titleAccentColor) {
          setTitleAccentColor(settings.titleAccentColor);
        }
      } catch (error) {
        console.error("Error fetching color settings:", error);
        // Keep the default color if fetch fails
      }
    };

    fetchColorSettings();
  }, []);

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
        <h1 className="relative text-center sm:text-5xl text-4xl font-black tracking-wide">
          <span 
            className={`absolute sm:-right-[4px] z-0 ${title.length >= 16 ? "-right-[6px]" : "-right-[4px]"}`}
            style={{ color: titleAccentColor }}
          >
            {title}
          </span>
          <span className="relative text-black z-10">{title}</span>
        </h1>
      </div>
    </div>
  );
};

export default PageTitle;