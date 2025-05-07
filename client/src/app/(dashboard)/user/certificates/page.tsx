"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Download, FileText, Award, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useGetUserCertificatesQuery } from "@/state/redux"
import Loading from "@/components/Loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"


const CertificateView = () => {
  const router = useRouter()
  const userId = Cookies.get("userId") || null
  const [page, setPage] = useState(1)
  const limit = 9

  const {
    data: certificatesResponse,
    isLoading,
    error,
  } = useGetUserCertificatesQuery({ userId: userId ?? "", page, limit }, { skip: !userId })
  const certificatesData = certificatesResponse?.data
  const certificates = certificatesData?.certificates || []
  const total = certificatesData?.total || 0

  if (!userId) {
    router.push("/login")
    return null
  }

  if (isLoading) return <Loading />
  if (error) return <div className="text-center py-12 text-red-500">Error loading certificates</div>

  const handleDownload = (certificateUrl: string) => {
    window.open(certificateUrl, "_blank")
  }

  const totalPages = Math.ceil(total / limit)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[#3a3b44] hover:bg-[#32333c] text-white"
            onClick={() => router.push("/user/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">My Certificates</h1>
            <p className="text-[#9ca3af] mt-1">Your achievements and completed courses</p>
          </div>
          <Badge className="bg-secondary-700 text-white w-fit">
            <Award className="h-4 w-4 mr-2" />
            {total} Certificate{total !== 1 ? "s" : ""} Earned
          </Badge>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-[#2a2b34] rounded-lg border border-[#3a3b44] p-8 text-center">
          <Award className="h-12 w-12 text-[#3a3b44] mx-auto mb-4" />
          <p className="text-lg text-white mb-2">No certificates earned yet</p>
          <p className="text-sm text-[#9ca3af] mb-6">Complete courses to earn certificates</p>
          <Button
            className="bg-primary-700 hover:bg-primary-600 text-white"
            onClick={() => router.push("/user/courses")}
          >
            Browse Courses
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.certificateId}
                certificate={certificate}
                onDownload={() => handleDownload(certificate.certificateUrl)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="border-[#3a3b44] hover:bg-[#32333c] text-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={
                        page === pageNum
                          ? "bg-primary-700 hover:bg-primary-600 text-white"
                          : "border-[#3a3b44] hover:bg-[#32333c] text-white"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="border-[#3a3b44] hover:bg-[#32333c] text-white disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const CertificateCard = ({
  certificate,
  onDownload,
}: {
  certificate: Certificate
  onDownload: () => void
}) => (
  <Card className="bg-[#2a2b34] border-[#3a3b44] hover:border-[#4a4b54] transition-colors overflow-hidden">
    <div className="bg-[#32333c] p-4 border-b border-[#3a3b44]">
      <div className="flex items-center">
        <div className="bg-secondary-700 p-2 rounded-full mr-3">
          <Award className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-medium text-white line-clamp-1">{certificate.courseName}</h3>
      </div>
    </div>

    <CardContent className="p-5">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#9ca3af] mb-1">Certificate ID</p>
          <p className="text-sm text-white font-mono bg-[#1e1f26] p-2 rounded overflow-x-auto">
            {certificate.certificateId}
          </p>
        </div>

        <div>
          <p className="text-sm text-[#9ca3af] mb-1">Issued Date</p>
          <p className="text-sm text-white">
            {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Separator className="bg-[#3a3b44]" />

        <Button onClick={onDownload} className="w-full bg-primary-700 hover:bg-primary-600 text-white">
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>

        <Button
          variant="outline"
          className="w-full border-[#3a3b44] hover:bg-[#32333c] text-white"
          onClick={onDownload}
        >
          <FileText className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default CertificateView
