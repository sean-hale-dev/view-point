import { Field, FieldArray, Form, FormikProps, withFormik } from 'formik';
import { FC } from 'react';
import * as yup from 'yup';
import { APIErrorMessage, CustomErrorMessage } from './commissionFormElements';
import IconAdd from './icons/add';
import IconDelete from './icons/delete';

interface RawEntity {
  name: string;
  type: string;
  socials: {
    name: string | null;
    type: string;
    value: string;
  }[];
}

type EntityFormValues =  { api: string; } & RawEntity;

interface EntityFormProps {
  refetch: () => Promise<void>;
  closeForm: () => void;
  entity?: RawEntity;
  action: (args: any) => Promise<any>;
}

type EntityFormType = EntityFormProps & FormikProps<EntityFormValues>;

const socialPrefix = (social: string, value: string) => {
  let prefix = '';
  switch (social) {
  case 'FURAFFINITY':
    prefix = 'https://furaffinity.net/user/';
    break;
  case 'TELEGRAM':
    prefix = 'https://t.me/';
    break;
  case 'TWITTER':
    prefix = 'https://twitter.com/';
    break;
  case 'WEBSITE':
    prefix = 'https://';
    break;
  default:
    break;
  }

  return prefix === '' ? prefix : `${prefix}${value}`;
};

const EntityForm_Internal: FC<EntityFormType> = (props) => {
  const { errors, values, isSubmitting } = props;

  const formClasses = 'flex flex-col w-full lg:w-1/2 mx-auto items-center lg:items-start py-8 gap-2 lg:gap-4';
  const fieldClasses = 'bg-west-brown accent-west-cream text-west-cream p-2 rounded border-2 w-full';

  return (
    <Form className={formClasses}>
      {errors.api && <APIErrorMessage />}
      <label className='block w-full text-west-cream'>
        <p>Name:</p>
        <Field className={fieldClasses} name='name' placeholder='Name' autocomplete='off' />
        <CustomErrorMessage name='name' />
      </label>
      <label className='block w-full text-west-cream'>
        <p>Type:</p>
        <Field className={fieldClasses} name='type' as='select'>
          <option value='' disabled hidden>Entity type</option>
          <option value='ARTIST'>Artist</option>
          <option value='CHARACTER'>Character</option>
        </Field>
        <CustomErrorMessage name='type' />
      </label>

      <FieldArray name='socials' render={(arrayHelpers) => {
        return (
          <fieldset className='w-full pt-2'>
            <div className='w-full flex justify-between items-center pb-2'>
              <h2>Socials</h2>
              <button type='button' className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown' onClick={() => arrayHelpers.push({ type: '', name: '', value: '' })}><IconAdd /></button>
            </div>

            <div className='divide-y space-y-2'>
              {
                values.socials.map((social, idx) => (
                  <fieldset className='flex flex-col gap-2 pt-2' key={`socialk${idx}`}>
                    <div className='w-full flex gap-2'>
                      <Field className={fieldClasses + ' ' + `${social.type === 'CUSTOM' && 'w-2/5'}`} name={`socials.${idx}.type`} as='select'>
                        <option value='' disabled hidden>Social type</option>
                        <option value='FURAFFINITY'>Furaffinity</option>
                        <option value='TELEGRAM'>Telegram</option>
                        <option value='TWITTER'>Twitter</option>
                        <option value='WEBSITE'>Website</option>
                        <option value='CUSTOM'>Custom</option>
                      </Field>

                      { social.type === 'CUSTOM' && <Field className={fieldClasses} name={`socials.${idx}.name`} placeholder='Custom social name' autocomplete='off' /> }
                    </div>
                    <div className='text-center'>
                      <div className='space-y-2 w-full flex justify-between'>
                        <Field className={fieldClasses} name={`socials.${idx}.value`} placeholder='Social value' autocomplete='off' />
                        <button type='button' className='text-west-teal hover:text-west-brown text-2xl lg:text-4xl w-fit pl-2' onClick={() => arrayHelpers.remove(idx)}><IconDelete /></button>
                      </div>

                      <p className='text-west-cream'>{socialPrefix(social.type, social.value)}</p>
                    </div>
                    <CustomErrorMessage name={`socials.${idx}.name`} />
                    <CustomErrorMessage name={`socials.${idx}.type`} />
                    <CustomErrorMessage name={`socials.${idx}.value`} />
                  </fieldset>
                ))
              }
            </div>
          </fieldset>
        );
      }} />

      <fieldset className='w-full flex justify-between pt-4'>
        <button type='submit' disabled={isSubmitting} className='bg-west-teal hover:bg-west-brown disabled:bg-west-brown disabled:hover:text-west-red p-2 lg:px-8 rounded text-west-red hover:lg:text-west-cream'>Submit</button>
        <button type='button' className='bg-west-cream p-2 lg:px-8 rounded text-west-brown' onClick={() => props.closeForm()}>Close</button>
      </fieldset>
    </Form>
  );
};

const validationSchema = yup.object().shape({
  name: yup.string().required('Entity name is required'),
  type: yup.string().required('Entity type must be either artist or character').matches(/(ARTIST|CHARACTER)/),
  socials: yup.array().of(yup.object().shape({
    type: yup.string().required('Social type is required').matches(/(TWITTER|TELEGRAM|FURAFFINITY|WEBSITE|CUSTOM)/),
    value: yup.string().required('Social value is required'),
    name: yup.string().when('type', {
      is: 'CUSTOM',
      then: yup.string().required('Custom socials must have a name')
    }),
  }))
});

const EntityForm = withFormik<EntityFormProps, EntityFormValues>({
  mapPropsToValues: (props) => {
    return props.entity ? {
      ...props.entity, api: '', socials: props.entity.socials.map(s => ({ ...s, name: s.name ?? '' }))
    } : {
      name: '',
      type: '',
      socials: [],
      api: '',
    };
  },
  validationSchema,
  handleSubmit: async (values, { resetForm, props, setFieldError }) => {
    try {
      await props.action(values);
      props.refetch();
      props.closeForm();
      resetForm();
    } catch (e: any) {
      if (e.resp.error && typeof e.resp.error === 'string') setFieldError('api', e.resp.error);
    }
  }
})(EntityForm_Internal);

export default EntityForm;
