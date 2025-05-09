"use client";

import { useMemo, useState, useEffect } from 'react';
import { CustomFormField } from '@/components/CustomFormField';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { courseSchema, CourseFormData } from '@/lib/schema';
import { createCourseFormData, uploadAllVideos, updateS3Resource } from '@/lib/utils';
import { openSectionModal, setSections, setCourseId } from '@/state';
import { useGetCourseQuery, useUpdateCourseMutation } from '@/state/api/coursesApi';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import DroppableComponent from '@/components/Droppable';
import ChapterModal from '@/components/ChapterModal';
import SectionModal from '@/components/SectionModal';
import Image from 'next/image';

const CourseEditor = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useGetCourseQuery(id);
  const [updateCourse] = useUpdateCourseMutation();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);

  const course = useMemo(() => data?.data as Course || ({} as Course), [data?.data]);

  const dispatch = useAppDispatch();
  const sections = useAppSelector((state) => state.global.courseEditor.sections) || [];

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

  useEffect(() => {
    if (course && course.title) {
      methods.reset({
        courseTitle: course.title || '',
        courseDescription: course.description || '',
        courseCategory: course.category || '',
        coursePrice: course.price?.toString() || '0',
        courseStatus: course.status === 'Published' ? 'Published' : 'Draft',
        courseImage: course.image || '',
      });
      setImagePreview(course.image || '');
      dispatch(setSections(course.sections || []));
      dispatch(setCourseId(id));
    }
  }, [course, methods, dispatch, id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    methods.setValue('courseImage', file);

    setIsUploading(true);
    try {
      const { publicUrl, key } = await updateS3Resource(course.image, file, 'image');
      methods.setValue('courseImage', publicUrl);
      setImagePreview(publicUrl);
      setUploadedKeys((prev) => [...prev, key]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      methods.setValue('courseImage', course.image || '');
      setImagePreview(course.image || '');
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
    try {
      if (isUploading) {
        toast.error('Please wait for the image to finish uploading');
        return;
      }

      toast.loading('Uploading videos and updating course...');
      const updatedSections = await uploadAllVideos(sections);
      const formData = await createCourseFormData(
        {
          ...data,
          courseImage: data.courseImage || '',
          courseStatus: data.courseStatus,
        },
        updatedSections
      );
      

      await updateCourse({ courseId: id, formData }).unwrap();

      toast.dismiss();
      toast.success('Course updated successfully!');
      setUploadedKeys([]);
      router.push('/teacher/courses', { scroll: false });
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
      await cleanupUploadedFiles();
    }
  };

  if (isLoading) return <div>Loading...</div>;

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
            title="Course Setup"
            subtitle={
              course?.status === 'Unlisted'
                ? 'This course is unlisted by an admin and cannot be edited until re-published.'
                : 'Complete all fields and save your course'
            }
            rightElement={
              <div className="flex items-center space-x-4">
                {course?.status === 'Unlisted' ? (
                  <span className="text-sm text-gray-500">
                    Unlisted (Admin Controlled)
                  </span>
                ) : (
                  <>
                    <CustomFormField
                      name="courseStatus"
                      label={methods.watch('courseStatus') === 'Published' ? 'Published' : 'Draft'}
                      type="switch"
                      className="flex items-center space-x-2"
                      labelClassName={`text-sm font-medium ${
                        methods.watch('courseStatus') === 'Published' ? 'text-green-500' : 'text-yellow-500'
                      }`}
                      inputClassName="data-[state=checked]:bg-green-500"
                      disabled={course?.status !== 'Published' && course?.status !== 'Draft'}
                    />
                    <Button
                      type="submit"
                      className="bg-primary-700 hover:bg-primary-600"
                    >
                      {methods.watch('courseStatus') === 'Published' ? 'Update Published Course' : 'Save Draft'}
                    </Button>
                  </>
                )}
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
                      disabled={course?.status === 'Unlisted'}
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
                  disabled={course?.status === 'Unlisted'}
                />
                <CustomFormField
                  name="courseDescription"
                  label="Course Description"
                  type="textarea"
                  placeholder="Write course description here"
                  disabled={course?.status === 'Unlisted'}
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
                  disabled={course?.status === 'Unlisted'}
                />
                <CustomFormField
                  name="coursePrice"
                  label="Course Price"
                  type="number"
                  placeholder="0"
                  disabled={course?.status === 'Unlisted'}
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
                  disabled={course?.status === 'Unlisted'}
                >
                  <Plus className="mr-1 h-4 w-4 text-primary-700 group-hover:white-100" />
                  <span className="text-primary-700 group-hover:white-100">
                    Add Section
                  </span>
                </Button>
              </div>

              {isLoading ? (
                <p>Loading course content...</p>
              ) : sections.length > 0 ? (
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

export default CourseEditor;