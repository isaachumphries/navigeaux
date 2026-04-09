"use client";

import Link from "next/link";

export default function Start() {
  return (
    <main className="relative w-screen h-screen overflow-hidden font-sans">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/campus.jpg')" }}
      />
        {/*overlay*/}
      <div className="absolute inset-0 bg-violet-400/70" />

      {/* navigation bar. z-10 makes nav bar sits above bg and overlay. justify between changed the log in sign up button to the end */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-8 py-5">


        {/* login button. rounded-full: pill shape. hover bg fill. transition-all duration-200: hover effect */}
        <Link href="/login">
          <button className="px-6 py-2 rounded-full border-2 border-[#FDD023] text-[#FDD023] font-semibold text-sm hover:bg-[#FDD023] hover:text-[#461D7C] transition-all duration-200">
            Log In / Sign Up
          </button>
        </Link>
      </nav>

      {/* lsu student only section. pill shape */}
      <section className="absolute inset-0 z-10 flex items-center justify-center px-6">
        {/* text doesnt stretch too wide */}
        <div className="max-w-xl text-center">

          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-[#FDD023]/20 border border-[#FDD023]/50 text-[#FDD023] text-xs font-semibold uppercase tracking-widest">
            LSU Students Only
          </span>

          <h1
            style={{ fontFamily: "'Georgia', serif" }}
            className="text-white text-5xl font-bold leading-tight mb-4"
          > NAVIGEAUX <br />
          </h1>

          <p className="text-white/80 text-base leading-relaxed mb-8">
            Navigeaux is the on-campus navigation tool built exclusively for LSU
            students. Discover classrooms and more. Sign in with your LSU email to get started!
          </p>

          {/* get start button direct to login page */}
          <Link href="/login">
            <button className="px-8 py-3 rounded-full bg-[#FDD023] text-[#461D7C] font-bold text-sm hover:bg-yellow-300 transition-all duration-200 shadow-lg">
              Get Started →
            </button>
          </Link>

        </div>
      </section>

    </main>
  );
}