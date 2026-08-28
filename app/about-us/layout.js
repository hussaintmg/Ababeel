/**
 * Server layout for /about-us, so the page can have a title of its own.
 *
 * The page itself is a client component and cannot export metadata; a layout
 * can, and it is the only place that knows which route this is.
 */
import { pageMetadata } from "@/lib/cms/metadata";

export async function generateMetadata() {
  return pageMetadata("about-us", "About Us");
}

export default function Layout({ children }) {
  return children;
}
