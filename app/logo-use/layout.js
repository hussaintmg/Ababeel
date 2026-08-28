/**
 * Server layout for /logo-use, so the page can have a title of its own.
 *
 * The page itself is a client component and cannot export metadata; a layout
 * can, and it is the only place that knows which route this is.
 */
import { pageMetadata } from "@/lib/cms/metadata";

export async function generateMetadata() {
  return pageMetadata("logo-use", "Logo Use Policy");
}

export default function Layout({ children }) {
  return children;
}
