"use client"

import { useState, useEffect } from "react"

export default function PriceSlider({ min = 0, max = 100, defaultValue, onChange }) {
  // Ensure we have a valid initial value
  const initialValue = typeof defaultValue === "number" ? defaultValue : min
  const [value, setValue] = useState(initialValue)

  // Ensure percentage calculation is always valid
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  useEffect(() => {
    if (onChange && typeof value === "number") {
      onChange(value)
    }
  }, [value, onChange])

  const handleChange = (e) => {
    const newValue = Number(e.target.value)
    if (!isNaN(newValue)) {
      setValue(newValue)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Value bubble */}
      <div className="relative mb-2">
        <div
          className="absolute -top-8 transform -translate-x-1/2 bg-black text-white text-sm font-medium rounded-sm py-1 px-2"
          style={{ left: `${percentage}%` }}
        >
          {`${value}`}€
        </div>
      </div>

      {/* Custom slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="w-full h-1 appearance-none bg-gray-200 rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, black 0%, black ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            WebkitAppearance: "none",
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: black;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: black;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>

      {/* Min and max labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>{min}€</span>
        <span>{max}€</span>
      </div>
    </div>
  )
}
