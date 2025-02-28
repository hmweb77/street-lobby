"use client"

import PageTitle from "@/components/PageTitle"
import { ChevronLeft } from "lucide-react"
import { useState } from "react"

export default function BookingProcessAccordion() {
  const [expandedItem, setExpandedItem] = useState(null)

  const toggleItem = (index) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  const bookingSteps = [
    {
      title: "1.Search",
      content: (
        <div className="mt-4 text-md">
          <p>
            On the landing page select the academic year that you would like to start your booking. Proceed to filter
            your search with specific requirements such as the period, location, type of room, monthly price, coliving
            capacity or vibes.
          </p>
          <p className="mt-2">
            Your search may show options for you to choose from, if not, try being flexible on any of your requirements
            to increase the chances.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="font-medium">1.1 Academic year</p>
              <p>
                It runs from September to the end of August of the following year. We make available the current
                academic year plus the following two. This translates into an availability for bookings of 3 years in
                the future.
              </p>
            </div>
            <div>
              <p className="font-medium">1.2 Period</p>
              <p>We have divided the academic year into 3 periods:</p>
              <p>1st Semester, from September until the end of January.</p>
              <p>2nd Semester, from February until the end of June.</p>
              <p>Summer, which consists of July and August.</p>
            </div>
            <div>
              <p className="font-medium">1.3 Location</p>
              <p>Choose from a list where we manage residences only.</p>
            </div>
            <div>
              <p className="font-medium">1.4 Type of room</p>
              <p>
                Choose if you are interested in a bunk bed, twin, single or double bedroom, a suite or any other option
                available. Notice that your selection might be related to price.
              </p>
            </div>
            <div>
              <p className="font-medium">1.5 Monthly price</p>
              <p>
                From our database of residences, you would be able to see the minimum and the maximum value for a room,
                allowing you to filter your search with your own minimum and maximum within.
              </p>
            </div>
            <div>
              <p className="font-medium">1.6 Coliving Capacity</p>
              <p>Refers to the total amount of people that can occupy a residence permanently.</p>
            </div>
            <div>
              <p className="font-medium">1.7 Vibes</p>
              <p>
                It can be a Master's students only, a surf house, or maybe an artist's residence, all depending on what
                is available on our database.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. Eligibility Check",
      content: (
        <div className="mt-4 text-md">
          <p>
            After selecting a room, and before the payment, we ask you to fill a form with your details. This will be
            compared to previous bookings in the same residence in order to match your profile to bookings alike,
            therefore your request will be accepted, or rejected if it's not among the range allowed. If you are the
            first booking in the residence, you will be the setpoint for the future bookings.
          </p>
          <p className="mt-2">
            We ask you to fill the form with your name, ID and permanent address, which are required for the issuance of
            the invoices and fulfilling national bureaucratic requests. We also ask your nationality, age, gender and
            academic or professional activity, in order to match your booking, accept or reject your request.
          </p>
        </div>
      ),
    },
    {
      title: "3.Payment",
      content: (
        <div className="mt-4 text-md">
          <p>
            After you have gone through the eligibility check, if your request is accepted, you will be able to pay a
            deposit for each booking equivalent to one month. This means, one deposit per period.
          </p>
          <div className="mt-2">
            <p className="font-medium">Example:</p>
            <p>
              I want to book a room for the 1st and 2nd semester, plus the summer. In other words, the whole academic
              year. The monthly fee for this room is 500€.
            </p>
            <p className="mt-2">
              To confirm this booking, I would have to pay a month in advance for each period. 3 times 500€ equals
              1500€.
            </p>
            <p className="mt-2">In September, until the 5th calendar day, the monthly fee has to be paid.</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8 min-h-screen">
      <PageTitle title={"HOW TO BOOK"} />
      
      <div className=" mb-10">
        <p className="text-base">
          We have designed a <strong>3 step booking process</strong>, which consists of a search
        </p>
        <p className="text-base">and selection, eligibility check, and payment.</p>
      </div>

      <div className="space-y-4">
        {bookingSteps.map((step, index) => (
          <div key={index} className="cursor-pointer" onClick={() => toggleItem(index)}>
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">{expandedItem === index ? "-" : "+"}</span>
              <p className="font-bold text-3xl">{step.title}</p>
            </div>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedItem === index ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {step.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

