import { Combobox } from '@headlessui/react';
import { ErrorMessage, Field, FieldArray, FormikProps } from 'formik';
import Fuse from 'fuse.js';
import { FC, useMemo, useState } from 'react';
import Dropzone from 'react-dropzone';
import { useEntities } from '../hooks/useEntities';
import IconAdd from './icons/add';
import IconChevronDown from './icons/chevronDown';
import IconDelete from './icons/delete';

export interface CompleteCommFormValues {
  api: string;
  title: string;
  description: string;
  dateReceived: string;
  nsfw: boolean;
  thumbnailLabel: string;
  images: {
    name: string;
    files: File[];
  }[]
}

export interface EditCommFormValues {
  api: string;
  title: string;
  description: string;
  nsfw: boolean;
}

interface AddCommFormValues_Required {
  api: string;
  artist: { id: number, name: string };
  characters: { id: number, name: string }[];
  dateCommissioned: string;
  price: string;
  invoice: any;
  complete: boolean;
}

export type AddCommFormValues = AddCommFormValues_Required & CompleteCommFormValues;

interface CommissionFormProps {
  refetch: () => Promise<void>;
  closeForm: () => void;
}

export type EditCommissionFormProps = CommissionFormProps & {
  commissionID: number;
  title: string,
  description: string,
  nsfw: boolean,
  updateCommission: (args: any) => Promise<any>
};
export type CompleteCommissionFormProps = CommissionFormProps & {
  commissionID: number;
  completeCommission: (args: any) => Promise<any>
};
export type AddCommissionFormProps = CommissionFormProps & { addCommission: (args: any) => Promise<any> };

export type EditCommissionFormType = EditCommissionFormProps & FormikProps<EditCommFormValues>
export type CompleteCommissionFormType = (CompleteCommissionFormProps | AddCommissionFormProps) & FormikProps<CompleteCommFormValues>
export type AddCommissionFormType = AddCommissionFormProps & FormikProps<AddCommFormValues>


// ============================== 
// Helpers
// ============================== 

const fieldClasses = 'bg-west-brown accent-west-cream text-west-cream p-2 rounded border-2 w-full';

export const CustomErrorMessage: FC<{ name: string }> = ({ name }) => <ErrorMessage name={name} component='p' className='text-red-600' />;
export const APIErrorMessage: FC = () => <ErrorMessage name='api' render={(msg) => (<div className='w-full rounded bg-red-200 border-2 border-red-600 text-center text-red-600 p-2'> <p>API Error: {msg}</p> </div>)} />;

interface CustomSelectProps<T> {
  onChange: (a: T) => void;
  setTouched: () => void;
  options: T[];
  value: T | T[];
}

