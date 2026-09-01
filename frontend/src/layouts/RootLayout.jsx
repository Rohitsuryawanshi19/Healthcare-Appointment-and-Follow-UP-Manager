import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Care<span className="text-teal-600">Flow</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ● System Online
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        CareFlow Healthcare Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
