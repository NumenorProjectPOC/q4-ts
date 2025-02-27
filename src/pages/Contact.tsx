import React from 'react';
import Navbar from '../components/Navbar';

const Contact: React.FC = () => {
  return (
    <div className="h-screen bg-background text-text-primary flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <h2 className="text-4xl font-bold">Contact Us</h2>
      </div>
    </div>
  );
}

export default Contact;