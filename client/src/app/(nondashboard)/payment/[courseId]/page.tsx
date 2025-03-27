"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useGetCourseQuery, useCreatePaymentIntentMutation } from "@/state/redux";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { lazy, Suspense, useEffect, useState } from "react";
import Cookies from "js-cookie";

const CheckoutForm = lazy(() => import("./CheckoutForm"));

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PaymentPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const userId = Cookies.get("userId");
  const [clientSecret, setClientSecret] = useState<string>();
  const { data: courseData, isLoading: courseLoading } = useGetCourseQuery(courseId);
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const course = courseData?.data;

  useEffect(() => {
    const initializePaymentIntent = async () => {
      if (!userId || !course?.price) return;

      try {
        const paymentIntentResponse = await createPaymentIntent({
          amount: course.price,
          userId,
          courseId,
        }).unwrap();
        setClientSecret(paymentIntentResponse.data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
      }
    };

    initializePaymentIntent();
  }, [course?.price, userId, courseId, createPaymentIntent]);

  if (courseLoading || !clientSecret) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p>Course not found</p>
      </div>
    );
  }

  const options = {
    clientSecret, 
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#6366F1",
        colorBackground: "#1B1C22",
        colorText: "#FFFFFF",
        colorDanger: "#EF4444",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
    },
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>
      <div className="bg-customgreys-darkGrey p-6 rounded-lg mb-6">
        <h2 className="text-xl mb-4">Order Summary</h2>
        <div className="flex justify-between mb-4">
          <span>{course.title}</span>
          <span>₹{course.price}</span>
        </div>
        <div className="border-t border-gray-600 pt-4">
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold">₹{course.price}</span>
          </div>
        </div>
      </div>
      <Elements stripe={stripePromise} options={options}>
        <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center"><Loading /></div>}>
          <CheckoutForm courseId={courseId} amount={course.price} />
        </Suspense>
      </Elements>
    </div>
  );
};

export default PaymentPage;