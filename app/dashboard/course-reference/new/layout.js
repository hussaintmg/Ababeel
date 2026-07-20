import { webData } from "@/constants";

export const metadata = {
  title: `New Course Reference | Dashboard | ${webData.brand.name}`,
};

export default function Layout({ children }) {
  return <>{children}</>;
}
