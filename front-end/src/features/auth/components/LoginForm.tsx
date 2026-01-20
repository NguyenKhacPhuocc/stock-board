import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setLogin } from '../authSlice';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const intl = useIntl();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Giả lập login thành công
    if (username.trim() && password.trim()) {
      dispatch(setLogin({
        username: username,
        id: 'user-123'
      }));

      // Chuyển hướng tới trang market
      navigate('/market');
    } else {
      alert('Vui lòng nhập đầy đủ thông tin (Simulation)');
    }
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <h2>{intl.formatMessage({ id: 'login.title' })}</h2>

      <div className={styles.field}>
        <label>{intl.formatMessage({ id: 'login.username_label' })}</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={intl.formatMessage({ id: 'login.username_placeholder' })}
        />
      </div>

      <div className={styles.field}>
        <label>{intl.formatMessage({ id: 'login.password_label' })}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={intl.formatMessage({ id: 'login.password_placeholder' })}
        />
      </div>

      <button type="submit" className={styles.submitBtn}>
        {intl.formatMessage({ id: 'login.submit' })}
      </button>
    </form>
  );
}
