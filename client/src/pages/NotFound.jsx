import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="mt-2 font-medium text-slate-700">Page not found</p>
      <Link to="/" className="btn btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
