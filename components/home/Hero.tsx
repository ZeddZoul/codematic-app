'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { colors } from '@/lib/design-system';
import { FaArrowRight } from 'react-icons/fa';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Modern Blurry Blob Background */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient blobs - larger and more visible */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-[900px] h-[900px] rounded-full blur-[130px]"
          style={{ backgroundColor: '#FFB6C1', opacity: 0.7 }}
        />
        
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -right-40 w-[1000px] h-[1000px] rounded-full blur-[140px]"
          style={{ backgroundColor: '#CCCCFF', opacity: 0.65 }}
        />
        
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 left-0 w-[950px] h-[950px] rounded-full blur-[120px]"
          style={{ backgroundColor: '#FFE4E1', opacity: 0.6 }}
        />
        
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 -right-20 w-[850px] h-[850px] rounded-full blur-[110px]"
          style={{ backgroundColor: '#E6E6FA', opacity: 0.65 }}
        />
        
        {/* White gradient overlay to create the reference effect */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.7) 100%)'
          }}
        />
      </div>

      <div className="container mx-auto px-4 z-10 relative pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span 
              className="inline-block px-5 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(255, 192, 203, 0.3)',
                color: '#8D240C'
              }}
            >
              Now with Gemini 2.5
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            style={{ color: '#122438' }}
          >
            Automated Compliance for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${colors.primary.accent}, ${colors.primary.accentActive})` }}>
              Mobile Applications
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#6090A1' }}
          >
            Ensure your iOS and Android apps meet App Store and Play Store guidelines before you submit. Powered by advanced AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center"
          >
            <Link href="/login">
              <button 
                className="inline-flex items-center justify-center h-14 px-10 text-base font-semibold rounded-full text-white transition-all duration-200 hover:opacity-90"
                style={{ 
                  backgroundColor: '#8D240C',
                  boxShadow: '0 4px 14px 0 rgba(141, 36, 12, 0.39)'
                }}
              >
                Get Started Free
                <FaArrowRight className="ml-2 text-sm" />
              </button>
            </Link>
          </motion.div>

          {/* Stats/Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{ borderColor: 'rgba(141, 36, 12, 0.15)' }}
          >
            {[
              { label: 'Checks Run', value: '10k+' },
              { label: 'Issues Found', value: '50k+' },
              { label: 'Time Saved', value: '1000h+' },
              { label: 'Accuracy', value: '99.9%' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold mb-1" style={{ color: '#122438' }}>{stat.value}</div>
                <div className="text-sm uppercase tracking-wider" style={{ color: '#6090A1' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
