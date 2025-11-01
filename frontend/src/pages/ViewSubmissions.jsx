import React, { useEffect, useState } from "react";
import API from "../api/api";
import ProgressBar from "../components/ProgressBar";

export default function ViewSubmissions() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchAnalytics();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/admin/assignments");
      setAssignments(res.data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchSubmissionsForAssignment = async (assignmentId) => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/assignments/${assignmentId}`);
      setSelectedAssignment(res.data.assignment);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (submission) => {
    if (submission.status === 'confirmed') {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">✓ Confirmed</span>;
    }
    if (submission.confirmation_step === 1) {
      return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Step 1 Done</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">Pending</span>;
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">📊 Submissions & Analytics</h2>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold">Total Assignments</p>
            <p className="text-3xl font-bold text-blue-800">{analytics.summary.totalAssignments}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg">
            <p className="text-sm text-green-600 font-semibold">Total Groups</p>
            <p className="text-3xl font-bold text-green-800">{analytics.summary.totalGroups}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-lg">
            <p className="text-sm text-purple-600 font-semibold">Total Students</p>
            <p className="text-3xl font-bold text-purple-800">{analytics.summary.totalStudents}</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg">
            <p className="text-sm text-yellow-600 font-semibold">Completion Rate</p>
            <p className="text-3xl font-bold text-yellow-800">{analytics.summary.completionRate}%</p>
          </div>
        </div>
      )}

      {/* Assignment Selector */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Select Assignment to View Submissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => fetchSubmissionsForAssignment(assignment.id)}
              className={`text-left p-4 rounded-lg border-2 transition ${
                selectedAssignment?.id === assignment.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <h4 className="font-semibold text-lg">{assignment.title}</h4>
              <p className="text-sm text-gray-600">
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading submissions...</p>
        </div>
      ) : selectedAssignment ? (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-4">
            Submissions for: {selectedAssignment.title}
          </h3>

          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No submissions yet for this assignment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Click By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.group_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {sub.group_members?.map((m) => m.name).join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sub)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.first_click_by || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.confirmed_by || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.confirmed_at ? new Date(sub.confirmed_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-8 text-center text-gray-500">
          <p>Select an assignment above to view its submissions</p>
        </div>
      )}

      {/* Group Performance */}
      {analytics?.groupPerformance && analytics.groupPerformance.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Group Performance</h3>
          <div className="space-y-4">
            {analytics.groupPerformance.map((group) => (
              <div key={group.id}>
                <ProgressBar
                  current={parseInt(group.completed_assignments)}
                  total={parseInt(group.total_assigned)}
                  label={group.name}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}