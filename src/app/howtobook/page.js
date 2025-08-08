"use client";

import PageTitle from "@/components/PageTitle";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

export default function BookingProcessAccordion() {
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleItem = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const bookingSteps = [
    {
      title: "Selection",
      content: (
        <div className="mt-4 text-md">
          <p>
          On the landing page select the academic year that you would like to start your booking. 
          </p>
          <p className="mt-2">
          Proceed to filter your search with specific requirements such as the period, location, type of room, monthly price, coliving capacity and typology.
          </p>
          <p className="mt-2">
          If your search shows no matches, try being flexible on any of your requirements.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="font-extrabold text-xl">Academic year</p>
              <p>
              It runs from September to the end of August of the following year. The availability for bookings is from the present until 3 years in the future.
              </p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Period</p>
              <p>We have divided the academic year into 4 periods:</p>
              <p>1st Semester, from September 1st to January 31st.</p>
              <p>2nd Semester, from February 1st to June 30th.</p>
              <p>July and August.</p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Location</p>
              <p>It will show a list of the areas where we manage residences.</p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Type of room</p>
              <p>
              Choose from a bunk bed, twin beds, single or double bedroom, a suite or any other option available. Notice that your selection might be related to price.
              </p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Monthly price</p>
              <p>
              Limit your range according to your budget.
              </p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Coliving Capacity</p>
              <p>
              The total amount of people that can occupy a residence at the same time, including you.
              </p>
            </div>
            <div>
              <p className="font-extrabold text-xl">Typology</p>
              <p>
              It can be a Master's students only, a surf house, or maybe an artist's residence, all depending on what is available on our database.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Eligibility Check",
      content: (
        <div className="mt-4 text-md">
          <p>
          After selecting a room, and before the payment, we ask you to fill a form with your details. 
          </p>
          <p className="mt-2">
          This will be compared to previous bookings in the same residence in order to match your profile, therefore, your request will be accepted or rejected.
          </p>
          <p className="mt-2">
          If you are the first booking in the residence, you will be the setpoint for future bookings.
          </p>
          <p className="mt-2">
          The details required are: nationality, age, gender and current profession.
Additional details are: name, ID, permanent address and e-mail address, which are required for the issuance of the invoices and fulfilling national bureaucracy.

          </p>
        </div>
      ),
    },
    {
      title: "Payment",
      content: (
        <div className="mt-4 text-md">
          <p>
          Once your request is accepted, you will be able to pay a deposit for each booking equivalent to one month. This means, one deposit per period booked.
          </p>
          <div className="mt-2">
            <p className="font-extrabold text-xl">Example:</p>
            <p>
            You want to book a room for the 1st and 2nd semesters, a total of 10 months.
The monthly rent for this room is 500€. 

            </p>
            <p className="mt-2">
            To confirm this booking, you would have to pay a month in advance for each period. 
(2 times 500€ equals 1000€)

            </p>
            <p className="mt-2">
            You will get a confirmation e-mail with the following steps for checking in.
            </p>
            <p className="mt-2">
            Automatically, the rent will be debited on the 1st day of each month, starting the day of the check in, during the remaining 8 months.
            </p>
          </div>
        </div>
      ),
    },
    
  ];

  return (
    <main className="px-4 py-8 max-w-7xl mx-auto">
      {/* <PageTitle title={"HOW TO BOOK"} /> */}
      <div className="max-w-2xl mx-auto p-8 min-h-screen">
        <div className=" mb-10">
          <p className="text-base">
            We have designed a <strong>3 step booking process</strong>, which
            consists of a search
          </p>
          <p className="text-base">
            and selection, eligibility check, and payment.
          </p>
        </div>

        <div className="space-y-4">
          {bookingSteps.map((step, index) => (
            <div
              key={index}
              className="cursor-pointer"
              onClick={() => toggleItem(index)}
            >
              <div className="flex items-center gap-2">
                <span className="text-base ">
                  {expandedItem === index ? "-" : "+"}
                </span>
                <p className="font-bold text-3xl">{step.title}</p>
              </div>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedItem === index
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                {step.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
