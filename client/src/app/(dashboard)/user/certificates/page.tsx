"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Download, FileText } from "lucide-react";
import { useGetUserCertificatesQuery } from "@/state/redux";
import Loading from "@/components/Loading";

const CertificateView = () => {
  const router = useRouter();
  const userId = Cookies.get("userId") || null;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: certificatesResponse, isLoading, error } = useGetUserCertificatesQuery(
    { userId: userId ?? "", page, limit },
    { skip: !userId }
  );
  const certificatesData = certificatesResponse?.data;
  const certificates = certificatesData?.certificates || [];
  const total = certificatesData?.total || 0;

  if (!userId) {
    router.push("/login");
    return null;
  }

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading certificates</div>;

  const handleDownload = (certificateUrl: string) => {
    window.open(certificateUrl, "_blank");
  };

  const totalPages = Math.ceil(total / limit);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">My Certificates</h1>

      {certificates.length === 0 ? (
        <p className="text-gray-600">No certificates earned yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.certificateId}
              certificate={certificate}
              onDownload={() => handleDownload(certificate.certificateUrl)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const CertificateCard = ({
  certificate,
  onDownload,
}: {
  certificate: ICertificate;
  onDownload: () => void;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      <FileText className="h-8 w-8 text-blue-500 mr-2" />
      <h3 className="text-lg font-semibold">{certificate.courseName}</h3>
    </div>
    <p className="text-sm text-gray-600 mb-2">
      Certificate ID: {certificate.certificateId}
    </p>
    <p className="text-sm text-gray-600 mb-4">
      Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
    </p>
    <button
      onClick={onDownload}
      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      <Download className="h-5 w-5 mr-2" />
      Download Certificate
    </button>
  </div>
);

export default CertificateView;