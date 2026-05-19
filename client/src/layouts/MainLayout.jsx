import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import FloatingContactButtons from '../components/common/FloatingContactButtons.jsx';
import Header from '../components/Header.jsx';

function MainLayout() {
  return (
    <div className="page-shell min-h-screen text-slate-900">
      <Header />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <FloatingContactButtons />
      <Footer />
    </div>
  );
}

export default MainLayout;
