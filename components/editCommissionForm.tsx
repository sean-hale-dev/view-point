import { Form, withFormik } from 'formik';
import { FC } from 'react';
import * as yup from 'yup';
import { EditCommFormValues, EditCommissionFormElements, EditCommissionFormProps, EditCommissionFormType } from './commissionFormElements';

const EditCommissionForm_Internal: FC<EditCommissionFormType> = (props) => {
  return (
    <Form className='gap-2 flex flex-col w-full lg:w-1/2 mx-auto items-center lg:items-start'>
      <EditCommissionFormElements {...props} />
    </Form>
  );
};

const validationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  nsfw: yup.boolean().default(false),
});

const EditCommissionForm = withFormik<EditCommissionFormProps, EditCommFormValues>({
  mapPropsToValues: ({ title, description, nsfw }) => ({ api: '', title, description, nsfw }),
  validationSchema,
  handleSubmit: async (values, { props, resetForm, setFieldError }) => {
    const { title: initialTitle, description: initialDescription, nsfw: initialNsfw } = props;

    const changed_values: Partial<EditCommFormValues> = {};
    if (values.title !== initialTitle) changed_values.title = values.title;
    if (values.description !== initialDescription) changed_values.description = values.description;
    if (values.nsfw !== initialNsfw) changed_values.nsfw = values.nsfw;

    if (changed_values.title || changed_values.description || changed_values.nsfw !== undefined) {
      try {
        await props.updateCommission(changed_values);
        props.closeForm();
        resetForm();
      } catch (e: any) {
        if (e.resp.error && typeof e.resp.error === 'string') setFieldError('api', e.resp.error);
      }
    }

  }
})(EditCommissionForm_Internal);

export default EditCommissionForm;
