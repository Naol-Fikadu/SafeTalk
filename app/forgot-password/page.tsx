'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  Shield,
  Zap,
  Globe,
  ArrowLeft,
  MailCheck
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      // Simulating API call as we are instructed not to touch the database
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSent(true);
      toast.success('Password reset link sent to your email!');
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
          <p className="text-2xl lg:text-3xl text-black/70 font-medium">Recover your account</p>
        </motion.div>

        {/* Right Side: Forgot Password Card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
          className="flex-1 w-full max-w-md"
        >
          <Card className="bg-white rounded-[2rem] p-8 lg:p-12 shadow-2xl border border-white/5 relative overflow-hidden">
            {/* Dark watermark icons inside the card */}
            <div className="absolute top-12 right-6 text-white/5 pointer-events-none">
              <Zap className="w-20 h-20 -rotate-12" />
            </div>
            <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none">
              <Shield className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <Link href="/login" className="inline-flex items-center text-gray-500 hover:text-white transition-colors mb-6 text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
              
              <AnimatePresence mode="wait">
                {!isSent ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-white text-xl font-bold mb-2">Forgot Password?</h2>
                    <p className="text-gray-500 text-sm mb-8">
                      No worries, we'll send you reset instructions.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div>
                        <label className="block text-gray-500 text-sm font-medium mb-2 ml-4">
                          Email Address
                        </label>
                        <Input
                          {...register('email')}
                          type="email"
                          className="w-full rounded-full !bg-gray-800 border-0 text-white px-6 h-14 placeholder:text-gray-400"
                          placeholder="you@example.com"
                          error={errors.email?.message}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-full bg-gradient-to-r from-[#d946ef] to-[#f43f5e] hover:opacity-90 text-white text-base font-semibold border-0 h-14 mt-4 transition-opacity"
                        isLoading={isLoading}
                      >
                        Reset Password
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-6"
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-6 mx-auto">
                      <MailCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-white text-xl font-bold mb-3">Check your email</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                      We sent a password reset link to <br/> 
                      <span className="font-medium text-white">your email address</span>
                    </p>

                    <Button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="w-full rounded-full bg-transparent hover:bg-white/10 text-white border border-white/20 text-base font-semibold h-14 transition-colors"
                    >
                      Return to login
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
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
