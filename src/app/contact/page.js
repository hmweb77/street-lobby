"use client";
import PageTitle from "@/components/PageTitle";
import { Phone, Instagram } from "lucide-react";

export default function ContactInfo() {
  return (
    <div className="min-h-screen">
      <PageTitle title={"Contact"} />
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

        <a
          href="tel:+351924109781"
          className="flex items-center gap-3 mb-4 hover:opacity-70 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8">
            <Phone className="w-5 h-5" />
          </div>
          <span className="font-medium">+351 924109781</span>
        </a>

        <a
          href="https://instagram.com/streetlobbylisbon"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8">
            <Instagram className="w-5 h-5" />
          </div>
          <span className="font-medium">@streetlobbylisbon</span>
        </a>
      </div>
    </div>
  );
}
