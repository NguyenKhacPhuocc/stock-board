import { useIntl } from 'react-intl';
import { Form, useActionData, useNavigation } from 'react-router-dom';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const intl = useIntl();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const actionData = useActionData() as { error?: string };

  return (
    <Form method="post" className={styles.loginForm}>
      <h2>{intl.formatMessage({ id: 'login.title' })}</h2>

      <div className={styles.field}>
        <label>{intl.formatMessage({ id: 'login.email_label' })}</label>
        <input
          name="email"
          type="email"
          placeholder={intl.formatMessage({ id: 'login.email_placeholder' })}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.field}>
        <label>{intl.formatMessage({ id: 'login.password_label' })}</label>
        <input
          name="password"
          type="password"
          placeholder={intl.formatMessage({ id: 'login.password_placeholder' })}
          disabled={isSubmitting}
        />
      </div>

      {actionData?.error && (
        <div className={styles.error}>
          Thông tin đăng nhập không chính xác
        </div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : intl.formatMessage({ id: 'login.submit' })}
      </button>
    </Form>
  );
}
