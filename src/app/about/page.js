"use client";
import PageTitle from "@/components/PageTitle";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { IoHomeOutline } from "react-icons/io5";

function page() {
  const router = useRouter();
  const handleKeepBooking = () => {
    router.push("/");
  };
  return (
    <main className="px-4 py-8 max-w-7xl mx-auto">
      <PageTitle title={"ABOUT"} />

      <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
        <div className="space-y-4">
          <p className="text-md">
            <span className="font-bold">Street Lobby</span> was born in 2016 as
            a lodging service, intended to combine fun and autonomy while
            booking a room in Lisbon. Our purpose is to provide the best
            possible accommodation experience in our residences, while studying,
            working or simply wandering the city. Currently available in Lisbon
            and Caparica.
          </p>

          <p className="text-md">
            <span className="font-bold">Our model allows bookings</span> from
            people with similar motivations, which are mostly academic or during
            the early years of professional development. It also prevents fast
            rotation of guests, therefore, improving the coliving experience.
          </p>

          <div className="my-24 md:mx-32">
            <div className="bg-black text-white rounded-xl my-8 flex flex-col md:flex-row gap-5 px-5 md:px-16 lg:px-20 py-4 md:py-8 items-center">
              <div className="mr-4">
                <IoHomeOutline className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-sm text-center md:text-left">
                You can book a room, or in the case you are a group of friends
                or family, you can book an entire residence.
              </div>
            </div>
          </div>

          <p className="text-md">
            <span className="font-bold">
              We use TTlock App to control the door opening system,
            </span>{" "}
            which means that you can open the door with your cellphone or with a
            code, replacing the physical key, giving you more freedom during
            your check in and less responsibilities.
          </p>

          <p className="text-md">
            <span className="font-bold">
              We provide weekly cleanings to the residences,
            </span>{" "}
            we also manage the expenses and utilities so you don't have to
            bother. Bed linen and towels are also provided.
          </p>

          <p className="text-md">
            <span className="font-bold">
              It will be a pleasure to welcome you and recommend the best local
              tips of the city and the beach.
            </span>
          </p>
        </div>
      </div>
      <div className="flex justify-center my-12">
        <button
          onClick={handleKeepBooking}
          className="bg-black text-white rounded-full px-8 py-2 text-sm"
        >
          Book Now
        </button>
      </div>
    </main>
  );
}

export default page;
