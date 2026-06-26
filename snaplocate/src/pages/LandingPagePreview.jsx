import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Navigation, BookOpen, Users, ShoppingBag, 
  Search, Coffee, Wifi, LifeBuoy, ArrowRight, 
  MapPin, Shield 
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { staggerChildren: 0.1 }
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export default function LandingPagePreview() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans selection:bg-[#5B4DFF]/20 overflow-hidden">
      
      {/* Floating Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-7xl h-[72px] bg-white/90 backdrop-blur-xl rounded-[24px] shadow-sm z-50 flex items-center justify-between px-6 lg:px-8 border border-white/50"
      >
        {/* Logo Left */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#5B4DFF] flex items-center justify-center shadow-sm">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">SnapLocate</span>
        </div>
        
        {/* Navigation Centered */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[15px] font-medium text-[#475569]">
          <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">How It Works</a>
          <a href="#roles" className="hover:text-[#0F172A] transition-colors">For Students</a>
          <a href="#roles" className="hover:text-[#0F172A] transition-colors">For Faculty</a>
        </div>

        {/* Buttons Right */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[15px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors hidden sm:block px-4 py-2 rounded-full hover:bg-slate-50">
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/login" className="text-[15px] font-semibold bg-[#5B4DFF] text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#4A3CF0] transition-colors">
              Get Started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 px-6 lg:px-10 min-h-[700px] max-w-7xl mx-auto flex items-center bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-[12px] uppercase tracking-wider font-bold text-[#475569] mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              850+ students on campus
            </div>
            
            <h1 className="text-[38px] md:text-[48px] lg:text-[72px] font-black tracking-tight leading-[0.95] text-[#0F172A] mb-8">
              Your Campus.<br />
              <span className="text-[#5B4DFF]">One OS.</span>
            </h1>
            
            <p className="text-[20px] text-[#475569] mb-10 max-w-[580px] leading-relaxed">
              SnapLocate replaces every scattered university portal with one fast, beautiful platform — for students, faculty, and admins.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/login" className="bg-[#5B4DFF] hover:bg-[#4A3CF0] text-white px-8 py-4 rounded-full font-semibold transition-colors flex items-center gap-2 text-[17px]">
                  Explore Campus <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="#features" className="px-8 py-4 rounded-full font-medium border border-[#E5E7EB] hover:bg-[#FAFAFC] transition-colors text-[#0F172A] bg-white text-[17px] shadow-sm">
                  View Features
                </a>
              </motion.div>
            </div>
            <p className="text-[13px] text-[#475569] mt-6 ml-2">No signup required • Use university email</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative w-full lg:-mr-12 xl:-mr-20"
          >
            {/* Blurred purple radial gradient behind dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(91,77,255,0.15)_0%,rgba(255,255,255,0)_70%)] pointer-events-none -z-10 blur-3xl"></div>
            
            {/* Dashboard Mockup Card */}
            <div className="bg-white/90 backdrop-blur-xl border border-[#E5E7EB] rounded-[24px] p-6 lg:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] relative z-10 w-full">
              {/* Fake UI Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E7EB]/60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5B4DFF] flex items-center justify-center text-white font-bold text-lg shadow-sm">R</div>
                  <div>
                    <h3 className="font-semibold text-[#0F172A] text-[18px]">Good morning, Roshan</h3>
                    <p className="text-[13px] text-[#475569]">Here's what's happening today</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAFAFC] rounded-[16px] p-5 border border-[#E5E7EB]/50 transition-all">
                  <p className="text-[11px] font-black text-[#5B4DFF] mb-2 tracking-widest uppercase">Up Next</p>
                  <p className="font-bold text-[#0F172A] text-[15px] leading-tight mb-1">9:40 AM — ML</p>
                  <p className="text-[13px] text-[#475569]">Lab L-203</p>
                </div>
                <div className="bg-[#FAFAFC] rounded-[16px] p-5 border border-[#E5E7EB]/50 transition-all">
                  <p className="text-[11px] font-black text-blue-500 mb-2 tracking-widest uppercase">Requests</p>
                  <p className="font-bold text-[#0F172A] text-[15px] leading-tight mb-1">2 replies</p>
                  <p className="text-[13px] text-[#475569]">Prof. Sharma...</p>
                </div>
                <div className="bg-[#FAFAFC] rounded-[16px] p-5 border border-[#E5E7EB]/50 transition-all">
                  <p className="text-[11px] font-black text-orange-500 mb-2 tracking-widest uppercase">Marketplace</p>
                  <p className="font-bold text-[#0F172A] text-[15px] leading-tight mb-1">3 listings</p>
                  <p className="text-[13px] text-[#475569]">Textbooks...</p>
                </div>
                <div className="bg-[#FAFAFC] rounded-[16px] p-5 border border-[#E5E7EB]/50 transition-all">
                  <p className="text-[11px] font-black text-green-500 mb-2 tracking-widest uppercase">Lost & Found</p>
                  <p className="font-bold text-[#0F172A] text-[15px] leading-tight mb-1">1 match</p>
                  <p className="text-[13px] text-[#475569]">Duffel bag...</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 lg:px-10 pb-28 bg-white">
        <motion.div 
          {...fadeUp}
          className="max-w-7xl mx-auto bg-white border border-[#E5E7EB] rounded-[24px] py-10 px-6 lg:px-12 shadow-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center divide-x-0 lg:divide-x lg:divide-[#E5E7EB]/60">
            {[
              { val: "920+", label: "Students Active" },
              { val: "19K+", label: "Page Views" },
              { val: "12", label: "Notices" },
              { val: "3", label: "Live Rides" },
              { val: "5 wks", label: "Time to Live" },
              { val: "AWS", label: "Cloud Hosted" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center">
                <p className="text-[40px] font-black text-[#0F172A] mb-1 tracking-tight leading-none">{stat.val}</p>
                <p className="text-[12px] text-[#475569] font-semibold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-6 lg:px-10 bg-[#FAFAFC]">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="mb-16 text-center md:text-left">
            <h2 className="text-[54px] font-bold text-[#0F172A] leading-[1.05] tracking-tight">One platform.<br className="hidden md:block" />Every corner of campus.</h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: Navigation, title: "Campus Navigator", desc: "Step-by-step directions to any room, lab, or building. Never get lost again.", color: "text-red-500", bg: "bg-red-500/10" },
              { icon: Users, title: "Faculty Directory", desc: "Search professors, view cabin numbers, office hours, send meeting requests.", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: BookOpen, title: "Academic Hub", desc: "Notes, PYQs, lab manuals — organized by semester, branch, and subject.", color: "text-green-500", bg: "bg-green-500/10" },
              { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell textbooks, electronics, and dorm essentials with your peers.", color: "text-pink-500", bg: "bg-pink-500/10" },
              { icon: Search, title: "Lost & Found", desc: "Smart Gmail sync auto-parses campus emails into a searchable database.", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Shield, title: "Societies & Clubs", desc: "Discover 50+ technical, cultural, and sports societies with event listings.", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Coffee, title: "Shops & Eateries", desc: "View canteen menus and find exactly where to eat between classes.", color: "text-teal-500", bg: "bg-teal-500/10" },
              { icon: Wifi, title: "Wi-Fi Hotspots", desc: "Find high-speed Wi-Fi zones — hostels, labs, library, and more.", color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { icon: LifeBuoy, title: "Campus Support", desc: "IT helpdesk, finance, academics, hostel, schedule for emergency contacts.", color: "text-orange-500", bg: "bg-orange-500/10" }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={staggerItem}
                whileHover={{ y: -6 }}
                className="bg-white border border-[#E5E7EB]/80 rounded-[20px] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className={`w-12 h-12 rounded-[14px] ${feature.bg} flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-[26px] font-bold text-[#0F172A] mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6 lg:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="text-[54px] font-bold text-[#0F172A] tracking-tight leading-[1.05]">Three steps to your campus.</h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            {/* Dotted line connecting steps */}
            <div className="hidden md:block absolute top-[48px] left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-[#E5E7EB] z-0"></div>

            {[
              { num: "01", title: "Sign in with Google", desc: "Use your university email (@thapar.edu) to get instant, role-based access — Student, Faculty, or Admin." },
              { num: "02", title: "Search anything", desc: "Professor cabin, classroom location, a lost item, society details, Wi-Fi password. One search bar. Everything found." },
              { num: "03", title: "Get things done", desc: "Navigate, request meetings, buy textbooks, report lost items, discover societies. SnapLocate handles the rest." }
            ].map((step, i) => (
              <motion.div key={i} variants={staggerItem} className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black text-[#0F172A] opacity-5 pointer-events-none select-none z-0 leading-none">
                  {step.num}
                </div>
                <div className="w-16 h-16 rounded-[16px] bg-white border border-[#E5E7EB] flex items-center justify-center mb-8 shadow-sm relative z-10">
                  <span className="text-[20px] font-black text-[#0F172A]">{step.num}</span>
                </div>
                <h3 className="text-[26px] font-bold text-[#0F172A] mb-3 tracking-tight relative z-10">{step.title}</h3>
                <p className="text-[17px] text-[#475569] leading-relaxed relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-28 px-6 lg:px-10 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="mb-16 text-center md:text-left">
            <h2 className="text-[54px] font-bold text-[#0F172A] tracking-tight leading-[1.05]">Your role. Your dashboard.</h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
          >
            {/* Student Role */}
            <motion.div variants={staggerItem} whileHover={{ y: -6 }} className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden relative transition-all duration-300">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-[#5B4DFF]"></div>
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[12px] font-bold text-[#5B4DFF] uppercase tracking-widest">Primary OS</p>
                  <div className="bg-[#EEF0FF] text-[#5B4DFF] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Default</div>
                </div>
                <h3 className="text-[26px] font-bold text-[#0F172A] mb-3 tracking-tight">Students</h3>
                <p className="text-[16px] text-[#475569] mb-8 leading-relaxed flex-grow">
                  Navigate campus, find professors, download notes, buy textbooks, report lost items, discover societies.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {['Navigator', 'Directory', 'Marketplace', 'Lost & Found'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-[12px] font-semibold text-[#475569]">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Faculty Role */}
            <motion.div variants={staggerItem} whileHover={{ y: -6 }} className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden relative transition-all duration-300">
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <div className="p-8 flex flex-col h-full">
                <p className="text-[12px] font-bold text-orange-500 uppercase tracking-widest mb-6">Faculty OS</p>
                <h3 className="text-[26px] font-bold text-[#0F172A] mb-3 tracking-tight">Faculty</h3>
                <p className="text-[16px] text-[#475569] mb-8 leading-relaxed flex-grow">
                  Manage your public profile, respond to student meeting requests, and upload course materials.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {['Profile', 'Inbox', 'Instructor Admin', 'Schedule'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-[12px] font-semibold text-[#475569]">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Admin Role */}
            <motion.div variants={staggerItem} whileHover={{ y: -6 }} className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden relative transition-all duration-300">
              <div className="h-1.5 w-full bg-gradient-to-r from-slate-400 to-slate-700"></div>
              <div className="p-8 flex flex-col h-full">
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">Admin OS</p>
                <h3 className="text-[26px] font-bold text-[#0F172A] mb-3 tracking-tight">Admins</h3>
                <p className="text-[16px] text-[#475569] mb-8 leading-relaxed flex-grow">
                  Full CRUD access to all platform data — classrooms, societies, marketplace, lost & found sync.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {['Full Data', 'Gmail Sync', 'Approvals', 'Roles'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-[12px] font-semibold text-[#475569]">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-28 px-6 lg:px-10 bg-white">
        <motion.div {...fadeUp} className="max-w-4xl mx-auto text-center">
          <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-10 md:p-16 shadow-sm relative overflow-hidden flex flex-col items-center">
            <div className="text-[64px] font-serif text-[#E5E7EB] leading-none select-none mb-6">“</div>
            <p className="text-[22px] md:text-[28px] font-medium text-[#0F172A] mb-10 leading-[1.5] tracking-tight text-center">
              SnapLocate replaced four different portals I had to check every morning. Now it's literally just one tab — professors, notes, marketplace, everything.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B4DFF] to-blue-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
                ST
              </div>
              <div className="text-center md:text-left">
                <p className="text-[16px] font-bold text-[#0F172A]">CSE Student</p>
                <p className="text-[14px] text-[#475569]">Batch 2026, Thapar Institute</p>
              </div>
              <div className="hidden md:block w-px h-8 bg-[#E5E7EB] mx-2"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50/50 border border-green-200/50 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                <span className="text-[11px] font-bold text-green-700 tracking-widest uppercase">Verified User</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-28 px-6 lg:px-10 bg-white">
        <motion.div {...fadeUp} className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-b from-[#FAFAFC] to-white border border-[#E5E7EB] rounded-[32px] p-16 md:p-24 text-center shadow-sm relative overflow-hidden flex flex-col items-center">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-[40px] md:text-[54px] font-black text-[#0F172A] mb-6 tracking-tight leading-[1]">Your campus is waiting.</h2>
              <p className="text-[20px] text-[#475569] mb-10">
                Join 1100+ students already using SnapLocate at Thapar Institute of Engineering & Technology.
              </p>
              <div className="relative inline-block group">
                <div className="absolute inset-0 bg-[#5B4DFF]/20 blur-xl rounded-full scale-110 group-hover:bg-[#5B4DFF]/30 transition-all duration-300"></div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative z-10">
                  <Link to="/login" className="bg-[#5B4DFF] text-white px-8 py-4 rounded-full font-semibold transition-colors text-[17px] flex items-center gap-2">
                    Get Started Free <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
              <p className="text-[13px] text-[#475569] mt-6">University email required • No credit card</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-12 pb-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#475569] border-t border-[#E5E7EB] pt-8">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0F172A]" />
            <span className="font-bold text-[#0F172A]">SnapLocate</span>
            <span className="mx-2 text-[#E5E7EB]">|</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 md:gap-8 font-medium">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">Guide</a>
            <Link to="/login" className="hover:text-[#0F172A] transition-colors">Admin</Link>
            <a href="#" className="hover:text-[#0F172A] transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
