import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginPage"
import Preferences from "./pages/PreferencesPage";
import MainPage from "./pages/MainPage";
import Playground from "./pages/Playground";
import Contact from "./pages/Contact";
import React from "react";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
};

export default App;
