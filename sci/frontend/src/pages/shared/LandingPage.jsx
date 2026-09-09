import './LandingPage.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, Calendar, MapPin, Users, MessageSquare, TrendingUp, Clock, Layers, CheckCircle, Menu, X, Shield, Cpu } from 'lucide-react';
import { Button } from '../../components/ui';
export const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeShowcaseTab, setActiveShowcaseTab] = useState('ai');
    const [scrolled, setScrolled] = useState(false);
    // For hero mockup 3D tilt effect
    const cardX = useMotionValue(0);
    const cardY = useMotionValue(0);
    const springX = useSpring(cardX, { stiffness: 150, damping: 15 });
    const springY = useSpring(cardY, { stiffness: 150, damping: 15 });
    // Transform rotation values based on mouse cursor position relative to the element center
    const rotateX = useTransform(springY, [-200, 200], [10, -10]);
    const rotateY = useTransform(springX, [-200, 200], [-10, 10]);
    // Handle scroll trigger for navbar transparent/glass state
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            }
            else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        cardX.set(mouseX);
        cardY.set(mouseY);
    };
    const handleMouseLeave = () => {
        cardX.set(0);
        cardY.set(0);
    };
    // AI assistant showcase simulation
    const [chatMessages, setChatMessages] = useState([
        { sender: 'ai', text: 'Welcome! I am your AI campus co-pilot. How can I assist you with your academic operations today?' }
    ]);
    const [aiTyping, setAiTyping] = useState(false);
    const simulateAiChat = (userPrompt, aiResponse) => {
        if (aiTyping)
            return;
        setChatMessages((prev) => [...prev, { sender: 'user', text: userPrompt }]);
        setAiTyping(true);
        setTimeout(() => {
            setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
            setAiTyping(false);
        }, 1500);
    };
    return (<div className="pg-landingpage-1">
      {/* Noise filter overlay for rich organic textured depth */}
      <div className="pg-landingpage-2"/>
      
      {/* Ambient background glow elements (luxurious wine-red mesh effect) */}
      <div className="pg-landingpage-3"/>
      <div className="pg-landingpage-4"/>
      <div className="pg-landingpage-5"/>
      <div className="pg-landingpage-6"/>

      {/* Floating Glass Navigation */}
      <header className="pg-landingpage-7">
        <motion.nav initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 22  }} className={`w-full max-w-6xl transition-all duration-300 rounded-full border border-white/[0.06] ${scrolled
            ? 'bg-[#161616]/75 backdrop-blur-2xl shadow-[0_24px_50px_-16px_rgba(0,0,0,0.7)] px-6 py-3.5'
            : 'bg-[#161616]/30 backdrop-blur-md px-6 py-4'} flex items-center justify-between`}>
          {/* Logo */}
          <Link to="/" className="pg-landingpage-8">
            <div className="pg-landingpage-9">
              <img src="/logo.png" alt="SCME-AWN Logo" className="pg-landingpage-10" width="36" height="36" />
            </div>
            <img src="/title.png" alt="SCME-AWN" className="h-5 w-auto object-contain" />
          </Link>

          {/* Nav links */}
          <div className="pg-landingpage-12">
            <a href="#features" className="pg-landingpage-13">Features</a>
            <a href="#showcase" className="pg-landingpage-13">Showcase</a>
            <a href="#roadmap" className="pg-landingpage-13">Timeline</a>
            <a href="#stats" className="pg-landingpage-13">Metrics</a>
          </div>

          {/* CTA Buttons */}
          <div className="pg-landingpage-14">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="pg-landingpage-15">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="primary" size="sm" className="pg-landingpage-16">
                Launch Portal
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="pg-landingpage-17">
            {mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </motion.nav>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pg-landingpage-18">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-19">
              Features
            </a>
            <a href="#showcase" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-19">
              Showcase
            </a>
            <a href="#roadmap" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-19">
              Timeline
            </a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-19">
              Metrics
            </a>
            <div className="pg-landingpage-20">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-21">
                <Button variant="outline" size="md" className="pg-landingpage-22">
                  Sign In
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="pg-landingpage-21">
                <Button variant="primary" size="md" className="pg-landingpage-23">
                  Launch Portal
                </Button>
              </Link>
            </div>
          </motion.div>)}
      </AnimatePresence>

      {/* Large Hero Section */}
      <section className="pg-landingpage-24">
        <div className="pg-landingpage-25">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="pg-landingpage-26">
            <Sparkles size={12}/>
            <span>Next-Generation Intelligent Campus Platform</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="pg-landingpage-27">
            The intelligent operating system for <span className="pg-landingpage-28">modern campuses.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="pg-landingpage-29">
            SCME-AWN is a sleek, AI-powered college management ecosystem. Completely redesigned from the core to optimize administration, analytics, and student life into a premium, future-ready native mobile engine.
          </motion.p>

          {/* Action CTAs */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="pg-landingpage-30">
            <Link to="/login" className="pg-landingpage-31">
              <Button size="lg" className="pg-landingpage-32">
                Launch Portal <ArrowRight size={16}/>
              </Button>
            </Link>
            <a href="#features" className="pg-landingpage-31">
              <Button variant="outline" size="lg" className="pg-landingpage-33">
                Explore Ecosystem
              </Button>
            </a>
          </motion.div>
        </div>

        {/* 3D Mockup Container */}
        <motion.div initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="pg-landingpage-34">
          <motion.div style={{ rotateX, rotateY }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="pg-landingpage-35">
            {/* Mockup Header bar */}
            <div className="pg-landingpage-36">
              <div className="pg-landingpage-37">
                <div className="pg-landingpage-38"/>
                <div className="pg-landingpage-39"/>
                <div className="pg-landingpage-40"/>
                <span className="pg-landingpage-41">dashboard.scme-awn.app</span>
              </div>
              <div className="pg-landingpage-42">
                <div className="pg-landingpage-43"/>
                Live Demo Mode
              </div>
            </div>

            {/* Mockup Dashboard content */}
            <div className="pg-landingpage-44">
              {/* Sidebar Mock */}
              <div className="pg-landingpage-45">
                <div className="pg-landingpage-46">
                  <div className="pg-landingpage-47"/>
                  <div className="pg-landingpage-48"/>
                </div>
                <div className="pg-landingpage-49">
                  <div className="pg-landingpage-50"/>
                </div>
                {[1, 2, 3, 4].map((i) => (<div key={i} className="pg-landingpage-51">
                    <div className="pg-landingpage-52"/>
                  </div>))}
              </div>

              {/* Grid Mock */}
              <div className="pg-landingpage-53">
                <div className="pg-landingpage-54">
                  <div className="pg-landingpage-55">
                    <div className="pg-landingpage-56"/>
                    <Sparkles size={14} className="pg-landingpage-57"/>
                  </div>
                  <div className="pg-landingpage-58"/>
                  <div className="pg-landingpage-59"/>
                  <div className="pg-landingpage-60">
                    Start AI Query
                  </div>
                </div>

                <div className="pg-landingpage-61">
                  <div className="pg-landingpage-62"/>
                  <div className="pg-landingpage-63">98.2%</div>
                  <div className="pg-landingpage-64">
                    <div className="pg-landingpage-65"/>
                  </div>
                </div>

                <div className="pg-landingpage-66">
                  <div className="pg-landingpage-67"/>
                  <div className="pg-landingpage-68"/>
                  <div className="pg-landingpage-69"/>
                </div>
                <div className="pg-landingpage-70">
                  <div className="pg-landingpage-71"/>
                  <div className="pg-landingpage-72">
                    <div className="pg-landingpage-73"/>
                    <div className="pg-landingpage-74"/>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="pg-landingpage-75">
          <span className="pg-landingpage-76">Scroll Down</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="pg-landingpage-77"
          />
        </div>
      </section>

      {/* Feature Cards Grid (Future Mobile Ready Structure) */}
      <section id="features" className="pg-landingpage-78">
        <div className="pg-landingpage-79">
          <h2 className="pg-landingpage-80">Ecosystem Overview</h2>
          <p className="pg-landingpage-81">A fully integrated campus powerhouse.</p>
        </div>

        <div className="pg-landingpage-82">
          {/* Card 1 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <Sparkles size={22}/>
            </div>
            <h3 className="pg-landingpage-85">AI Assistant</h3>
            <p className="pg-landingpage-86">
              Academic operations assistant capable of answering schedule, attendance, and exam syllabus queries in milliseconds.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <Calendar size={22}/>
            </div>
            <h3 className="pg-landingpage-85">Schedules & Timetable</h3>
            <p className="pg-landingpage-86">
              Highly responsive real-time timetable matrix adapting automatically to campus events and class rearrangements.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <MapPin size={22}/>
            </div>
            <h3 className="pg-landingpage-85">Faculty Indoor Locator</h3>
            <p className="pg-landingpage-86">
              Interactive navigation grids guiding students directly to faculty cabins and administrative locations across the campus.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <TrendingUp size={22}/>
            </div>
            <h3 className="pg-landingpage-85">Career placements</h3>
            <p className="pg-landingpage-86">
              Direct telemetry interfaces displaying recruitment stats, company pipelines, placement tests, and interview rounds.
            </p>
          </motion.div>

          {/* Card 5 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <MessageSquare size={22}/>
            </div>
            <h3 className="pg-landingpage-85">Forums & Discussions</h3>
            <p className="pg-landingpage-86">
              Internal networks for announcements, queries, study-groups, and real-time collaboration with staff.
            </p>
          </motion.div>

          {/* Card 6 */}
          <motion.div whileHover={{ y: -8 }} className="pg-landingpage-83">
            <div className="pg-landingpage-84">
              <Users size={22}/>
            </div>
            <h3 className="pg-landingpage-85">Unified Profiles</h3>
            <p className="pg-landingpage-86">
              Consolidated digital profiles displaying grading curves, attendance charts, registration logs, and dynamic schedules.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Alternating Content Blocks */}
      <section className="pg-landingpage-87">
        {/* Block 1 */}
        <div className="pg-landingpage-88">
          <div className="pg-landingpage-89">
            <div className="pg-landingpage-90">
              Operational Intelligence
            </div>
            <h3 className="pg-landingpage-91">Smart scheduling that acts in real-time.</h3>
            <p className="pg-landingpage-86">
              No more static PDFs or broken calendar notifications. CampusOS connects to class rooms, examination calendars, and teacher locator databases to automatically suggest room changes, timetable shifts, and reschedule requests.
            </p>
            <div className="pg-landingpage-92">
              <div className="pg-landingpage-93">
                <CheckCircle size={16} className="pg-landingpage-57"/>
                <span className="pg-landingpage-94">Auto-sync with faculty schedules</span>
              </div>
              <div className="pg-landingpage-93">
                <CheckCircle size={16} className="pg-landingpage-57"/>
                <span className="pg-landingpage-94">Instant clash detection algorithms</span>
              </div>
            </div>
          </div>
          <div className="pg-landingpage-95">
            <div className="pg-landingpage-96"/>
            {/* Visual representation of Timetable scheduling */}
            <div className="pg-landingpage-97">
              <div className="pg-landingpage-98">
                <span className="pg-landingpage-99">Monday Schedule Matrix</span>
                <span className="pg-landingpage-100">Optimized</span>
              </div>
              <div className="pg-landingpage-101">
                <div className="pg-landingpage-102">
                  <div>
                    <h4 className="pg-landingpage-103">Advanced Cryptography</h4>
                    <span className="pg-landingpage-104">9:00 AM - 10:30 AM</span>
                  </div>
                  <span className="pg-landingpage-105">Lab 302</span>
                </div>
                <div className="pg-landingpage-106">
                  <div>
                    <h4 className="pg-landingpage-103">Parallel Computing</h4>
                    <span className="pg-landingpage-104">11:00 AM - 12:30 PM</span>
                  </div>
                  <span className="pg-landingpage-105">L-204</span>
                </div>
                <div className="pg-landingpage-107">
                  <div>
                    <span className="pg-landingpage-108">Conflict Resolved</span>
                    <h4 className="pg-landingpage-103">Neural Nets Lab</h4>
                    <span className="pg-landingpage-104">2:00 PM - 3:30 PM</span>
                  </div>
                  <span className="pg-landingpage-105">Cabin C-102</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2 */}
        <div className="pg-landingpage-88">
          <div className="pg-landingpage-109">
            <div className="pg-landingpage-90">
              Career Acceleration
            </div>
            <h3 className="pg-landingpage-91">Automate placements. Accelerate growth.</h3>
            <p className="pg-landingpage-86">
              Integrate placement statistics, company mock tests, CV reviews, and recruitment tracking in a single portal. Get direct notifications when recruiters look at your graduation records and check out customized prep materials curated by AI.
            </p>
            <div className="pg-landingpage-92">
              <div className="pg-landingpage-93">
                <CheckCircle size={16} className="pg-landingpage-57"/>
                <span className="pg-landingpage-94">Direct portal submission to partner recruiters</span>
              </div>
              <div className="pg-landingpage-93">
                <CheckCircle size={16} className="pg-landingpage-57"/>
                <span className="pg-landingpage-94">Real-time company hiring pipeline stats</span>
              </div>
            </div>
          </div>
          <div className="pg-landingpage-110">
            <div className="pg-landingpage-111"/>
            <div className="pg-landingpage-112">
              <div className="pg-landingpage-113">
                <span className="pg-landingpage-99">Job Pipelines</span>
                <span className="pg-landingpage-114">12 Active Companies</span>
              </div>
              <div className="pg-landingpage-115">
                <div>
                  <div className="pg-landingpage-116">
                    <span className="pg-landingpage-117">Stripe Core SWE</span>
                    <span className="pg-landingpage-118">Step 3/4</span>
                  </div>
                  <div className="pg-landingpage-119">
                    <div className="pg-landingpage-120"/>
                  </div>
                </div>
                <div>
                  <div className="pg-landingpage-116">
                    <span className="pg-landingpage-117">Google Cloud Solutions</span>
                    <span className="pg-landingpage-118">Step 2/4</span>
                  </div>
                  <div className="pg-landingpage-119">
                    <div className="pg-landingpage-121"/>
                  </div>
                </div>
                <div>
                  <div className="pg-landingpage-116">
                    <span className="pg-landingpage-117">Linear Infrastructure Eng</span>
                    <span className="pg-landingpage-118">Offers Out</span>
                  </div>
                  <div className="pg-landingpage-119">
                    <div className="pg-landingpage-122"/>
                  </div>
                </div>
              </div>
              <div className="pg-landingpage-123">
                <div className="pg-landingpage-124">
                  <div className="pg-landingpage-125"/>
                  <span className="pg-landingpage-126">Stripe interview scheduled</span>
                </div>
                <span className="pg-landingpage-127">Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Split Layout: Philosophy & Telemetry */}
      <section className="pg-landingpage-128">
        <div className="pg-landingpage-129">
          <div className="pg-landingpage-130">
            <h2 className="pg-landingpage-131">Modern Architecture</h2>
            <h3 className="pg-landingpage-132">Built for web today. Ported to mobile tomorrow.</h3>
            <p className="pg-landingpage-86">
              Every card, table grid, notification, and state manager inside CampusOS is built using decoupled RESTful adapters. This ensures that the interface you use on your browser is natively compatible with native mobile layout requirements.
            </p>
            <div className="pg-landingpage-133">
              <div className="pg-landingpage-134">
                <div className="pg-landingpage-135">
                  <Layers size={18}/>
                </div>
                <h4 className="pg-landingpage-136">Modular Views</h4>
                <p className="pg-landingpage-137">Isolated containers adapt seamlessly to standard app sheets and sliders.</p>
              </div>
              <div className="pg-landingpage-134">
                <div className="pg-landingpage-135">
                  <Cpu size={18}/>
                </div>
                <h4 className="pg-landingpage-136">Engine Decoupling</h4>
                <p className="pg-landingpage-137">Shared business logic between Web applications and React Native bundles.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Telemetry Visual Layout */}
          <div className="pg-landingpage-138">
            <div className="pg-landingpage-139"/>
            <div className="pg-landingpage-55">
              <span className="pg-landingpage-140">Core Telemetry</span>
              <div className="pg-landingpage-141"/>
            </div>
            
            <div className="pg-landingpage-115">
              {/* Telemetry rows */}
              <div className="pg-landingpage-142">
                <div className="pg-landingpage-143">
                  <div className="pg-landingpage-144">
                    <Shield size={14}/>
                  </div>
                  <span className="pg-landingpage-145">Authorization Engine</span>
                </div>
                <span className="pg-landingpage-146">RSA-256 SECURE</span>
              </div>

              <div className="pg-landingpage-142">
                <div className="pg-landingpage-143">
                  <div className="pg-landingpage-144">
                    <Clock size={14}/>
                  </div>
                  <span className="pg-landingpage-145">Network Response Latency</span>
                </div>
                <span className="pg-landingpage-146">~15ms AVG</span>
              </div>

              <div className="pg-landingpage-142">
                <div className="pg-landingpage-143">
                  <div className="pg-landingpage-144">
                    <Layers size={14}/>
                  </div>
                  <span className="pg-landingpage-145">State Synchronizer</span>
                </div>
                <span className="pg-landingpage-147">SYNCED LIVE</span>
              </div>
            </div>

            <div className="pg-landingpage-148">
              <span className="pg-landingpage-149">Console Log</span>
              <p className="pg-landingpage-150">
                [System] Initialization complete. Connected to master DB endpoint. Pushing update stream...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Project Showcase */}
      <section id="showcase" className="pg-landingpage-78">
        <div className="pg-landingpage-151">
          <h2 className="pg-landingpage-80">Live Showcase</h2>
          <p className="pg-landingpage-81">Interact with the core engines.</p>
        </div>

        {/* Tab triggers */}
        <div className="pg-landingpage-152">
          <div className="pg-landingpage-153">
            <button onClick={() => setActiveShowcaseTab('ai')} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${activeShowcaseTab === 'ai'
            ? 'bg-[#E31B23] text-white shadow-[0_4px_12px_rgba(227,27,35,0.25)]'
            : 'text-[#B5B5B5] hover:text-white'}`}>
              Academic AI Assistant
            </button>
            <button onClick={() => setActiveShowcaseTab('analytics')} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${activeShowcaseTab === 'analytics'
            ? 'bg-[#E31B23] text-white shadow-[0_4px_12px_rgba(227,27,35,0.25)]'
            : 'text-[#B5B5B5] hover:text-white'}`}>
              Placements Analytics
            </button>
          </div>
        </div>

        {/* Showcase panel */}
        <div className="pg-landingpage-154">
          <div className="pg-landingpage-155"/>
          
          <AnimatePresence mode="wait">
            {activeShowcaseTab === 'ai' ? (<motion.div key="ai-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="pg-landingpage-156">
                {/* Chat window */}
                <div className="pg-landingpage-157">
                  {chatMessages.map((msg, index) => (<div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs font-semibold ${msg.sender === 'user'
                    ? 'bg-[#E31B23] text-white rounded-br-none shadow-[0_4px_12px_rgba(227,27,35,0.15)]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-[#B5B5B5] rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>))}
                  {aiTyping && (<div className="pg-landingpage-158">
                      <div className="pg-landingpage-159">
                        <span className="pg-landingpage-160"/>
                        <span className="pg-landingpage-161"/>
                        <span className="pg-landingpage-162"/>
                      </div>
                    </div>)}
                </div>

                {/* Prompt triggers */}
                <div className="pg-landingpage-163">
                  <span className="pg-landingpage-164">Suggested Prompt Operations</span>
                  <div className="pg-landingpage-165">
                    <button onClick={() => simulateAiChat('What is my attendance in advanced crypto?', 'Your attendance in Advanced Cryptography is 92.5%. You have missed 2 classes out of 24.')} className="pg-landingpage-166" disabled={aiTyping}>
                      Check cryptography attendance
                    </button>
                    <button onClick={() => simulateAiChat('When is my next assignment due?', 'Your next assignment, "Diffie-Hellman Protocol Implementation", is due on Friday, July 10th at 11:59 PM.')} className="pg-landingpage-166" disabled={aiTyping}>
                      Check assignment due dates
                    </button>
                    <button onClick={() => simulateAiChat('Locate Dr. Evelyn Vance', 'Dr. Evelyn Vance is currently in Cabin 402, Block C. Office hours are active until 4:30 PM.')} className="pg-landingpage-166" disabled={aiTyping}>
                      Locate Dr. Vance
                    </button>
                  </div>
                </div>
              </motion.div>) : (<motion.div key="analytics-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="pg-landingpage-167">
                {/* Stats grid */}
                <div className="pg-landingpage-168">
                  <div className="pg-landingpage-169">Active Hiring Rate</div>
                  <div className="pg-landingpage-170">96.4%</div>
                  <span className="pg-landingpage-171">
                    +4.2% from previous term
                  </span>
                </div>
                <div className="pg-landingpage-168">
                  <div className="pg-landingpage-169">Highest CTC Secured</div>
                  <div className="pg-landingpage-172">48 LPA</div>
                  <span className="pg-landingpage-173">Secured at Stripe Tech</span>
                </div>
                <div className="pg-landingpage-168">
                  <div className="pg-landingpage-169">Average Placement Speed</div>
                  <div className="pg-landingpage-170">12 Days</div>
                  <span className="pg-landingpage-173">From profile approval to offer</span>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </section>

      {/* Modern Timeline (Roadmap) */}
      <section id="roadmap" className="pg-landingpage-174">
        <div className="pg-landingpage-79">
          <h2 className="pg-landingpage-80">Ecosystem Roadmap</h2>
          <p className="pg-landingpage-81">Timeline of campus integration.</p>
        </div>

        {/* Timeline Cards */}
        <div className="pg-landingpage-175">
          {/* Phase 1 */}
          <div className="pg-landingpage-176">
            {/* Timeline Dot */}
            <div className="pg-landingpage-177"/>
            <div className="pg-landingpage-178">PHASE 01</div>
            
            <div className="pg-landingpage-179">
              <h4 className="pg-landingpage-180">Core Academic Engine Deployment</h4>
              <p className="pg-landingpage-181">
                Rollout of timetables, student profiles, grading reports, announcements databases, and multi-role dashboard panels.
              </p>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="pg-landingpage-176">
            {/* Timeline Dot */}
            <div className="pg-landingpage-177"/>
            <div className="pg-landingpage-178">PHASE 02</div>
            
            <div className="pg-landingpage-179">
              <h4 className="pg-landingpage-180">Cognitive Copilot & Locators</h4>
              <p className="pg-landingpage-181">
                Release of the real-time AI Academic Assistant, integrated campus-wide chat interfaces, and indoor mapping grids.
              </p>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="pg-landingpage-176">
            {/* Timeline Dot */}
            <div className="pg-landingpage-177"/>
            <div className="pg-landingpage-178">PHASE 03</div>
            
            <div className="pg-landingpage-182">
              <div className="pg-landingpage-183">In Development</div>
              <h4 className="pg-landingpage-180">Career Pipeline Engine</h4>
              <p className="pg-landingpage-181">
                Recruitment portal integration linking partner corporations directly to college grade lists and test channels.
              </p>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="pg-landingpage-176">
            {/* Timeline Dot */}
            <div className="pg-landingpage-184"/>
            <div className="pg-landingpage-185">PHASE 04</div>
            
            <div className="pg-landingpage-186">
              <h4 className="pg-landingpage-180">Native Mobile App Ports</h4>
              <p className="pg-landingpage-181">
                Packaging all UI component logic into dedicated iOS and Android application packages for fluid native operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Statistics Section */}
      <section id="stats" className="pg-landingpage-174">
        <div className="pg-landingpage-187">
          <div className="pg-landingpage-139"/>
          
          <div className="pg-landingpage-134">
            <span className="pg-landingpage-188">AI Operations</span>
            <div className="pg-landingpage-189">1.2M+</div>
            <p className="pg-landingpage-137">Queries resolved this term</p>
          </div>

          <div className="pg-landingpage-134">
            <span className="pg-landingpage-188">Sync Latency</span>
            <div className="pg-landingpage-190">~15ms</div>
            <p className="pg-landingpage-137">Real-time query execution</p>
          </div>

          <div className="pg-landingpage-134">
            <span className="pg-landingpage-188">Attendance Rate</span>
            <div className="pg-landingpage-189">98.2%</div>
            <p className="pg-landingpage-137">Average campus logging sync</p>
          </div>

          <div className="pg-landingpage-134">
            <span className="pg-landingpage-188">Placement Velocity</span>
            <div className="pg-landingpage-191">100%</div>
            <p className="pg-landingpage-137">Student career pipelines synced</p>
          </div>
        </div>
      </section>

      {/* Call-to-action Section */}
      <section className="pg-landingpage-174">
        <div className="pg-landingpage-192">
          {/* Radial wine glow inside the CTA card */}
          <div className="pg-landingpage-193"/>

          <div className="pg-landingpage-194">
            <h2 className="pg-landingpage-195">Ready to integrate the future of campus operations?</h2>
            <p className="pg-landingpage-196">
              Experience how a premium, minimal, and fully synced AI ecosystem can transform student engagement and administrator productivity.
            </p>
          </div>

          <div className="pg-landingpage-197">
            <Link to="/login" className="pg-landingpage-31">
              <Button size="lg" className="pg-landingpage-198">
                Launch Portal
              </Button>
            </Link>
            <Link to="/register" className="pg-landingpage-31">
              <Button variant="outline" size="lg" className="pg-landingpage-199">
                Request System Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="pg-landingpage-200">
        <div className="pg-landingpage-201">
          {/* Column 1 */}
          <div className="pg-landingpage-115">
            <div className="pg-landingpage-124">
              <div className="pg-landingpage-202">
                <img src="/logo.png" alt="SCME-AWN Logo" className="pg-landingpage-10" width="32" height="32" />
              </div>
              <span className="pg-landingpage-11">SCME-AWN</span>
            </div>
            <p className="pg-landingpage-181">
              Intelligent Campus AI Management Ecosystem. Decoupled modules built for native web and mobile integrations.
            </p>
          </div>

          {/* Column 2 */}
          <div className="pg-landingpage-92">
            <h4 className="pg-landingpage-203">Ecosystem Modules</h4>
            <ul className="pg-landingpage-204">
              <li><a href="#features" className="pg-landingpage-205">AI Academic Assistant</a></li>
              <li><a href="#features" className="pg-landingpage-205">Smart Timetabling Matrix</a></li>
              <li><a href="#features" className="pg-landingpage-205">Indoor Faculty Navigator</a></li>
              <li><a href="#features" className="pg-landingpage-205">Career Placements Stream</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="pg-landingpage-92">
            <h4 className="pg-landingpage-203">Operational Links</h4>
            <ul className="pg-landingpage-204">
              <li><Link to="/login" className="pg-landingpage-205">Administrator Portal</Link></li>
              <li><Link to="/login" className="pg-landingpage-205">Faculty Interface</Link></li>
              <li><Link to="/login" className="pg-landingpage-205">Student Dashboard</Link></li>
              <li><Link to="/register" className="pg-landingpage-205">Developer Sandbox</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div className="pg-landingpage-115">
            <h4 className="pg-landingpage-203">Platform Specifications</h4>
            <div className="pg-landingpage-165">
              <span className="pg-landingpage-206">React + Vite</span>
              <span className="pg-landingpage-206">Tailwind CSS</span>
              <span className="pg-landingpage-207">Framer Motion</span>
            </div>
            <p className="pg-landingpage-104">
              &copy; {new Date().getFullYear()} SCME-AWN Academic Group. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>);
};
