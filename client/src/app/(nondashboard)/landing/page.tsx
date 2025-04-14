import LandingClient from "@/components/LandingClient";

export default async function Landing() {
  let initialCourses = [];

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/public`, {
      cache: 'no-store', 
    });
    if (!response.ok) throw new Error('Failed to fetch courses');

    const data = await response.json();
    initialCourses = data?.data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
  }

  return <LandingClient initialCourses={initialCourses} />;
}