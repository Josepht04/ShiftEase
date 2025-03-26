import './App.css';
import Navbar from './Pages/Navbar/Navbar';
import PageRouter from './Assets/PageRouter/PageRouter';
import AuthProvider from './Config/Routes/AuthContext';

function App() {
  return (
    <div className="App">
      <header>
        <AuthProvider><PageRouter/></AuthProvider>
      </header>
      </div>
      
      );
}

export default App;
