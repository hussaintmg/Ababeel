import { webData } from "@/constants";

export const metadata = {
  title: `Page Not Available | ${webData.brand.name}`,
};

export default function PartnerLayout({ children }) {
  return <>{children}</>;
}
