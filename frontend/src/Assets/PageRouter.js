import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../Pages/User/Login/Login";
import LandingPage from "../Pages/LandingPage/LandingPage";
import UserHomePage from "../Pages/User/UserHomePage/UserHomePage";
import UserProfile from "../Pages/User/UserProfile/UserProfile";
import AdminHomePage from "../Pages/Admin/AdminHomePage/AdminHomePage";
import AdmLogin from"../Pages/Admin/AdmLogin/AdmLogin";
import ResultPage from "../Pages/ResultPage/ResultPage";
import Performance from "../Pages/User/Performance/Performance";

import AdminProtectedRoute from "../Config/Routes/AdminProtectedRoute";
import ProtectedRoute from "../Config/Routes/ProtectedRoute";
import Navbar from "../Pages/Navbar/Navbar";

function PageRouter() {
  return (
    <Router> 
      <div>
        <Navbar /> 
        <Routes>
          <Route path='/info' element={<LandingPage />} />
          <Route path='/' element={<ProtectedRoute><UserHomePage /></ProtectedRoute>} />
          <Route path='/login' element={<Login />} />
          <Route path='/profile' element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path='/admin' element={<AdminProtectedRoute><AdminHomePage /></AdminProtectedRoute>} />
          <Route path='/admin/login' element={<AdmLogin/>}/>
          <Route path='/result' element={<ResultPage />} />
          <Route path='/performance' element={<ProtectedRoute><Performance /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default PageRouter;
