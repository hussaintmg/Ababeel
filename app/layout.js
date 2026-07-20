import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import TopbarSidebarComponentWrapper from "@/Components/TopbarSidebarComponentWrapper";
import Footer from "@/Components/Footer";
import { PathProvider } from "@/context/PathContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import NotificationComponent from "@/Components/NotificationComponent";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { ContactProvider } from "@/context/ContactContext";
import { ContactReferenceProvider } from "@/context/ContactReferenceContext";
import CookieBanner from "@/Components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Complete Title mapping for all your routes
const getPageTitle = (pathname) => {
  const titleMap = {
    // Public Pages
    "/": "Home",
    "/about-us": "About Us",
    "/contact-us": "Contact Us",
    "/FAQs": "FAQs",
    "/forgot-password": "Forgot Password",
    "/glossary-of-terms": "Glossary of Terms",
    "/logo-use": "Logo Use Policy",
    "/partner": "Page Not Available",
    "/privacy-policy": "Privacy Policy",
    "/professional-dev": "Professional Development",
    "/profile": "Profile",
    "/qualification": "Qualifications",
    "/refund-policy": "Refund Policy",
    "/terms-of-services": "Terms of Service",
    "/verify-certificate": "Verify Certificate",
    "/verify-email": "Verify Email",

    "/login": "Login",
    "/reset-password": "Reset Password",
    "/send-email": "Email Verification",

    "/dashboard": "Dashboard",
    "/admin": "Admin Dashboard",
    "/owner": "Owner Dashboard",

    "/dashboard/course-reference/new": "New Course reference | Dashboard",
    "/dashboard/course-reference/all": "All Course reference | Dashboard",
    "/dashboard/courses/create": "Create Courses | Dashboard",
    "/dashboard/courses/all": "All Courses | Dashboard",

    "/admin/organizations": "Organizations | Admin Dashboard",
    "/admin/default-course/new": "New Default Courses | Admin Dashboard",
    "/admin/default-course/all": "All Default Courses | Admin Dashboard",
    "/admin/enquiries": "Enquiries | Admin Dashboard",

    "/owner/organizations": "Organizations | Owner Dashboard",
    "/owner/users": "Users | Owner Dashboard",
    "/owner/default-course/new": "New Default Courses | Owner Dashboard",
    "/owner/default-course/all": "All Default Courses | Owner Dashboard",
    "/owner/enquiries": "Enquiries | Owner Dashboard",
  };

  // Check for exact match first
  if (titleMap[pathname]) {
    return titleMap[pathname];
  }

  // Check for dynamic routes
  for (const [route, title] of Object.entries(titleMap)) {
    if (pathname.startsWith(route) && route !== "/") {
      // Handle dynamic routes
      if (route.includes(":path*")) {
        const baseRoute = route.replace("/:path*", "");
        if (pathname.startsWith(baseRoute)) {
          return title;
        }
      } else {
        return title;
      }
    }
  }

  // Handle specific dynamic patterns
  if (pathname.startsWith("/qualification/")) {
    return "Qualifications";
  }

  if (pathname.startsWith("/professional-dev/")) {
    return "Professional Development";
  }

  if (pathname.startsWith("/dashboard/")) {
    return "Dashboard";
  }

  if (pathname.startsWith("/admin/")) {
    return "Admin Dashboard";
  }

  if (pathname.startsWith("/owner/")) {
    return "Owner Dashboard";
  }

  // Extract title from pathname for unknown routes
  if (pathname !== "/") {
    const segments = pathname.split("/").filter((segment) => segment);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      const formattedTitle = lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return formattedTitle;
    }
  }

  return "Ababeel";
};

export async function generateMetadata() {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || "/";
    const pageTitle = getPageTitle(pathname);

    return {
      title: `${pageTitle} | Ababeel`,
      description: "Your safety technology partner",
    };
  } catch (error) {
    return {
      title: "Ababeel | Safety Technology Solutions",
      description: "Your safety technology partner",
    };
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
          integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PathProvider>
              <NotificationsProvider>
                <InvoiceProvider>
                    <ContactReferenceProvider>
                      <ContactProvider>
                        <ToastContainer
                          position="top-right"
                          autoClose={3000}
                          hideProgressBar={false}
                          newestOnTop={false}
                          closeOnClick
                          pauseOnHover
                          theme="dark"
                        />
                        <TopbarSidebarComponentWrapper />
                        {children}
                        <Footer />
                        <div className="fixed bottom-4 right-4 z-51">
                          <NotificationComponent />
                        </div>
                        <CookieBanner />
                      </ContactProvider>
                    </ContactReferenceProvider>
                </InvoiceProvider>
              </NotificationsProvider>
          </PathProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
