import { Metadata } from 'next'
import { CourseRegistrationForm } from '@/components/course/CourseRegistrationForm'

export const metadata: Metadata = {
  title: '授業を登録 | City2',
  description: '新しい授業を登録して、他の学生と情報を共有しましょう',
}

export default function CourseRegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CourseRegistrationForm />
    </div>
  )
}