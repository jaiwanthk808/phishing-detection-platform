import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-medium">Page not found</p>
      <Link to="/" className="mt-3 inline-block text-accent hover:underline">Return to dashboard</Link>
    </div>
  )
}
