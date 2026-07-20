import { webData } from "@/constants";

export const metadata = {
  title: `Page Not Available | ${webData.brand.name}`,
};

export default function SignUpLayout({ children }) {
  return <>{children}</>;
}
