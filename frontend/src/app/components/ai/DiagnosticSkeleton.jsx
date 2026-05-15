import React from 'react';
import { motion } from 'motion/react';

export default function DiagnosticSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Risk Banner Skeleton */}
      <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[20px] animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Risk Level Box Skeleton */}
        <div className="md:col-span-5 h-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[24px] p-8 flex flex-col items-center justify-center animate-pulse">
           <div className="w-20 h-3 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
           <div className="w-32 h-12 bg-slate-100 dark:bg-slate-700 rounded"></div>
        </div>

        {/* Diagnosis Box Skeleton */}
        <div className="md:col-span-7 h-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[24px] p-6 animate-pulse">
          <div className="w-32 h-3 bg-slate-100 dark:bg-slate-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="w-24 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  <div className="w-8 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-2 w-full bg-slate-50 dark:bg-slate-700/30 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusion Box Skeleton */}
        <div className="md:col-span-12 h-64 bg-slate-900 rounded-[24px] p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl"></div>
            <div>
              <div className="w-20 h-2 bg-slate-800 rounded mb-2"></div>
              <div className="w-48 h-6 bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
               <div className="w-32 h-4 bg-slate-800 rounded mb-4"></div>
               <div className="h-2 w-full bg-slate-800 rounded"></div>
               <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
               <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl h-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
