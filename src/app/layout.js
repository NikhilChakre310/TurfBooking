import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "The MatchPoint - Premium Turf Booking",
  description: "Book football, cricket fields and pickleball courts at The MatchPoint. Premium sports facility booking portal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "The MatchPoint",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <head>
        {/* Razorpay checkout script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        {/* Mobile web app capable tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/images/logo_icon.png" />
      </head>
      <body className="font-sans min-h-screen flex flex-col antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
