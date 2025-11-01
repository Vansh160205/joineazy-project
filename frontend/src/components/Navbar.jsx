import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-2xl hover:text-blue-200 transition">
          🎓 Joineazy
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                {user.name} {user.student_id ? `(${user.student_id})` : '(Admin)'}
              </span>
              
              <Link to="/" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              
              {user.role === "student" && (
                <>
                  <Link to="/groups" className="hover:text-blue-200 transition">
                    Groups
                  </Link>
                  <Link to="/assignments" className="hover:text-blue-200 transition">
                    Assignments
                  </Link>
                </>
              )}
              
              {user.role === "admin" && (
                <Link to="/admin" className="hover:text-blue-200 transition">
                  Admin Panel
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;