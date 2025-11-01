import React, { useEffect, useState } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingStep, setConfirmingStep] = useState({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await API.get("/assignments");
      setAssignments(res.data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError(error.response?.data?.error || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Confirmation = async (assignmentId, groupId) => {
    setConfirmingStep({ assignmentId, groupId, step: 1 });

    try {
      await API.post(`/assignments/${assignmentId}/confirm-step1`, {
        group_id: groupId,
      });
      await fetchAssignments();
      alert("✅ Step 1 complete! Click again to finalize submission.");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to confirm step 1");
      console.error("Error in step 1:", error);
    } finally {
      setConfirmingStep({});
    }
  };

  const handleStep2Confirmation = async (assignmentId, groupId) => {
    setConfirmingStep({ assignmentId, groupId, step: 2 });

    try {
      await API.post(`/assignments/${assignmentId}/confirm-step2`, {
        group_id: groupId,
      });
      await fetchAssignments();
      alert("🎉 Submission confirmed successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to confirm step 2");
      console.error("Error in step 2:", error);
    } finally {
      setConfirmingStep({});
    }
  };

  const getStatusBadge = (submission) => {
    if (!submission) {
      return <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Not Started</span>;
    }

    if (submission.confirmation_step === 0) {
      return <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full">Pending</span>;
    }

    if (submission.confirmation_step === 1) {
      return <span className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded-full">Step 1 Done</span>;
    }

    if (submission.confirmation_step === 2 && submission.status === 'confirmed') {
      return <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full">✓ Confirmed</span>;
    }

    return <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Unknown</span>;
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-8">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📚 My Assignments</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg">
              {error ? "Unable to load assignments." : "No assignments assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* Assignment Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-gray-800">{assignment.title}</h2>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      new Date(assignment.due_date) < new Date()
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {assignment.description && (
                    <p className="text-gray-600 mt-2">{assignment.description}</p>
                  )}

                  {assignment.onedrive_link && (
                    <a
                      href={assignment.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-blue-600 hover:text-blue-800 underline"
                    >
                      📎 Open OneDrive Submission Link
                    </a>
                  )}
                </div>

                {/* Group-wise Submission Status */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Submission Status by Group:</h3>
                  
                  {assignment.submission_statuses && assignment.submission_statuses.length > 0 ? (
                    <div className="space-y-3">
                      {assignment.submission_statuses.map((status) => {
                        const submission = status.submission;
                        const confirmationStep = submission?.confirmation_step || 0;
                        const isConfirmed = submission?.status === 'confirmed';

                        return (
                          <div
                            key={status.group_id}
                            className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{status.group_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(submission)}
                                {submission?.first_click_by_name && (
                                  <span className="text-xs text-gray-500">
                                    Step 1 by: {submission.first_click_by_name}
                                  </span>
                                )}
                                {submission?.confirmed_by_name && (
                                  <span className="text-xs text-gray-500">
                                    Confirmed by: {submission.confirmed_by_name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-x-2">
                              {isConfirmed ? (
                                <span className="bg-green-500 text-white px-4 py-2 rounded-lg">
                                  ✓ Submitted
                                </span>
                              ) : confirmationStep === 0 ? (
                                <button
                                  onClick={() => handleStep1Confirmation(assignment.id, status.group_id)}
                                  disabled={confirmingStep.groupId === status.group_id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:bg-blue-300"
                                >
                                  {confirmingStep.groupId === status.group_id && confirmingStep.step === 1
                                    ? "Processing..."
                                    : "I have submitted"}
                                </button>
                              ) : confirmationStep === 1 ? (
                                <button
                                  onClick={() => handleStep2Confirmation(assignment.id, status.group_id)}
                                  disabled={confirmingStep.groupId === status.group_id}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:bg-green-300 animate-pulse"
                                >
                                  {confirmingStep.groupId === status.group_id && confirmingStep.step === 2
                                    ? "Confirming..."
                                    : "Click to Confirm ✓"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">You are not part of any group for this assignment.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}