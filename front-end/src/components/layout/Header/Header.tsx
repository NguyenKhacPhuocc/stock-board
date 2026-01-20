import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setLocale } from '@/app/appSlice';
import { setLogout } from '@/features/auth/authSlice';
import styles from './Header.module.scss';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const locale = useAppSelector((state) => state.app.locale);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const intl = useIntl();

  const toggleLocale = (newLocale: 'vi' | 'en') => {
    dispatch(setLocale(newLocale));
  };

  const handleLogout = () => {
    dispatch(setLogout());
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      {/* logo */}
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          Stock<span>Board</span>
        </Link>
      </div>

      <div className={styles.right}>
        {/* login/logout button */}
        {isAuthenticated ? (
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {(user?.username?.[0] || 'U').toUpperCase()}
            </div>
            <span>{user?.username || 'User'}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              {intl.formatMessage({ id: 'login.logout' })}
            </button>
          </div>
        ) : (
          <button
            className={styles.loginBtn}
            onClick={() => navigate('/login')}
          >
            {intl.formatMessage({ id: 'login.submit' })}
          </button>
        )}

        {/* switch language */}
        <div className={styles.langSwitcher}>
          <button
            className={clsx(locale === 'vi' && styles.active)}
            onClick={() => toggleLocale('vi')}
          >
            VI
          </button>
          <button
            className={clsx(locale === 'en' && styles.active)}
            onClick={() => toggleLocale('en')}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
