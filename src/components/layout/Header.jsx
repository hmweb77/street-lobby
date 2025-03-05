"use client";
import React, { useState, useEffect } from "react";
import { Menu, Bell, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useBookingState } from "@/context/BookingContext";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const { state } = useBookingState();
  const bookingCount = state.bookingPeriods.length;
  const pathname = usePathname()

  useEffect(() => {
    if (bookingCount > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [bookingCount]);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Residences", href: "/residences" },
    { label: "How to book", href: "/howtobook" },
    { label: "Rooms for rent", href: "/rooms" },
    { label: "Terms & conditions", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16 border-b border-gray-100">
            {/* Mobile Menu Button (Left) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <X className="w-6 h-6 transition-transform rotate-90" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo (Centered on mobile) */}
            <Link
              href="/"
              className=""
            >
              <Image
                width={50}
                height={50}
                src="/SL - black & white 1.svg"
                alt="Logo"
                className="w-16 h-16 rounded-full"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:block">
              <ul className="flex items-center space-x-6">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "text-green-400"
                          : "text-black hover:text-gray-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <Link
                href="/booking-summary"
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <Image
                  width={20}
                  height={20}
                  src="/iconNotification.svg"
                  alt="Notifications"
                  className="transition-transform hover:scale-110"
                />
                {bookingCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center 
                      font-medium bg-red-500 text-white ${
                        bounce ? "animate-bounce" : "animate-pulse"
                      } transition-all`}
                    key={bookingCount}
                  >
                    {bookingCount}
                  </span>
                )}
              </Link>

              {/* <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? (
                  <X className="w-6 h-6 transition-transform rotate-90" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button> */}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="absolute top-14 left-6 w-64 bg-white shadow-lg rounded-b-lg overflow-hidden animate-slideDown md:hidden">
            <div className="py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors border-t border-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-16"></div>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 animate-fadeIn md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;
