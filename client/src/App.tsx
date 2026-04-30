import { Route, Routes } from 'react-router-dom';
import Home from './routes/Home.tsx';
import Room from './routes/Room.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-paper-cream text-ink font-typewriter paper-grain">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomCode" element={<Room />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
