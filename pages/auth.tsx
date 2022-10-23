import { NextPage } from 'next';
import { Dispatch, FC, SetStateAction, useEffect } from 'react';
import { Field, Form, FormikProps, withFormik } from 'formik';
import classNames from 'classnames';
import * as yup from 'yup';
import { NextRouter, useRouter } from 'next/router';
import useGlobalState from '../hooks/useGlobalState';

interface FormValues {
  username: string;
  password: string;
}

interface FormProps {
  router: NextRouter;
  setAuth: Dispatch<SetStateAction<boolean>>;
}

type AuthFormProps = FormProps & FormikProps<FormValues>;

const AuthForm_Internal: FC<AuthFormProps> = (props) => {
  const { touched, errors, isSubmitting } = props;

  const fieldClasses = classNames('bg-west-brown accent-west-cream text-west-cream p-2 rounded border-2 w-full');

  return (
    <Form className='space-2 flex flex-col gap-2 w-full lg:w-1/2 mx-auto items-center lg:items-start'>
      <Field type='string' name='username' placeholder='Username' className={fieldClasses}/>
      { errors.username && touched.username &&
        <div className='text-red-600'> {errors.username} </div>
      }
      <Field type='password' name='password' placeholder='Password' className={fieldClasses} />
      { errors.password && touched.password &&
        <div className='text-red-600'> {errors.password} </div>
      }

      <button type='submit' disabled={isSubmitting} className='w-fit bg-west-cream text-west-brown py-2 px-16 rounded-lg'>Login</button>
    </Form>
  );
};

const validationSchema = yup.object().shape({
  username: yup.string().required(),
  password: yup.string().required(),
});

const AuthForm = withFormik<FormProps, FormValues>({
  validationSchema: validationSchema,
  handleSubmit: async (values, { props, resetForm, setSubmitting }) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      mode: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    resetForm();
    setSubmitting(false);

    if (response.status === 200) {
      props.setAuth(true);
      props.router.back();
    }

  }
})(AuthForm_Internal);

const AuthPage: NextPage = () => {
  const router = useRouter();
  const { auth, setAuth } = useGlobalState();

  useEffect(() => {
    if (auth) {
      router.back();
    }
  });

  return (
    <main className='space-y-8'>
      <h1>Admin Authentication</h1>
      <AuthForm router={router} setAuth={setAuth} />
    </main>
  );
};

export default AuthPage;
