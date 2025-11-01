import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import API from "../api/api";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    groups: 0,
    assignments: 0,
    pendingInvitations: 0,
  });

  useEffect(() => {
    if (user?.role === "student") {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [groupsRes, assignmentsRes, invitationsRes] = await Promise.all([
        API.get("/groups"),
        API.get("/assignments"),
        API.get("/groups/invitations/pending"),
      ]);

      setStats({
        groups: groupsRes.data.length,
        assignments: assignmentsRes.data.length,
        pendingInvitations: invitationsRes.data.length,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            {user?.role === "student" 
              ? "Manage your groups, assignments, and submissions all in one place."
              : "Manage assignments and track student progress."}
          </p>
        </div>

        {user?.role === "student" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">My Groups</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.groups}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Assignments</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.assignments}</p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Pending Invites</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.pendingInvitations}</p>
                  </div>
                  <div className="text-4xl">✉️</div>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                to="/groups"
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">👥</div>
                  <h2 className="text-xl font-semibold text-blue-600 mb-2">
                    Groups
                  </h2>
                  <p className="text-gray-500">
                    Create or join groups to collaborate with your peers.
                  </p>
                </div>
              </Link>

              <Link
                to="/assignments"
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">📚</div>
                  <h2 className="text-xl font-semibold text-green-600 mb-2">
                    Assignments
                  </h2>
                  <p className="text-gray-500">
                    View and submit your group assignments easily.
                  </p>
                </div>
              </Link>

              <Link
                to="/groups"
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">✉️</div>
                  <h2 className="text-xl font-semibold text-purple-600 mb-2">
                    Invitations
                  </h2>
                  <p className="text-gray-500">
                    Check and respond to group invitations.
                  </p>
                  {stats.pendingInvitations > 0 && (
                    <span className="inline-block mt-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                      {stats.pendingInvitations} pending
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/admin/create"
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">➕</div>
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">
                  Create Assignment
                </h2>
                <p className="text-gray-500">
                  Post new assignments for students.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/submissions"
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold text-green-600 mb-2">
                  Track Submissions
                </h2>
                <p className="text-gray-500">
                  Monitor group progress and submissions.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}