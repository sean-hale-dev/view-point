import { Form, withFormik } from 'formik';
import { FC } from 'react';
import * as yup from 'yup';
import { AddCommFormValues, AddCommissionFormElems, AddCommissionFormProps, AddCommissionFormType } from './commissionFormElements';

const AddCommissionForm_Internal: FC<AddCommissionFormType> = (props) => {
  const formClasses = 'flex flex-col w-full lg:w-1/2 mx-auto items-center lg:items-start py-8';

  return (
    <Form className={formClasses}>
      <AddCommissionFormElems {...props} />
    </Form>
  );
};

const validationSchema = yup.object().shape({
  artist: yup.object().required().shape({
    id: yup.number().required().min(0),
    name: yup.string().required('Artist is required').min(1),
    type: yup.string().matches(/(ARTIST)/),
  }),
  characters: yup.array().min(1, 'Must have at least 1 character').of(
    yup.object().shape({
      id: yup.number().required(),
      name: yup.string().required().min(1),
      type: yup.string().matches(/(CHARACTER|ARTIST)/),
    })
  ),
  dateCommissioned: yup.date().required('Date Commissioned is required'),
  invoice: yup.mixed().required().test('is file', 'Invoice must be a file', (o) => o instanceof File),
  price: yup.number().min(0).required('Price is required'),
  complete: yup.boolean(),
  title: yup.string().when('complete', {
    is: true,
    then: yup.string().required('Title is required'),
  }),
  description: yup.string().when('complete', {
    is: true,
    then: yup.string().required('Description is required'),
  }),
  nsfw: yup.boolean().default(false),
  dateReceived: yup.date().when('complete', {
    is: true,
    then: yup.date().required('Date received is required'),
  }),
  images: yup.array().when('complete', {
    is: true,
    then: yup.array().min(1, 'Must provide at least one image').of(yup.object().shape({
      name: yup.string().required('Image must have name'),
      files: yup.array().min(1).of(
        yup.mixed().required().test('is file', 'Image input must be file', (o) => o instanceof File)
      )
    }))
  }),
  thumbnailLabel: yup.string().when('complete', {
    is: true,
    then: yup.string().required('Must provide thumbnail label'),
  })
});

const AddCommissionForm = withFormik<AddCommissionFormProps, AddCommFormValues>({
  mapPropsToValues: () => ({
    api: '',
    artist: { name: '', id: -1 },
    characters: [],
    dateCommissioned: '',
    price: '',
    invoice: {},
    complete: false,
    title: '',
    description: '',
    images: [{ name: 'primary', files: [] }],
    nsfw: false,
    thumbnailLabel: 'primary',
    dateReceived: ''
  }),
  validationSchema,
  handleSubmit: async (values, { props, resetForm, setFieldError }) => {
    const dateCommissioned = new Date(values.dateCommissioned);

    const formData = new FormData();
    formData.set('artistId', values.artist.id.toString());
    formData.set('characterIds', JSON.stringify(values.characters.map(c => c.id)));
    formData.set('invoice', values.invoice!);
    formData.set('price', values.price.toString());
    formData.set('dateCommissioned', dateCommissioned.toISOString());

    if (values.complete) {
      const dateReceived = new Date(values.dateReceived);
      formData.set('title', values.title);
      formData.set('description', values.description);
      formData.set('dateReceived', dateReceived.toISOString());
      formData.set('nsfw', values.nsfw ? 'true' : 'false');
      formData.set('thumbnailLabel', values.thumbnailLabel);

      values.images.forEach((img) => {
        img.files.forEach((file, idx) => {
          formData.set(`${img.name}.${idx}`, file)
        })
      })
    }

    try {
      await props.addCommission(formData);
      props.closeForm();
      resetForm();
    } catch (e: any) {
      if (e.resp.error && typeof e.resp.error === 'string') setFieldError('api', e.resp.error);
    }
  }
})(AddCommissionForm_Internal);

export default AddCommissionForm;
