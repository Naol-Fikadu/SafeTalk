'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import templateImage from '../../public/template.webp';
import { Zap, Shield, Globe, Users } from 'lucide-react';

const features = [
  {
    icon: <Users className="w-8 h-8 text-purple-500" />,
    title: 'Connect with Anyone',
    description: 'Find friends, join communities, and stay connected with people who share your interests.'
  },
  {
    icon: <Zap className="w-8 h-8 text-pink-500" />,
    title: 'Lightning Fast',
    description: 'Experience a smooth, lag-free social feed designed for maximum performance.'
  },
  {
    icon: <Shield className="w-8 h-8 text-indigo-500" />,
    title: 'Private & Secure',
    description: 'Your data is encrypted and protected. You maintain full control over your privacy.'
  },
  {
    icon: <Globe className="w-8 h-8 text-blue-500" />,
    title: 'Global Reach',
    description: 'Discover trending content and news from every corner of the globe in real-time.'
  }
];

export function SimpleLanding() {
  return (
    <div className="w-full bg-gradient-to-r from-purple-600 to-pink-400 font-sans overflow-hidden">

      {/* Hero Section */}
      <div className="w-full min-h-screen flex items-center justify-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 pt-20 lg:pt-0">

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-10"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl mb-6">
                <span className="text-3xl font-bold text-white">S</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-black tracking-tight mb-4">
                Connect. <br />
                <span className="text-white">
                  Share. Discover.
                </span>
              </h1>

              <p className="mt-4 text-lg sm:text-xl text-black/80 max-w-lg mb-8">
                Join SocialFlow today. The simple, fast, and secure way to build your community and share your moments with the world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  href="/login"
                  className="inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 shadow-lg transition-colors w-full sm:w-auto"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex justify-center items-center px-8 py-3.5 border border-gray-300 text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors w-full sm:w-auto"
                >
                  Create Account
                </Link>
              </div>
            </motion.div>

            {/* Image Container with Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="w-full lg:w-1/2 flex justify-center lg:justify-end relative pb-20 lg:pb-0"
            >
              {/* Animated background blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 lg:w-96 lg:h-96 bg-gradient-to-tr from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow z-0"></div>

              {/* Floating Image */}
              <motion.img
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
                src={templateImage.src}
                alt="SocialFlow Preview"
                className="w-[85%] max-w-[500px] h-auto object-contain drop-shadow-2xl z-10"
              />
            </motion.div>

          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-transparent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-black"
            >
              Why Choose SocialFlow?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-xl text-black/80"
            >
              Everything you need in a modern social media platform.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern CTA Section */}
      <div className="py-24 bg-black relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-purple-500 mix-blend-screen filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-pink-500 mix-blend-screen filter blur-3xl opacity-30"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
          >
            Ready to dive in?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            Create your account in seconds and start connecting with the world's most vibrant community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/signup"
              className="inline-flex justify-center items-center px-10 py-4 border border-transparent text-lg font-bold rounded-full text-black bg-white hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105"
            >
              Get Started for Free
            </Link>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
