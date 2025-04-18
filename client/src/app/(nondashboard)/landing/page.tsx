import LandingClient from "@/components/LandingClient";

// Add export for static generation
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Landing() {
  
  let initialCourses = {
    courses: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/public`, {
      next: { revalidate: 60 }, // Use Next.js revalidation instead of cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch courses');

    const data = await response.json();
    initialCourses = data?.data || initialCourses;
  } catch (error) {
    console.error('Error fetching courses:', error);
  }

  return <LandingClient initialCourses={initialCourses} />;
}