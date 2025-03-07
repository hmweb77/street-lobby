"use client"

import { useState, useEffect } from "react"

export default function PriceRangeSlider({ min = 0, max = 2000, defaultMinValue, defaultMaxValue, onChange }) {
  // Ensure we have valid initial values
  const initialMinValue = typeof defaultMinValue === "number" ? defaultMinValue : min
  const initialMaxValue = typeof defaultMaxValue === "number" ? defaultMaxValue : max

  const [minValue, setMinValue] = useState(initialMinValue)
  const [maxValue, setMaxValue] = useState(initialMaxValue)

  // Calculate percentages for the track fill
  const minPercentage = Math.max(0, Math.min(100, ((minValue - min) / (max - min)) * 100))
  const maxPercentage = Math.max(0, Math.min(100, ((maxValue - min) / (max - min)) * 100))

  useEffect(() => {
    if (onChange && typeof minValue === "number" && typeof maxValue === "number") {
      onChange({ min: minValue, max: maxValue })
    }
  }, [minValue, maxValue, onChange])

  // Handle slider changes
  const handleMinChange = (e) => {
    const newMinValue = Number(e.target.value)
    if (!isNaN(newMinValue) && newMinValue <= maxValue) {
      setMinValue(newMinValue)
    }
  }

  const handleMaxChange = (e) => {
    const newMaxValue = Number(e.target.value)
    if (!isNaN(newMaxValue) && newMaxValue >= minValue) {
      setMaxValue(newMaxValue)
    }
  }

  // Handle input box changes
  const handleMinInputChange = (e) => {
    const newMinValue = Number(e.target.value)
    if (!isNaN(newMinValue) && newMinValue <= maxValue) {
      setMinValue(newMinValue)
    }
  }

  const handleMaxInputChange = (e) => {
    const newMaxValue = Number(e.target.value)
    if (!isNaN(newMaxValue) && newMaxValue >= minValue) {
      setMaxValue(newMaxValue)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Custom range slider */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>

        {/* Track fill */}
        <div
          className="absolute h-1 bg-black rounded-full"
          style={{
            left: `${minPercentage}%`,
            right: `${100 - maxPercentage}%`,
            background: "black",
          }}
        ></div>

        {/* Min handle */}
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none"
        />

        {/* Max handle */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none"
        />
      </div>

      {/* Input boxes */}
      <div className="flex justify-between mt-4">
        <input
          type="text"
          value={minValue}
          onChange={handleMinInputChange}
          className="w-24 h-10 px-2 border border-gray-300 text-center"
        />
        <input
          type="text"
          value={maxValue}
          onChange={handleMaxInputChange}
          className="w-24 h-10 px-2 border border-gray-300 text-center"
        />
      </div>

      {/* Custom styling for range inputs */}
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
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: black;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  )
}

