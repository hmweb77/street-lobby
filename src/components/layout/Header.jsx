"use client"
import React, { useState } from 'react';
import { Menu, Bell, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: 'About', href: '/about' },
    { label: 'Our homes', href: '/about' },
    { label: 'How to book', href: '/howtobook' },
    { label: 'Rooms for rent', href: '/properties' },
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
            <div className="flex items-center  ">
              {/* Notification Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full pt-1 ">
                <Image
                width={20}
                height={10}
                src="/iconNotification.svg"

                />
                {/* <Bell className="w-6 h-6" /> */}
                <span className="absolute -top-1 -right-1 text-black text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  1
                </span>
              </button>

              {/* Menu Button */}
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-14 right-6 w-64  bg-white shadow-lg rounded-b-lg overflow-hidden">
            <div className="py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors border-t-[1px] border-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16"></div>

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;

