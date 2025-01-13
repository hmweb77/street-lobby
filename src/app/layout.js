
import "./globals.css";
import Navbar from "@/components/layout/Header";



export const metadata = {
  title: "Street Lobby",
  description: "rent your room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar/>
        {children}
      </body>
    </html>
  );
}
