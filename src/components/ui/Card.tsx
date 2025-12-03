import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
    <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);