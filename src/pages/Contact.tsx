import React from 'react';
import Navbar from '../components/Navbar';
function Contact() {
    return (
        <div className="h-screen bg-gray-800 text-white flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center">
                <h2 className="text-4xl font-bold">Contact Us</h2>
            </div>
        </div>
    );
}

export default Contact;