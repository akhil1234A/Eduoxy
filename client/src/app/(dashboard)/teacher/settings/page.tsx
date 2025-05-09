"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import { CustomFormField } from "@/components/CustomFormField";
import { useUpdatePasswordMutation } from "@/state/api/userApi"; 
import { PasswordFormData , passwordUpdateSchema} from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";


const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [updatePassword] = useUpdatePasswordMutation(); 
  const methods = useForm<PasswordFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);

    const userId = Cookies.get("userId") || localStorage.getItem("userId");
    if (!userId) {
      toast.error("Please sign in to update your password.");
      setLoading(false);
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      setLoading(false);
      return;
    }

    try {
      const result = await updatePassword({
        userId,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap(); 

      toast.success(result.message || "Password updated successfully!");
      methods.reset();
    } catch (error) {
      const errorMessage = error as Error
      toast.error(errorMessage.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-settings p-4 max-w-4xl">
      <Header title="Settings" subtitle="Manage your account preferences" />
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="notification-settings__form"
        >
          <div className="notification-settings__fields space-y-6">
            <CustomFormField
              name="currentPassword"
              label="Current Password"
              type="password"
            
            />
            <CustomFormField
              name="newPassword"
              label="New Password"
              type="password"
          
            />
            <CustomFormField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
       
            />
          </div>
          <Button
            type="submit"
            className="notification-settings__submit bg-blue-600 hover:bg-blue-700 text-white mt-6"
            disabled={loading}
          >
            {loading ? "Saving..." : "Update Password"}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export default SettingsPage;