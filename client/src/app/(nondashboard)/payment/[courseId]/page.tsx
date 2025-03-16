"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { useGetCourseQuery } from "@/state/redux";
import { useCreatePaymentIntentMutation } from "@/state/redux";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";

// Initialize Stripe outside the component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PaymentPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const [clientSecret, setClientSecret] = useState<string>();
  
  const { data: courseData, isLoading: courseLoading } = useGetCourseQuery(courseId);
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  
  const course = courseData?.data;

  useEffect(() => {
    const initializePayment = async () => {
      if (course?.price) {
        try {
          const result = await createPaymentIntent({ amount: course.price }).unwrap();
          setClientSecret(result.data.clientSecret);
        } catch (error) {
          console.error("Error creating payment intent:", error);
        }
      }
    };

    initializePayment();
  }, [course?.price, createPaymentIntent]);

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
      theme: 'night',
      variables: {
        colorPrimary: '#6366F1',
        colorBackground: '#1B1C22',
        colorText: '#FFFFFF',
        colorDanger: '#EF4444',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
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
        <CheckoutForm courseId={courseId} amount={course.price} />
      </Elements>
    </div>
  );
};

export default PaymentPage;