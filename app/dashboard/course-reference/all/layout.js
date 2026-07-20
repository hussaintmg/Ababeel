import { webData } from "@/constants";

export const metadata = {
  title: `All Course References | Dashboard | ${webData.brand.name}`,
};

export default function Layout({ children }) {
  return <>{children}</>;
}
