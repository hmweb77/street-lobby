import Image from 'next/image';
import Link from 'next/link';
import Logo from "../../../public/SL1.png";
import { Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#E6E6E6] py-6 px-3 md:px-12">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-6">
        <Image 
          src={Logo} 
          alt="logo" 
          width={100} 
          height={80}
        />
        <Link
          href="https://instagram.com"
          className="flex items-center text-gray-600 hover:underline text-sm"
        >
          <Instagram />
          <span className="ml-1">Instagram</span>
        </Link>
      </div>
    </footer>
  );
}

