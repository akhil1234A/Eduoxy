"use client";

import { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCreateTransactionMutation } from "@/state/redux";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

export default function CheckoutForm({ courseId, amount }: { courseId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [createTransaction] = useCreateTransactionMutation();
  const { userId } = useUser();

  useEffect(() => {
    const paymentChannel = new BroadcastChannel("payment_channel");

    paymentChannel.onmessage = (event) => {
      if (event.data.type === "payment_success" && event.data.courseId === courseId) {
        setIsProcessing(true);
        toast.success("Payment is completed, redirecting to course...");
        router.push(`/payment/success/${courseId}`);
      }
    };

    return () => paymentChannel.close();
  }, [courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !userId) {
      setErrorMessage("Payment setup failed. Please refresh the page.");
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
        toast.error(error.message || "Payment confirmation failed.", { id: toastId });
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
        const paymentChannel = new BroadcastChannel("payment_channel");
        paymentChannel.postMessage({ type: "payment_success", courseId });
        paymentChannel.close();
        router.push(`/payment/success/${courseId}`);
      }
    } catch (error) {
      const errorMessage = error as Error
      const errorMsg = errorMessage.message || "Payment failed. Please try again.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

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