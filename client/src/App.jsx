import ScrollToTop from './components/ScrollToTop.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import ToastViewport from './components/ToastViewport.jsx';

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <ToastViewport />
    </>
  );
}

export default App;
