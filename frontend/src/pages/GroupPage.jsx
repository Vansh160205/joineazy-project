import React, { useEffect, useState, useContext } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export default function GroupsPage() {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [name, setName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [addMethod, setAddMethod] = useState("invite"); // 'invite' or 'direct'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGroups();
    fetchInvitations();
    fetchAvailableStudents();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups");
      setGroups(res.data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("Failed to load groups");
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await API.get("/groups/invitations/pending");
      setInvitations(res.data || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const res = await API.get("/groups/available-students");
      setAvailableStudents(res.data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      await API.post("/groups", { name: name.trim() });
      setName("");
      await fetchGroups();
      alert("✅ Group created successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to create group";
      setError(errorMsg);
      alert(errorMsg);
      console.error("Error creating group:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedGroupId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Find the selected student to get their email or student_id
      const selectedStudent = availableStudents.find(s => s.id === Number(selectedStudentId));
      
      await API.post(`/groups/${selectedGroupId}/invite`, {
        identifier: selectedStudent.email, // or selectedStudent.student_id
      });
      setSelectedStudentId("");
      setSelectedGroupId(null);
      setSearchTerm("");
      alert("✅ Invitation sent successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send invitation";
      setError(errorMsg);
      alert(errorMsg);
      console.error("Error inviting member:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedGroupId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Find the selected student to get their email or student_id
      const selectedStudent = availableStudents.find(s => s.id === Number(selectedStudentId));
      
      const res = await API.post(`/groups/${selectedGroupId}/add-member`, {
        identifier: selectedStudent.email, // or selectedStudent.student_id
      });
      setSelectedStudentId("");
      setSelectedGroupId(null);
      setSearchTerm("");
      await fetchGroups();
      alert(`✅ ${res.data.message}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to add member";
      setError(errorMsg);
      alert(errorMsg);
      console.error("Error adding member:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitationId, action) => {
    setLoading(true);
    setError(null);
    
    try {
      await API.post(`/groups/invitations/${invitationId}/respond`, { action });
      await fetchInvitations();
      await fetchGroups();
      alert(`✅ Invitation ${action}ed successfully!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to respond to invitation";
      setError(errorMsg);
      alert(errorMsg);
      console.error("Error responding to invitation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get members of selected group to filter them out
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const isOwnerOfSelectedGroup = selectedGroup?.owner_id === user?.id;
  const groupMemberIds = selectedGroup?.members?.map(m => m.id) || [];
  
  // Filter out current user and existing group members
  const availableToAdd = filteredStudents.filter(
    student => student.id !== user?.id && !groupMemberIds.includes(student.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👥 Groups</h1>
          <p className="text-gray-600">
            Create groups, invite members, and collaborate on assignments together.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 font-bold text-xl hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800 flex items-center">
              <span className="text-2xl mr-2">✉️</span>
              Pending Invitations ({invitations.length})
            </h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-800">{inv.group_name}</p>
                    <p className="text-sm text-gray-600">
                      Invited by: <span className="font-medium">{inv.invited_by_name}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.invited_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToInvitation(inv.id, "accept")}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleRespondToInvitation(inv.id, "reject")}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      × Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Group */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-2">➕</span>
            Create New Group
          </h2>
          <form onSubmit={handleCreateGroup} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Group name (e.g., Team Alpha, Project Group 1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:bg-blue-300 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </form>
        </div>

        {/* Invite/Add Members */}
        {groups.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">👤</span>
              Add Member to Group
            </h2>
            
            {/* Toggle between invite and direct add */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setAddMethod("invite")}
                className={`px-4 py-2 rounded-lg transition ${
                  addMethod === "invite"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📧 Send Invitation
              </button>
              <button
                onClick={() => setAddMethod("direct")}
                className={`px-4 py-2 rounded-lg transition ${
                  addMethod === "direct"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ⚡ Add Directly
              </button>
            </div>

            <form 
              onSubmit={addMethod === "invite" ? handleInviteMember : handleDirectAdd} 
              className="space-y-4"
            >
              {/* Select Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.owner_id === user?.id && "★ (You are owner)"} - {g.members?.length || 0} members
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Students */}
              {selectedGroupId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Student
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Select Student */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student {availableToAdd.length > 0 && `(${availableToAdd.length} available)`}
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-48"
                      size="6"
                    >
                      <option value="">-- Select a student --</option>
                      {availableToAdd.length === 0 ? (
                        <option disabled>
                          {searchTerm ? "No students match your search" : "No available students to add"}
                        </option>
                      ) : (
                        availableToAdd.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} - {student.student_id} ({student.email})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </>
              )}

              {/* Show warning if trying to direct add without being owner */}
              {addMethod === "direct" && selectedGroupId && !isOwnerOfSelectedGroup && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  ⚠️ Only the group owner can directly add members. Use "Send Invitation" instead.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selectedStudentId || (addMethod === "direct" && !isOwnerOfSelectedGroup)}
                className={`w-full text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  addMethod === "invite"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading
                  ? "Processing..."
                  : addMethod === "invite"
                  ? "📧 Send Invitation"
                  : "⚡ Add Member Now"}
              </button>
            </form>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                {addMethod === "invite" ? (
                  <>
                    <strong className="text-blue-600">Send Invitation:</strong> The student will receive an invitation and can choose to accept or reject it. Any group member can send invitations.
                  </>
                ) : (
                  <>
                    <strong className="text-green-600">Direct Add:</strong> The student will be immediately added to the group without needing to accept. <span className="font-semibold">Only group owners</span> can use this feature.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* My Groups */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
            <span className="text-2xl mr-2">📋</span>
            Your Groups ({groups.length})
          </h2>

          {groups.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg mb-2">No groups yet</p>
              <p className="text-gray-400">Create your first group above to get started!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {g.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(g.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {g.owner_id === user?.id && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        ★ Owner
                      </span>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Members ({g.members?.length || 0})
                      </p>
                      <span className="text-xs text-gray-500">
                        {g.members?.length || 0} {g.members?.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {g.members && g.members.length > 0 ? (
                        g.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded hover:bg-gray-100 transition"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {member.student_id && (
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                                  {member.student_id}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                member.role === 'owner' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                {member.role === 'owner' ? '★' : '•'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-2">
                          No members yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}