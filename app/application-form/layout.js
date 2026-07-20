import { webData } from "@/constants";

export const metadata = {
  title: `Application Form | ${webData.brand.name}`,
  description:
    "Apply for our professional development and qualification programs.",
};

export default function ApplicationLayout({ children }) {
  return <>{children}</>;
}