const CustomSelect: FC<CustomSelectProps<{ id: number, name: string }> & { multiSelect?: boolean, className?: string }> = (props) => {
  const [ search, setSearch ] = useState('');

  const searchEngine = useMemo(() => {
    const fuseOptions = {
      includeScore: true,
      keys: [ 'name' ]
    };

    return new Fuse<{ id: number, name: string }>(props.options, fuseOptions);
  }, [ props.options ]);

  const filteredOptions = useMemo(() => {
    return search.length > 1 ? searchEngine.search(search).map(({ item }) => item) : props.options;
  }, [ search, searchEngine, props.options ]);

  return (
    // @ts-ignore
    <Combobox value={props.value} onChange={props.onChange} multiple={props.multiSelect ?? false}>
      <div className={`relative ${props.className}`} onBlur={props.setTouched}>
        <div className='relative w-full cursor-default overflow-hidden rounded-lg bg-west-cream text-left shadow-md'>
          <Combobox.Input className='w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-west-brown focus:ring-0 bg-west-cream' displayValue={(i) => {
            if (i === undefined) return '';
            if (Array.isArray(i)) '';
            // @ts-ignore
            return i.name;
          }} onChange={(event) => setSearch(event.target.value)} onBlur={() => setSearch('')} onFocus={() => setSearch('')} />
          <Combobox.Button className='absolute inset-y-0 right-0 flex items-center pr-2'>
            <IconChevronDown className='text-west-brown text-lg' />
          </Combobox.Button>
        </div>
        <Combobox.Options className='absolute mt-1 max-h-60 w-full overflow-auto rounded bg-west-cream py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border-2 border-west-brown z-10'>
          {filteredOptions.length === 0 && search !== '' ? (
            <div className='relative cursor-default select-none py-2 px-4 text-gray-700'>
              Nothing found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <Combobox.Option key={option.id} className='p-2 mx-1 rounded ui-active:bg-west-teal text-west-brown ui-not-active:bg-west-cream ui-disabled: bg-gray-300' value={option} disabled={Array.isArray(props.value) ? props.value.includes(option) : false}>{option.name}</Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};


// ============================== 
// Form Elements
// ============================== 
export const EditCommissionFormElements: FC<EditCommissionFormType> = (props) => {
  const { errors, isSubmitting } = props;

  return (
    <>
      {errors.api && <APIErrorMessage />}
      <fieldset className='w-full'>
        <Field type='string' name='title' placeholder='Title' className={fieldClasses} autocomplete='off' />
        <CustomErrorMessage name='title' />
      </fieldset>
      <fieldset className='w-full'>
        <Field component='textarea' rows='4' name='description' placeholder='Description' className={fieldClasses} autocomplete='off' />
        <CustomErrorMessage name='description' />
      </fieldset>
      <div className='flex justify-between w-full'>
        <label className='text-west-cream border-2 p-2 rounded bg-west-brown flex space-x-2'>
          <Field type='checkbox' name='nsfw' className='accent-west-teal' />
          <p>NSFW</p>
        </label>

        <fieldset className='space-x-2 lg:space-x-4'>
          <button type='submit' disabled={isSubmitting} className='bg-west-teal hover:bg-west-brown p-2 lg:px-8 rounded text-west-red hover:lg:text-west-cream'>Save Changes</button>
          <button type='button' className='bg-west-cream text-west-brown p-2 lg:px-8 rounded hover:bg-west-brown hover:text-west-cream' onClick={() => props.closeForm()}>Cancel</button>
        </fieldset>
      </div>

    </>
  );
};

export const CompleteCommissionFormElements: FC<CompleteCommissionFormType> = (props) => {
  const { errors, isSubmitting, values, setFieldValue } = props;
  return (
    <>
      {errors.api && <APIErrorMessage />}
      <section className='space-y-2 w-full pb-4'>
        <fieldset>
          <Field className={fieldClasses} type='string' name='title' placeholder='Title' autocomplete='off' />
          <CustomErrorMessage name='title' />
        </fieldset>
        <fieldset>
          <Field className={fieldClasses} component='textarea' rows='4' name='description' placeholder='Description' autocomplete='off' />
          <CustomErrorMessage name='description' />
        </fieldset>
        <div className='flex space-x-2 justify-between'>
          <fieldset className='w-full lg:w-1/3'>
            <label className='text-west-cream'>
              <p>Date Received:</p>
              <Field className={fieldClasses} type='date' name='dateReceived' />
            </label>
            <CustomErrorMessage name='dateReceived' />
          </fieldset>
          <label className='flex text-west-cream bg-west-brown p-2 gap-2 rounded border-2 h-fit mt-6'>
            <Field type='checkbox' name='nsfw' className='accent-west-teal' />
            <p>NSFW</p>
          </label>
        </div>
      </section>

      <FieldArray name='images' render={(arrayHelpers) => (
        <section className='w-full'>
          <div className='pb-2 flex justify-between items-center align-center'>
            <h2>Images</h2>
            <button type='button' onClick={() => arrayHelpers.push({ name: '', files: [] })} className='text-3xl text-west-teal'><IconAdd /></button>
          </div>

          {
            values.images.length > 0 &&
            <div className='pb-2 border-b-2 border-west-brown'>
              <label className='flex justify-between bg-west-brown border-2 border-west-cream rounded p-2'>
                <p className='text-west-cream'>Thumbnail Image:</p>
                <Field as='select' name='thumbnailLabel' className='rounded bg-west-cream w-1/2 px-2'>
                  {
                    values.images.map((image, idx) => <option key={`${idx}thumbnailLabelKey`} value={image.name}>{image.name}</option>)
                  }
                </Field>
              </label>
              <CustomErrorMessage name='thumbnailLabel' />
            </div>
          }

          <div className='space-y-2 divide-y divide-west-brown'>
            {
              values.images && values.images.length > 0 ? values.images.map((_image, idx) => (
                <div key={`imagek${idx}`} className='space-y-2 pt-2'>
                  <div className='flex space-x-2'>
                    <fieldset className='w-full'>
                      <Field name={`images.${idx}.name`} placeholder='Image name' className={fieldClasses} autocomplete='off' />
                      <CustomErrorMessage name={`images.${idx}.name`} />
                    </fieldset>
                    <button type='button' onClick={() => arrayHelpers.remove(idx)} className='bg-west-teal p-2 rounded text-west-red'><IconDelete /></button>
                  </div>
                  <Dropzone
                    onDrop={(acceptedFiles) => {
                      if (acceptedFiles.length === 0) return;
                      setFieldValue(`images.${idx}.files`, values.images[idx].files.concat(acceptedFiles));
                    }}
                    accept={
                      {
                        'image/gif': [ '.gif' ],
                        'image/jpeg': [ '.jpg', '.jpeg' ],
                        'image/png': [ '.png' ],
                        'image/svg+xml': [ '.svg' ],
                        'image/tiff': [ '.tif', '.tiff' ],
                        'image/webp': [ '.webp' ],
                      }
                    }
                  >
                    {({ getRootProps, getInputProps }) => (
                      <>
                        <div {...getRootProps()} className='border-2 border-west-cream border-dashed p-2 h-fit flex justify-center items-center bg-west-brown text-west-cream rounded'>
                          <input {...getInputProps()} />
                          {
                            values.images[idx].files.length === 0 ?
                              <p>Drag n drop files, or click to select</p>
                              : <ul>{values.images[idx].files.map((f, f_idx) => <li key={`${f_idx}-${values.images[idx].name}altkey`}>{f.name}</li>)}</ul>
                          }
                        </div>
                        <CustomErrorMessage name={`images.${idx}.files`} />
                      </>
                    )}
                  </Dropzone>
                </div>
              ))
                :
                <CustomErrorMessage name='images' />
            }
          </div>
        </section>
      )} />

      <fieldset className='w-full flex justify-between pt-4'>
        <button type='submit' disabled={isSubmitting} className='bg-west-teal hover:bg-west-brown disabled:bg-west-brown disabled:hover:text-west-red p-2 lg:px-8 rounded text-west-red hover:lg:text-west-cream'>Submit</button>
        <button type='button' className='bg-west-cream p-2 lg:px-8 rounded text-west-brown' onClick={() => props.closeForm()}>Close</button>
      </fieldset>
    </>
  );
};

export const AddCommissionFormElems: FC<AddCommissionFormType> = (props) => {
  const { errors, isSubmitting, setFieldValue, setFieldTouched, values } = props;
  const { data: entitiesFromHook, loading: entitiesLoading, error } = useEntities();
  const entities = useMemo(() => {
    return entitiesFromHook?.sort((a, b) => a.name < b.name ? -1 : 1);
  }, [ entitiesFromHook ]);
  const artists = useMemo(() => entities?.filter(e => e.type === 'ARTIST'), [ entities ]);

  return (
    <fieldset className='w-full space-y-2'>
      {errors.api && <APIErrorMessage />}
      <fieldset id='add_commission_required_values' className='w-full lg:flex justify-between items-center'>
        {
          !entitiesLoading && artists && !error &&
          <fieldset className='w-full'>
            <label className='text-west-cream block w-full lg:w-1/3'>
              <p>Artist:</p>
              <CustomSelect
                onChange={(e) => setFieldValue('artist', e)}
                setTouched={() => setFieldTouched('artist.name', true)}
                options={artists}
                value={values.artist ?? { id: -1, name: '' }}
                className='max-w-48'
              />
            </label>
            <CustomErrorMessage name='artist.name' />
          </fieldset>
        }
        <label className='text-west-cream block w-full lg:w-1/3'>
          <p>Date Commissioned:</p>
          <Field className={fieldClasses} type='date' name='dateCommissioned' />
          <CustomErrorMessage name='dateCommissioned' />
        </label>
      </fieldset>

      {
        !entitiesLoading && entities && !error &&
        <fieldset className='bg-west-brown p-2 rounded border-2 border-west-cream lg:flex justify-between'>
          <div className='w-full lg:w-1/3'>
            <label className='block w-full text-west-cream'>
              <p>Characters:</p>
              <CustomSelect
                onChange={(e) => setFieldValue('characters', values.characters.concat(e))}
                setTouched={() => setFieldTouched('characters', true)}
                options={entities}
                value={values.characters}
                className='w-full'
              />
            </label>
            <CustomErrorMessage name='characters' />
          </div>
          {
            values.characters.length > 0 &&
            <div className='flex items-center space-x-4 w-full lg:w-1/2 justify-center lg:justify-end'>
              <p className='text-west-cream'>{values.characters.map(c => c.name).join(', ')}</p>
              <button type='button' className='bg-west-cream rounded text-west-brown mt-2 p-2 h-fit' onClick={() => setFieldValue('characters', [])}>Reset</button>
            </div>
          }

        </fieldset>
      }

      <fieldset className='w-full lg:flex justify-between items-end space-y-2 lg:space-y-0'>
        <fieldset>
          <label className='text-west-cream block w-full lg:w-1/3'>
            <p>Price:</p>
            <Field type='string' name='price' className={fieldClasses} autocomplete='off' />
          </label>
          <CustomErrorMessage name='price' />
        </fieldset>

        <fieldset className='flex flex-col items-end'>
          <Dropzone
            onDrop={(acceptedFiles) => {
              if (acceptedFiles.length === 0) return;
              setFieldValue('invoice', acceptedFiles[0]);
            }}
            maxFiles={1}
            accept={{ 'application/pdf': [ '.pdf' ] }}
          >
            {({ getRootProps, getInputProps }) => (
              <>
                <div {...getRootProps({ onBlur: () => setFieldTouched('invoice.name', true) })} className='border-2 border-west-cream border-dashed p-2 px-8 h-fit flex overflow-hidden justify-center items-center bg-west-brown text-west-cream rounded w-full'>
                  <input {...getInputProps()} />
                  {
                    values.invoice && values.invoice.name ? <p>{values.invoice.name}</p> : <p>Invoice</p>
                  }
                </div>
              </>
            )}
          </Dropzone>
          <CustomErrorMessage name='invoice' />
        </fieldset>
      </fieldset>

      <fieldset className='border-t-4 border-west-brown'>
        <label className='flex bg-west-brown rounded border-2 border-west-cream w-fit p-2 text-west-cream mt-2 space-x-4'>
          <p>Commission is complete</p>
          <Field type='checkbox' name='complete' />
        </label>
      </fieldset>

      {
        values.complete ?
          // @ts-ignore
          <CompleteCommissionFormElements {...props} />
          :
          <fieldset className='w-full flex justify-between pt-4'>
            <button type='submit' disabled={isSubmitting} className='bg-west-teal hover:bg-west-brown disabled:bg-west-brown disabled:hover:text-west-red p-2 lg:px-8 rounded text-west-red hover:lg:text-west-cream'>Submit</button>
            <button type='button' className='bg-west-cream p-2 lg:px-8 rounded text-west-brown' onClick={() => props.closeForm()}>Close</button>
          </fieldset>
      }
    </fieldset>
  );
};
