import PageSkeleton from "@/Components/cms/PageSkeleton";

/**
 * Route-level loading state for every public page.
 *
 * While a server-rendered page is still fetching (first paint or a client
 * navigation), Next.js shows this in the page area — the topbar and footer
 * live in the layout so they stay put, and the visitor sees an intentional
 * shimmer instead of a blank region. Routes with their own loading.jsx
 * (the dashboards) override it.
 */
export default function Loading() {
  return <PageSkeleton />;
}
