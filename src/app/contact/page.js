import { Phone, Instagram } from "lucide-react";

export default function ContactInfo() {
  return (
    <div className="min-h-screen">
      <div className=" my-10 flex justify-center">
        <h1 className="relative text-4xl  font-black mb-2 tracking-wide">
          <span className="absolute -right-1 text-[#4AE54A] z-0">CONTACT</span>
          <span className="relative text-black z-10">CONTACT</span>
        </h1>
      </div>
      <div className="max-w-md mx-auto p-6 font-sans">
        <div className="mb-6">
          <p className="font-medium">
            <span className="font-bold">Languages Spoken:</span> English,
            Spanish & Portuguese
          </p>
          <p className="font-medium">
            <span className="font-bold">Availability of Support:</span> 9am to
            6pm
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8">
            <Phone className="w-5 h-5" />
          </div>
          <span className="font-medium">+351 924109781</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            <Instagram className="w-5 h-5" />
          </div>
          <span className="font-medium">@streetlobbylisbon</span>
        </div>
      </div>
    </div>
  );
}
