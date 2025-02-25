"use client"
import React, { useState, useEffect } from 'react';
import { Menu, Bell, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useBookingState } from '@/context/BookingContext'; // Import your booking context

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const { state } = useBookingState();
  const bookingCount = state.bookingPeriods.length;

  // Animation trigger
  useEffect(() => {
    if (bookingCount > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [bookingCount]);

  const menuItems = [
    { label: 'About', href: '/about' },
    { label: 'Our homes', href: '/about' },
    { label: 'How to book', href: '/howtobook' },
    { label: 'Rooms for rent', href: '/rooms' },
    { label: 'Terms & conditions', href: '/terms' },
    { label: 'Contact', href: '/about' }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white z-50 ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16 border-b border-gray-100">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                width={50}
                height={50} 
                src="/SL - black & white 1.svg" 
                alt="Logo"
                className="w-16 h-16 rounded-full"
              />
            </Link>

            {/* Right side icons */}
            <div className="flex items-center gap-2">
              {/* Notification Bell with Booking Count */}
              <Link href="/booking-summary" className="relative p-2 hover:bg-gray-100 rounded-full">
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
                        bounce ? 'animate-bounce' : 'animate-pulse'
                      } transition-all`}
                    key={bookingCount}
                  >
                    {bookingCount}
                  </span>
                )}
              </Link>

              {/* Menu Button */}
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? (
                  <X className="w-6 h-6 transition-transform rotate-90" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-14 right-6 w-64 bg-white shadow-lg rounded-b-lg overflow-hidden animate-slideDown">
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
          className="fixed inset-0 bg-black bg-opacity-20 z-40 animate-fadeIn"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;