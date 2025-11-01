import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CreateAssignment from "./CreateAssignment";
import ViewSubmissions from "./ViewSubmissions";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        <aside className="w-64 bg-white shadow-lg p-6 min-h-screen">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Admin Panel</h2>
          <nav className="space-y-3">
            <Link
              to="/admin/create"
              className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
            >
              ➕ Create Assignment
            </Link>
            <Link
              to="/admin/submissions"
              className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
            >
              📊 View Submissions
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Routes>
            <Route path="create" element={<CreateAssignment />} />
            <Route path="submissions" element={<ViewSubmissions />} />
            <Route path="/" element={<Navigate to="/admin/create" replace />} />
            <Route path="*" element={
              <div className="text-center text-gray-500 mt-12">
                <p className="text-xl">Select an option from the sidebar</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}