import AuthForm from '@/components/AuthForm';
import AuthShell from '@/components/AuthShell';

export const metadata = { title: 'Create account' };

export default function SignupPage() {
  return <AuthShell><AuthForm mode="signup" /></AuthShell>;
}
