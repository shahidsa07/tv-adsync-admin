import { redirect } from 'next/navigation';

export default function Home() {
  // The root page should always redirect to the dashboard.
  // The middleware will handle authentication.
  redirect('/dashboard');
}
