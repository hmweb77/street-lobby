"use client";
import PageTitle from "@/components/PageTitle";
import Link from "next/link";

const page = () => {
  return (
    <main className="px-4 py-8 max-w-7xl mx-auto">
      {/* <PageTitle title={"TERMS & CONDITIONS"} /> */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 bg-white">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Booking method:</h3>
            <p className="text-gray-600">
              By booking a semester, you are aware that the subsequent monthly rent owed, will be automatically debited from your credit card the 1st day of each month until the completion of the due period booked.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Cancellation Policy:</h3>
            <ul className="text-gray-600 space-y-1">
              <li>Full refund if at least 30 days prior to the check-in.</li>
              <li>Half refund if at least 15 days prior to the check-in.</li>
              <li>No refund if cancelled afterwards.</li>
            </ul>
            <p className="text-gray-600 mt-2">
              We will proceed to the cancellation of the automatic debits 24h after a written request to <a href="mailto:streetlobbylisbon@gmail.com" className="underline text-blue-600">streetlobbylisbon@gmail.com</a>
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Check-in:</h3>
            <p className="text-gray-600">from 1pm onwards</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Check-out:</h3>
            <p className="text-gray-600">until 11am sharp</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Early Check-in or Late Check-out:</h3>
            <p className="text-gray-600">
              We recommend the use of Airbnb and Bounce App. Our rooms are listed on Airbnb during July and August. If there are gaps within the academic year, we will also post the availability of the rooms on Airbnb.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Property Rules:</h3>
            <p className="text-gray-600">
              Parties of any kind, smoking, illegal substances, drugs, weapons, pets, loud communication or music, including loud speakers or high pitch voice, are not allowed.
            </p>
            <p className="text-gray-600">Silence hours: 22h to 7h</p>
            <p className="text-gray-600">
              You are not allowed to move the furniture provided in all the spaces of the residence. You shouldn’t retrieve it from your room nor the residence, or include foreign furniture.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Visitors:</h3>
            <p className="text-gray-600">
              The rooms are intended to be for one person only, unless allowed by the advertisement.
            </p>
            <p className="text-gray-600">
              Additional guests inside the room are not allowed. Nevertheless, there can be visitors paying an extra fee of 20€/night and shouldn't overlap other visitors at the same time. Notify in advance and reserve the dates.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Penalty:</h3>
            <p className="text-gray-600">
              If the tenant does not follow the rules of the house and Street Lobby receives complaints from the neighbors, police or others then he/she will be warned. If it persists, he/she will be asked for a penalty of 30€ each time the situation happens.
            </p>
            <p className="text-gray-600">
              Lost items or damages to the property, will have to be paid in order to be replaced.
            </p>
            <p className="text-gray-600">
              If any of the above are not paid before the last automatic debit, we will cancel your booking and block access to the property for the last month of your stay unless you decide to fully pay.
            </p>
            <p className="text-gray-600">
              We may cancel your booking immediately if the penalties exceed the number of 5.
            </p>
            <p className="text-gray-600">
              Extreme and unethical behavior from the tenant could be enough motive to cancel the contract at any time, giving a maximum tolerance of 5 days to pack and organize the departure.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Shared Items:</h3>
            <p className="text-gray-600">
              Dish soap, hand soap, shower gel and toilet paper are shared and provided by Street Lobby. It will be replenished during the weekly cleaning and can’t exceed a normal use.
            </p>
            <p className="text-gray-600">
              Example: 2 toilet paper rolls/tenant per week; 250ml of dish soap, hand soap and shower gel per week for each item. Beyond this, the tenants should self-replenish the resources provided.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Health and Safety:</h3>
            <p className="text-gray-600">
              The tenant should have health insurance or be eligible to use the national health service.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Local/Legal Requirements:</h3>
            <p className="text-gray-600">
              This is a service provided under the Decree Law No. 128/2014, of August 29, which determines the legal terms for local lodging in Portugal. We provide temporary lodging services, and it is not considered a hotel.
            </p>
          </div>
        </div>

        <div className="flex justify-center my-12">
          <Link href="/residences">
            <button className="bg-black text-white rounded-full px-8 py-2 text-sm">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default page;
