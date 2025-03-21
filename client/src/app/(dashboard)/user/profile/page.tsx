"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import { CustomFormField } from "@/components/CustomFormField";
import { useUpdateProfileMutation, useGetProfileQuery } from "@/state/api/userApi";
import { ProfileFormData, profileSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/Loading";

const ProfilePage = () => {
  const userId = Cookies.get("userId");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localProfileData, setLocalProfileData] = useState({
    name: "",
    title: "",
    bio: "",
    email: "",
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false); 

  const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery(
    userId || "",
    { skip: !userId }
  );
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      title: "",
      bio: "",
      profileImage: undefined,
    },
    mode: "onChange",
  });

  const { handleSubmit, reset, trigger } = methods;

  useEffect(() => {
    if (profileData?.data && !isProfileLoading) {
      const { name, title, bio, email, profileImage } = profileData.data;
      setLocalProfileData({
        name: name || "",
        title: title || "",
        bio: bio || "",
        email: email || "",
      });
      reset({
        name: name || "",
        title: title || "",
        bio: bio || "",
        profileImage: undefined,
      });
      setProfileImage(profileImage || null);
      setIsDataLoaded(true); 
    }
  }, [profileData, isProfileLoading, reset]);

  const handleImageChange = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        methods.setValue("profileImage", file, { shouldValidate: true });
        trigger("profileImage");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field: keyof ProfileFormData, value: string) => {
    setLocalProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    methods.setValue(field, value, { shouldValidate: true });
    trigger(field);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) {
      toast.error("Please sign in to update your profile.");
      return;
    }

    try {
      const result = await updateProfile({
        userId,
        name: data.name,
        title: data.title || undefined,
        bio: data.bio || undefined,
        profileImage: data.profileImage instanceof File ? data.profileImage : undefined,
      }).unwrap();

      toast.success(result.message);

      setLocalProfileData((prev) => ({
        ...prev,
        name: result.data.name || prev.name,
        title: result.data.title || prev.title,
        bio: result.data.bio || prev.bio,
      }));

      if (result.data.profileImage) {
        setProfileImage(result.data.profileImage);
      }

      reset({
        name: result.data.name || "",
        title: result.data.title || "",
        bio: result.data.bio || "",
        profileImage: undefined,
      });
    } catch (error: any) {
      toast.error(error.data?.message || "Something went wrong.");
    }
  };

  
  if (isProfileLoading || !isDataLoaded) {
    return (
      <div className="p-4 max-w-4xl">
        <Header title="User Profile" subtitle="View and update your professional details" />
        <div className="flex justify-center items-center h-64">
          <Loading /> 
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl">
      <Header title="User Profile" subtitle="View and update your professional details" />

      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {localProfileData.name || "Your Name"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <Image
                src={profileImage || "/p_img4.png"}
                alt="Profile"
                width={120}
                height={120}
                className="w-32 h-32 rounded-full object-cover border-2 border-blue-600"
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-lg font-medium">
                <span className="font-semibold">Title:</span>{" "}
                {localProfileData.title || "Not set"}
              </p>
              <p className="">
                <span className="font-semibold">Bio:</span>{" "}
                {localProfileData.bio || "No bio provided."}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Email:</span> {localProfileData.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <CustomFormField
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g., John Doe"
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
                <CustomFormField
                  name="title"
                  label="Title"
                  type="text"
                  placeholder="e.g., Senior React Developer"
                  onChange={(e) => handleFormChange("title", e.target.value)}
                />
                <CustomFormField
                  name="bio"
                  label="Bio"
                  type="text"
                  placeholder="e.g., Experienced developer with 10+ years..."
                  onChange={(e) => handleFormChange("bio", e.target.value)}
                />
                <CustomFormField
                  name="profileImage"
                  label="Profile Image"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleImageChange(file);
                  }}
                  disabled={isUpdating}
                />
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;