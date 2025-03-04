import Image from 'next/image';
import Link from 'next/link';
import Logo from "../../../public/SL1.png"
import { Instagram } from "lucide-react"

export default function Footer() {
    return (
        <footer className="bg-[#E6E6E6] py-6 px-3 md:px-12">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Logo Section */}
                <div className="flex flex-col items-center md:items-start">
                        <Image 
                            src={Logo} 
                            alt="logo" 
                            width={100} 
                            height={80}
                        />
                   
                </div>
                
                {/* Quick Links and Company Info */}
                <div className="flex flex-col md:flex-row justify-center md:justify-between w-full md:w-auto">
                    <div className="mr-6">
                        <h3 className="font-semibold text-sm">Quick links</h3>
                        <ul className="text-gray-600 space-y-1.5 mt-2 text-sm">
                            <li><Link href="/rooms" className="hover:underline">Rooms for rent</Link></li>
                            <li><Link href="/properties" className="hover:underline">Our homes</Link></li>
                            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Company</h3>
                        <ul className="text-gray-600 space-y-1.5 mt-2 text-sm">
                            <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
                            <li><Link href="/about" className="hover:underline">About</Link></li>
                        </ul>
                    </div>
                </div>
                
                {/* Social Media */}
                <div className="flex flex-col items-center md:items-end">
                    <h3 className="font-semibold text-sm">Social media</h3>
                    <Link href="https://instagram.com" className="flex items-center mt-2 text-gray-600 hover:underline text-sm">
                    <Instagram />
                       <p className='ml-1'>Instagram</p> 
                    </Link>
                </div>
            </div>
        </footer>
    );
}
