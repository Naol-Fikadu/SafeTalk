'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Logged in successfully!');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#9b4dca] via-[#da70d6] to-[#f37eae]">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-purple-500 flex-shrink-0 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-pink-400 flex-shrink-0 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-violet-600 flex-shrink-0 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/2 left-[15%] -translate-y-1/2 -translate-x-1/2 text-white/10 pointer-events-none">
        <Globe className="w-64 h-64 animate-float" />
      </div>
      <div className="absolute top-1/4 left-1/3 text-white/10 pointer-events-none">
        <Sparkles className="w-12 h-12 animate-pulse-slow" />
      </div>

      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-12 lg:gap-32 relative z-10 px-6">
        {/* Left Side: Brand */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex-1 text-center md:text-left pt-12 md:pt-0 flex flex-col md:items-start items-center"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-[#c471ed] to-[#f64f59] shadow-2xl mb-8">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-extrabold text-black mb-4 tracking-tight">SocialFlow</h1>
          <p className="text-2xl lg:text-3xl text-black/70 font-medium">Join the community</p>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
          className="flex-1 w-full max-w-md"
        >
          <Card className="bg-white rounded-[2rem] p-8 lg:p-12 shadow-2xl border border-white/5 relative">
            {/* Dark watermark icons inside the card */}
            <div className="absolute top-12 right-6 text-white/5 pointer-events-none">
              <Zap className="w-20 h-20 -rotate-12" />
            </div>
            <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none">
              <Shield className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <h2 className="text-white text-lg font-bold mb-8">Log into SocialFlow</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-gray-500 text-sm font-medium mb-2 ml-4">
                    Email Address
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-full !bg-gray-800 border-0 text-white px-6 h-14 placeholder:text-white"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                  />
                </div>

                <div className="relative">
                  <label className="block text-gray-500 text-sm font-medium mb-2 ml-4">
                    Password
                  </label>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-full !bg-gray-800 border-0 text-white px-6 h-14 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all"
                    placeholder="••••••••"
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 mt-4 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-[#d946ef] to-[#f43f5e] hover:opacity-90 text-white text-base font-semibold border-0 h-14 mt-4 transition-opacity"
                  isLoading={isLoading}
                >
                  Log in
                </Button>
              </form>

              <div className="mt-6 mb-8 text-center pt-2">
                <Link
                  href="/forgot-password"
                  className="text-white text-sm font-semibold hover:text-pink-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full bg-transparent border border-white/20 text-white hover:bg-white/10 h-14 font-semibold text-sm transition-colors"
                  onClick={() => router.push('/signup')}
                >
                  Create new account
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}