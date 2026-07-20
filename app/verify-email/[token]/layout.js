import { Suspense } from "react";

export default function VerifyEmailLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}
