import Footer from "@/components/layout/Footer";
import "./globals.css";
import Navbar from "@/components/layout/Header";
import { BookingFilterProvider } from "@/context/BookingFilterContext";
import { BookingContextProvider } from "@/context/BookingContext";
import { UrlSearchParamsProvider } from "@/context/UrlSearchParamsContext";

export const metadata = {
  title: "Street Lobby",
  description: "rent your room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BookingFilterProvider>
          <UrlSearchParamsProvider>
            <BookingContextProvider>
              <Navbar />
              {children}
            </BookingContextProvider>
          </UrlSearchParamsProvider>
        </BookingFilterProvider>
        <Footer />
      </body>
    </html>
  );
}
