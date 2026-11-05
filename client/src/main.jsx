import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RoomProvider } from './context/RoomContext.jsx';
import './styles.css';
createRoot(document.getElementById('root')).render(<AuthProvider><RoomProvider><App /></RoomProvider></AuthProvider>);
