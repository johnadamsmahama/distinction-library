import { Suspense } from "react";
import VerifyClient from "./verify-client";

export default function VerifyOrderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, textAlign: "center" }}>
          <p>Checking your payment...</p>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
