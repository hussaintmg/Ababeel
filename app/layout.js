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
import { SiteContentProvider } from "@/context/SiteContentContext";
import MaintenanceGate from "@/Components/cms/MaintenanceGate";
import { getGlobalBundle } from "@/lib/cms";
import { pageMetadata } from "@/lib/cms/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



/**
 * The site-wide default.
 *
 * Only the home page and anything without a layout of its own lands here. Every
 * managed route has an `app/<route>/layout.js` that calls pageMetadata with its
 * own key — a layout cannot know which path it is rendering, and the header
 * this function used to read for that (`x-invoke-path`) is a Pages Router
 * internal the App Router never sends, so every page was inheriting the home
 * page's title.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  return pageMetadata("home", "Home");
}

export default async function RootLayout({ children }) {
  const { settings, customCss, faviconVersion } = await getGlobalBundle();
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('error', function(e) {
                  var msg = (e && e.message) ? String(e.message) : '';
                  var isChunkError = (
                    msg.indexOf('ChunkLoadError') !== -1 ||
                    msg.indexOf('Loading chunk') !== -1 ||
                    msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                    (e && e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') && e.target.src && e.target.src.indexOf('/_next/static/') !== -1)
                  );
                  if (isChunkError) {
                    var key = 'ababeel_chunk_retry_ts';
                    var last = sessionStorage.getItem(key);
                    var now = Date.now();
                    if (!last || (now - parseInt(last, 10)) > 6000) {
                      sessionStorage.setItem(key, String(now));
                      window.location.reload();
                    }
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SiteContentProvider
            initialSettings={settings}
            initialCss={customCss}
            initialFaviconVersion={faviconVersion}
          >
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
                        <MaintenanceGate>
                          <TopbarSidebarComponentWrapper />
                          {children}
                          <Footer />
                          <div className="fixed bottom-4 right-4 z-51">
                            <NotificationComponent />
                          </div>
                          <CookieBanner />
                        </MaintenanceGate>
                      </ContactProvider>
                    </ContactReferenceProvider>
                </InvoiceProvider>
              </NotificationsProvider>
          </PathProvider>
          </SiteContentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
