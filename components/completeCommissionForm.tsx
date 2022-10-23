import { Form, withFormik } from 'formik';
import * as yup from 'yup';
import { CompleteCommFormValues, CompleteCommissionFormElements, CompleteCommissionFormProps, CompleteCommissionFormType } from './commissionFormElements';

const CompleteCommissionForm_Internal: React.FC<CompleteCommissionFormType> = (props) => {
  const formClasses = 'flex flex-col w-full lg:w-1/2 mx-auto items-center lg:items-start';

  return (
    <Form className={formClasses}>
      <CompleteCommissionFormElements {...props} />
    </Form>
  );
};

const validationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  nsfw: yup.boolean().default(false),
  dateReceived: yup.date().required('Date Received is required'),
  images: yup.array().min(1, 'Must provide at least one image').of(
    yup.object().shape({
      name: yup.string().required('Image must have a name'),
      files: yup.array().min(1, 'Image must have at least one file').of(
        yup.mixed().required().test('is file', 'Image must be a file', (o) => o instanceof File)
      )
    })
  ),
  thumbnailLabel: yup.string().required('Thumbnail Label is required'),
});

const CompleteCommissionForm = withFormik<CompleteCommissionFormProps, CompleteCommFormValues>({
  mapPropsToValues: () => ({ api: '', title: '', description: '', dateReceived: '', nsfw: false, thumbnailLabel: 'primary', images: [{ name: 'primary', files: [] }] }),
  validationSchema,
  handleSubmit: async (values, { props, resetForm, setFieldError }) => {
    const formData = new FormData();
    formData.set('title', values.title);
    formData.set('description', values.description);
    formData.set('dateReceived', values.dateReceived);
    formData.set('nsfw', values.nsfw ? 'true' : 'false');
    formData.set('thumbnailLabel', values.thumbnailLabel);
    values.images.forEach(i => i.files.forEach(alt => formData.append(i.name, alt)));

    try {
      await props.completeCommission(formData);
      props.closeForm();
      resetForm();
    } catch (e: any) {
      if (e.resp.error && typeof e.resp.error === 'string') setFieldError('api', e.resp.error);
    }
  }
})(CompleteCommissionForm_Internal);

export default CompleteCommissionForm;
