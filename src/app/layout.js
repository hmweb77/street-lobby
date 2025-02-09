import Footer from "@/components/layout/Footer";
import "./globals.css";
import Navbar from "@/components/layout/Header";
import { BookingProvider } from '@/context/BookingContext'

export const metadata = {
  title: "Street Lobby",
  description: "rent your room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BookingProvider>
          <Navbar/>
          {children}
        </BookingProvider>
        <Footer/>
      </body>
    </html>
  );
}
