import Footer from "@/components/layout/Footer";
import "./globals.css";
import Navbar from "@/components/layout/Header";
import { BookingFilterProvider } from "@/context/BookingFilterContext";
import { BookingContextProvider } from "@/context/BookingContext";

export const metadata = {
  title: "Street Lobby",
  description: "rent your room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BookingFilterProvider>
          <BookingContextProvider>
            <Navbar />
            {children}
          </BookingContextProvider>
        </BookingFilterProvider>
        <Footer />
      </body>
    </html>
  );
}
