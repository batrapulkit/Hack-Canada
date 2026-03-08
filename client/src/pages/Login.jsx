import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();

  useEffect(() => {
    // Automatically trigger the Auth0 redirect when this page mounts
    signIn();
  }, [signIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <h2 className="text-xl font-semibold">Redirecting to Secure Login...</h2>
        <p className="text-slate-400">Please wait while we connect to Auth0.</p>
      </div>
    </div>
  );
}