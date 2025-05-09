"use client";
import PageTitle from "@/components/PageTitle";
import Link from "next/link";

const page = () => {
  return (
    <main className="px-4 py-8 max-w-7xl mx-auto">
      <PageTitle title={"TERMS & CONDITIONS"} />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 bg-white">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Booking method:</h3>
            <p className="text-gray-600">Credit Card, Revolut</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Cancellation Policy:</h3>
            <ul className="text-gray-600 space-y-1">
              <li>Full refund if at least 30 days prior to the check-in.</li>
              <li>Half refund if at least 15 days prior to the check-in.</li>
              <li>No refund if cancelled afterwards.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Check-in:</h3>
            <p className="text-gray-600">from 1pm onwards</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Check-out:</h3>
            <p className="text-gray-600">until 11am sharp</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Early Check-in or Late Check-out:</h3>
            <p className="text-gray-600">Bounce App</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Property Rules:</h3>
            <p className="text-gray-600">
              We do not welcome: Parties of any kind, smoking, illegal
              substances, drugs, weapons, pets.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Visitors:</h3>
            <p className="text-gray-600">
              Additional guests inside the room are not allowed. Nevertheless,
              there can be visitors paying an extra fee of 15€/night and
              shouldn't overlap other visitors at the same time. Notify and
              reserve the dates.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-gray-600">
              The rooms are intended to be for one person only, unless allowed
              by the advertisement.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Penalty:</h3>
            <p className="text-gray-600">
              If the tenant does not follow the rules of the house and Street
              Lobby receives complaints from the neighbors, police or others
              then he/she will be warned. If it persists, he/she will be debited
              a penalty of 30€ from the deposit each time the situation happens.
              Extreme and unethical behavior from the tenant could be enough
              motive to cancel the contract, giving a maximum tolerance of 5
              days to pack and organize the departure.
            </p>
            <p className="text-gray-600">
              When the penalty to be deducted from the deposit is above 30%, the
              tenant will be asked to make the payment of the due amount
              together with the following monthly fee.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Shared items:</h3>
            <p className="text-gray-600">
              When booking a room, the kitchen, toilet and cleaning products,
              such as soap and toilet paper, are shared and provided by Street
              Lobby. Unless agreed with your flatmates, food, cleaning and
              hygiene products are not shared.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Health and Safety:</h3>
            <p className="text-gray-600">
              The tenant should have health insurance or be eligible to use the
              national health service.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Local/Legal Requirements:</h3>
            <p className="text-gray-600">
              Service provided under the Decree Law No. 128/2014, of August 29,
              which determines the legal terms for local lodging in Portugal. We
              provide temporary lodging services, and it is not considered a
              hotel. Due to this law, it is required from the guest to pay a
              tourist fee which is 2€/night, until 7 nights to the city Council.
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
