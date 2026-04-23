// "use client";

// import Link from "next/link";

// export default function Start() {
//   return (
//     <main className="relative w-screen h-screen overflow-hidden font-sans">

//       {/* BACKGROUND IMAGE — replace /bg.jpg with your image later */}
//       <div
//         className="absolute inset-0 bg-cover bg-center"
//         style={{ backgroundImage: "url('/bg.jpg')" }}
//       />

//       {/* DARK OVERLAY */}
//       <div className="absolute inset-0 bg-black/50" />

//       {/* NAVBAR */}
//       <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-5">

//         {/* LOGO + NAME */}
//         <div className="flex items-center gap-3">
//           {/* Replace with <img src="/logo.png" /> later */}
//           <div className="w-10 h-10 rounded-full bg-[#FDD023] flex items-center justify-center text-[#461D7C] font-bold text-lg">
//             N
//           </div>
//           <span
//             style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.05em" }}
//             className="text-white text-2xl font-bold tracking-wide"
//           >
//             Navigeaux
//           </span>
//         </div>

//         {/* LOGIN BUTTON — goes to login.tsx */}
//         <Link href="/login">
//           <button className="px-6 py-2 rounded-full border-2 border-[#FDD023] text-[#FDD023] font-semibold text-sm hover:bg-[#FDD023] hover:text-[#461D7C] transition-all duration-200">
//             Log In / Sign Up
//           </button>
//         </Link>
//       </nav>

//       {/* ABOUT SECTION */}
//       <section className="absolute inset-0 z-10 flex items-center justify-center px-6">
//         <div className="max-w-xl text-center">

//           <span className="inline-block mb-4 px-4 py-1 rounded-full bg-[#FDD023]/20 border border-[#FDD023]/50 text-[#FDD023] text-xs font-semibold uppercase tracking-widest">
//             LSU Students Only
//           </span>

//           <h1
//             style={{ fontFamily: "'Georgia', serif" }}
//             className="text-white text-5xl font-bold leading-tight mb-4"
//           >
//             Find Your Way <br />
//             <span className="text-[#FDD023]">Around Campus</span>
//           </h1>

//           <p className="text-white/80 text-base leading-relaxed mb-8">
//             Navigeaux is the on-campus navigation tool built exclusively for LSU
//             students. Discover buildings, classrooms, dining halls, and more —
//             all in one place. Sign in with your LSU credentials to get started.
//           </p>

//           {/* GET STARTED — also goes to login.tsx */}
//           <Link href="/login">
//             <button className="px-8 py-3 rounded-full bg-[#FDD023] text-[#461D7C] font-bold text-sm hover:bg-yellow-300 transition-all duration-200 shadow-lg">
//               Get Started →
//             </button>
//           </Link>

//         </div>
//       </section>

//     </main>
//   );
// }