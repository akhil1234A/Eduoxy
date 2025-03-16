"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCreateTransactionMutation } from "@/state/redux";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function CheckoutForm({ courseId, amount }: { courseId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [createTransaction] = useCreateTransactionMutation();
  const userId = Cookies.get("userId");

  useEffect(() => {
    if (stripe && elements) {
      setIsLoading(false);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !userId) {
      setErrorMessage("Payment initialization failed. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);
    const toastId = toast.loading("Processing payment...");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success/${courseId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message, { id: toastId });
        return;
      }

      if (paymentIntent.status === "succeeded") {
        await createTransaction({
          userId,
          courseId,
          transactionId: paymentIntent.id,
          amount,
          paymentProvider: "stripe",
        }).unwrap();

        toast.success("Payment successful!", { id: toastId });
        router.push(`/payment/success/${courseId}`);
      }
    } catch (error) {
      setErrorMessage("Payment failed. Please try again.");
      toast.error("Payment failed. Please try again.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p>Loading payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {errorMessage && (
        <div className="text-red-500 mt-4 text-sm">{errorMessage}</div>
      )}
      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full mt-4"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
} 