/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div id="app_frame_container" className="min-h-screen bg-alabaster flex items-center justify-center p-0 md:p-6 font-sans antialiased selection:bg-bronze selection:text-white">
      {/* Decorative desktop background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(205,127,50,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(28,43,45,0.06),transparent_50%)] pointer-events-none" />

      {/* Main Clean Application Container */}
      <div 
        id="clean_app_container"
        className="relative w-full max-w-lg h-screen md:h-[860px] bg-white md:rounded-3xl md:shadow-2xl md:border md:border-slate-200/50 overflow-hidden flex flex-col transition-all duration-300"
      >
        {/* Dynamic Content Frame */}
        <div id="app_content_area" className="flex-1 overflow-hidden flex flex-col bg-alabaster relative">
          {children}
        </div>
      </div>
    </div>
  );
};
