import Footer from "@/components/layout/Footer";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: "--roboto",
});
import Navbar from "@/components/layout/Header";
import { BookingContextProvider } from "@/context/BookingContext";
import { UrlSearchParamsProvider } from "@/context/UrlSearchParamsContext";

export const metadata = {
  title: "Street Lobby",
  description: "rent your room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
          <UrlSearchParamsProvider>
            <BookingContextProvider>
              <Navbar />
              {children}
            </BookingContextProvider>
          </UrlSearchParamsProvider>
        <Footer />
      </body>
    </html>
  );
}
