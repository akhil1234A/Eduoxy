"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { courseSchema, CourseFormData } from '@/lib/schema';
import { createCourseFormData, uploadAllVideos, updateS3Resource } from '@/lib/utils';
import { useCreateCourseMutation } from '@/state/api/coursesApi';
import { openSectionModal, setSections, setCourseId } from '@/state';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CustomFormField } from '@/components/CustomFormField';
import Header from '@/components/Header';
import DroppableComponent from '@/components/Droppable';
import SectionModal from '@/components/SectionModal';
import ChapterModal from '@/components/ChapterModal';
import Image from 'next/image';
import { Upload, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';


const CourseCreator = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createCourse] = useCreateCourseMutation();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);
  const sections = useAppSelector((state) => state.global.courseEditor.sections) || [];
  const { userId, userName } = useUser();


  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: '',
      courseDescription: '',
      courseCategory: '',
      coursePrice: '0',
      courseStatus: 'Draft',
      courseImage: '',
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    methods.setValue('courseImage', file);

    setIsUploading(true);
    try {
      const { publicUrl, key } = await updateS3Resource('', file, 'image');
      methods.setValue('courseImage', publicUrl);
      setImagePreview(publicUrl);
      setUploadedKeys((prev) => [...prev, key]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      methods.setValue('courseImage', '');
      setImagePreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const cleanupUploadedFiles = async () => {
    for (const key of uploadedKeys) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        if (response.ok) {
          console.log(`Cleaned up orphaned file: ${key}`);
        } else {
          console.error(`Failed to clean up: ${key}`);
        }
      } catch (error) {
        console.error(`Error cleaning up ${key}:`, error);
      }
    }
    setUploadedKeys([]);
  };

  const handleCancel = () => {
    cleanupUploadedFiles();
    router.push('/teacher/courses', { scroll: false });
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!userId || !userName) {
      toast.error('Please sign in to create a course');
      return;
    }

    if (isUploading) {
      toast.error('Please wait for the image to finish uploading');
      return;
    }

    try {
      toast.loading('Uploading videos and creating course...');
      const updatedSections = await uploadAllVideos(sections);
      const formData = await createCourseFormData(
        {
          ...data,
          courseImage: data.courseImage || '',
          courseStatus: data.courseStatus,
        },
        updatedSections
      );
      formData.append('teacherId', userId);
      formData.append('teacherName', userName);

     
      await createCourse(formData).unwrap();
      toast.dismiss();
      toast.success('Course created successfully!');
      setUploadedKeys([]);
      dispatch(setSections([]));
      dispatch(setCourseId(''));
      router.push(`/teacher/courses`, { scroll: false });
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.dismiss();
      toast.error('Failed to create course');
      await cleanupUploadedFiles();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-5 mb-5">
        <button
          className="flex items-center border border-customgreys-dirtyGrey rounded-lg p-2 gap-2 cursor-pointer hover:bg-customgreys-dirtyGrey hover:text-white-100 text-customgreys-dirtyGrey"
          onClick={handleCancel}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>
      </div>

      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Header
            title="Create New Course"
            subtitle="Complete all fields to create your course"
            rightElement={
              <div className="flex items-center space-x-4">
                <CustomFormField
                  name="courseStatus"
                  label={methods.watch('courseStatus') === 'Published' ? 'Published' : 'Draft'}
                  type="switch"
                  className="flex items-center space-x-2"
                  labelClassName={`text-sm font-medium ${
                    methods.watch('courseStatus') === 'Published' ? 'text-green-500' : 'text-yellow-500'
                  }`}
                  inputClassName="data-[state=checked]:bg-green-500"
                />
                <Button
                  type="submit"
                  className="bg-primary-700 hover:bg-primary-600"
                >
                  {methods.watch('courseStatus') === 'Published' ? 'Publish Course' : 'Save Draft'}
                </Button>
              </div>
            }
          />

          <div className="flex justify-between md:flex-row flex-col gap-10 mt-5 font-dm-sans">
            <div className="basis-1/2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-customgreys-dirtyGrey">
                    Course Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="course-image"
                    />
                    <label
                      htmlFor="course-image"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-customgreys-dirtyGrey rounded-lg cursor-pointer hover:bg-customgreys-darkGrey"
                    >
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Course preview"
                          className="w-full h-full object-cover rounded-lg"
                          width={500}
                          height={192}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-customgreys-dirtyGrey" />
                          <p className="text-sm text-customgreys-dirtyGrey">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-customgreys-dirtyGrey mt-1">
                            PNG, JPG (MAX. 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <CustomFormField
                  name="courseTitle"
                  label="Course Title"
                  type="text"
                  placeholder="Write course title here"
                  className="border-none"
                />
                <CustomFormField
                  name="courseDescription"
                  label="Course Description"
                  type="textarea"
                  placeholder="Write course description here"
                />
                <CustomFormField
                  name="courseCategory"
                  label="Course Category"
                  type="select"
                  placeholder="Select category here"
                  options={[
                    { value: 'Web Development', label: 'Web Development' },
                    { value: 'Data Science', label: 'Data Science' },
                    { value: 'Machine Learning', label: 'Machine Learning' },
                    { value: 'CyberSecurity', label: 'CyberSecurity' },
                  ]}
                />
                <CustomFormField
                  name="coursePrice"
                  label="Course Price"
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-customgreys-darkGrey mt-4 md:mt-0 p-4 rounded-lg basis-1/2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-secondary-foreground">
                  Sections
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                  className="border-none text-primary-700 group"
                >
                  <Plus className="mr-1 h-4 w-4 text-primary-700 group-hover:white-100" />
                  <span className="text-primary-700 group-hover:white-100">
                    Add Section
                  </span>
                </Button>
              </div>

              {sections.length > 0 ? (
                <DroppableComponent />
              ) : (
                <p>No sections available</p>
              )}
            </div>
          </div>
        </form>
      </Form>

      <ChapterModal />
      <SectionModal />
    </div>
  );
};

export default CourseCreator;