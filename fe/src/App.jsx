import React from "react";
import { Outlet } from "react-router";
import { Toaster } from "react-hot-toast";
import Navigation from "./components/Navigation";
import ReportBubble from "./components/ReportBubble";
import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <div className={`font-sans mx-auto h-full`}>
      <Toaster position="top-center z-[9999999] " />
      <main className="z-0">
        <HelmetProvider>
          <Navigation children={<Outlet />} />
        </HelmetProvider>
        <ReportBubble />
      </main>
    </div>
  );
}

export default App;
