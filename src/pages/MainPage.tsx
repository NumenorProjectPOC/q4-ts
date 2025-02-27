import Navbar from "../components/Navbar";

const MainPage = () => {
  return (
    <div className="h-screen bg-background text-text-primary flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <h2 className="text-4xl font-bold">Welcome to Your Dashboard</h2>
      </div>
    </div>
  );
};

export default MainPage;