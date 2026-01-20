import { Outlet } from 'react-router-dom';
import Header from './Header/Header';

export default function LayoutDefault() {
  return (
    <div className="layout-default">
      <Header />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
