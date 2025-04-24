// app/businessrecords/new/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import BusinessRecordForm from "@/app/components/BusinessRecordForm";
import Topbar from "@/app/components/Topbar";
import NavBar from "@/app/components/NavBar";

export default function NewRecordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract initial values from URL
  const barangay = searchParams.get("barangay") ?? "";
  const applicantName = searchParams.get("applicantName") ?? "";
  const applicantAddress = searchParams.get("applicantAddress") ?? "";
  const businessName = searchParams.get("businessName") ?? "";

  // After a successful create, go back to the listing for this barangay
  const handleSuccess = () => {
    if (barangay) {
      router.push(`/businessrecord?barangay=${encodeURIComponent(barangay)}`);
    } else {
      router.push("/businessrecord");
    }
  };

  return (
    <div>
      <Topbar />
      <NavBar />
    <div className="w-[95%] mx-auto my-8">
      
      <BusinessRecordForm
        mode="create"
        initialApplicantName={applicantName}
        initialApplicantAddress={applicantAddress}
        initialBusinessName={businessName}
        initialBarangay={barangay} // ✅ Pass the selected barangay
        onSubmitSuccess={handleSuccess}
      />
    </div>
    </div>
  );
}
