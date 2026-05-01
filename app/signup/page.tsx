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
  User,
  Mail,
  Lock,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    dateOfBirth: z.string().refine((date) => {
      const age = new Date().getFullYear() - new Date(date).getFullYear();
      return age >= 13;
    }, 'You must be at least 13 years old'),
    terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          password: data.password,
        }),
      });

      if (response.ok) {
        toast.success('Account created successfully!');
        router.push('/login');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create account');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const lengthValid = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, lengthValid].filter(Boolean).length;

    if (strength <= 2) return { text: 'Weak', color: 'bg-red-500', width: 33 };
    if (strength <= 4) return { text: 'Medium', color: 'bg-yellow-500', width: 66 };
    return { text: 'Strong', color: 'bg-green-500', width: 100 };
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
    setStep(step + newDirection);
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

      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8 lg:gap-20 relative z-10 px-6 py-6 mt-8">
        {/* Left Side: Brand */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex-1 text-center md:text-left flex flex-col md:items-start items-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-tr from-[#c471ed] to-[#f64f59] shadow-xl mb-6">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-black mb-2 tracking-tight">SocialFlow</h1>
          <p className="text-xl lg:text-3xl text-black/70 font-medium">Join the community</p>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
          className="flex-1 w-full max-w-md"
        >
          <Card className="bg-black rounded-[2rem] p-6 lg:p-12 shadow-2xl border border-white/5 relative overflow-hidden">
            {/* Dark watermark icons inside the card */}
            <div className="absolute top-8 right-6 text-white/5 pointer-events-none">
              <Zap className="w-16 h-16 -rotate-12" />
            </div>
            <div className="absolute -bottom-4 -right-4 text-white/5 pointer-events-none">
              <Shield className="w-24 h-24" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-1"
                >
                  Create Account
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-sm"
                >
                  Start your journey with us
                </motion.p>
              </div>

              {/* Modern Progress Steps */}
              <div className="relative mb-10">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2"></div>
                <div className="relative flex justify-between">
                  {[1, 2, 3].map((s) => (
                    <motion.div
                      key={s}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + s * 0.1 }}
                      className={`relative z-10 flex flex-col items-center`}
                    >
                      <motion.div
                        animate={{
                          scale: step === s ? 1.1 : 1,
                          backgroundColor: step >= s ? '#d946ef' : '#1b222d'
                        }}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 ${step >= s ? 'border-[#d946ef]' : 'border-white/10'
                          } transition-colors`}
                      >
                        {s < step ? (
                          <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                        ) : (
                          <span className="text-white font-semibold text-xs lg:text-sm">{s}</span>
                        )}
                      </motion.div>
                      <span className="absolute -bottom-5 text-[10px] text-white/50 whitespace-nowrap">
                        {s === 1 ? 'Basic Info' : s === 2 ? 'Security' : 'Details'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="space-y-3"
                  >
                    {step === 1 && (
                      <div className="space-y-3">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Username
                          </label>
                          <Input
                            {...register('username')}
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm"
                            placeholder="johndoe"
                            error={errors.username?.message}
                          />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Email Address
                          </label>
                          <Input
                            {...register('email')}
                            type="email"
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                          />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Full Name
                          </label>
                          <Input
                            {...register('fullName')}
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm"
                            placeholder="John Doe"
                            error={errors.fullName?.message}
                          />
                        </motion.div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-3">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Password
                          </label>
                          <Input
                            {...register('password')}
                            type="password"
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm"
                            placeholder="••••••••"
                            error={errors.password?.message}
                          />
                          {password && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 px-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/50">Password strength:</span>
                                <span className={`text-[10px] font-medium ${passwordStrength().text === 'Weak' ? 'text-red-400' :
                                  passwordStrength().text === 'Medium' ? 'text-yellow-400' :
                                    'text-green-400'
                                  }`}>
                                  {passwordStrength().text}
                                </span>
                              </div>
                              <div className="w-full h-1 !bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${passwordStrength().width}%` }}
                                  transition={{ duration: 0.3 }}
                                  className={`h-full rounded-full ${passwordStrength().color}`}
                                />
                              </div>
                            </motion.div>
                          )}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Confirm Password
                          </label>
                          <Input
                            {...register('confirmPassword')}
                            type="password"
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                          />
                        </motion.div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-3">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                          <label className="block text-xs font-medium text-white/80 mb-1">
                            Date of Birth
                          </label>
                          <Input
                            {...register('dateOfBirth')}
                            type="date"
                            className="w-full rounded-full !bg-gray-800 border-0 text-white px-5 h-11 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-600 focus:bg-[#252d3a] transition-all text-sm [color-scheme:dark]"
                            max={new Date().toISOString().split('T')[0]}
                            error={errors.dateOfBirth?.message}
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col space-y-1 mt-1 pt-1"
                        >
                          <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#1b222d] border border-transparent">
                            <input
                              {...register('terms')}
                              type="checkbox"
                              id="terms"
                              className="w-3.5 h-3.5 rounded border-white/20 bg-black text-[#d946ef] focus:ring-[#d946ef]/50 focus:ring-offset-0"
                            />
                            <label htmlFor="terms" className="text-xs text-white/70 leading-tight">
                              I agree to the{' '}
                              <Link href="/terms" className="text-pink-400 hover:text-pink-300 underline decoration-pink-400/30">
                                Terms
                              </Link>
                              {' '}and{' '}
                              <Link href="/privacy" className="text-pink-400 hover:text-pink-300 underline decoration-pink-400/30">
                                Privacy Policy
                              </Link>
                            </label>
                          </div>
                          {errors.terms && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] text-red-400 px-3 mt-1"
                            >
                              {errors.terms.message}
                            </motion.p>
                          )}
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => paginate(-1)}
                      className="flex-1 rounded-full bg-transparent border border-white/20 text-white hover:bg-white/10 h-11 font-semibold text-sm transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={() => paginate(1)}
                      className="flex-1 rounded-full bg-gradient-to-r from-[#d946ef] to-[#f43f5e] hover:opacity-90 text-white text-sm font-semibold border-0 h-11 transition-opacity shadow-lg shadow-pink-500/20"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-gradient-to-r from-[#d946ef] to-[#f43f5e] hover:opacity-90 text-white text-sm font-semibold border-0 h-11 transition-opacity shadow-lg shadow-pink-500/20"
                      isLoading={isLoading}
                    >
                      Create Account
                    </Button>
                  )}
                </div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-5 text-center"
              >
                <p className="text-xs text-white/50">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-white hover:text-pink-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
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