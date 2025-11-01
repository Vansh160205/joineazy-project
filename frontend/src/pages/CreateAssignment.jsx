import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function CreateAssignment() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    onedrive_link: "",
  });
  const [targetType, setTargetType] = useState("all");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/admin/analytics");
      // Get all groups from analytics or create dedicated endpoint
      const groupsData = res.data.groupPerformance || [];
      setGroups(groupsData);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const targets =
        targetType === "all"
          ? [{ type: "all" }]
          : selectedGroups.map((groupId) => ({
              type: "group",
              groupId,
            }));

      await API.post("/admin/assignments", {
        ...form,
        targets,
      });

      setMessage("✅ Assignment created successfully!");
      setForm({
        title: "",
        description: "",
        due_date: "",
        onedrive_link: "",
      });
      setTargetType("all");
      setSelectedGroups([]);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "❌ Failed to create assignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create New Assignment</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-lg rounded-lg space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            placeholder="e.g., React Project Submission"
            value={form.title}
            required
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Assignment details and requirements..."
            value={form.description}
            rows="4"
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            type="datetime-local"
            value={form.due_date}
            required
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OneDrive Submission Link *
          </label>
          <input
            type="url"
            placeholder="https://onedrive.live.com/..."
            value={form.onedrive_link}
            required
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => setForm({ ...form, onedrive_link: e.target.value })}
          />
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assign To:
          </label>

          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={targetType === "all"}
                onChange={() => setTargetType("all")}
                className="mr-2"
              />
              <span>All Students</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="specific"
                checked={targetType === "specific"}
                onChange={() => setTargetType("specific")}
                className="mr-2"
              />
              <span>Specific Groups</span>
            </label>
          </div>

          {targetType === "specific" && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Select groups:</p>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-500">No groups available</p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <label key={group.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="mr-2"
                      />
                      <span>{group.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg w-full transition disabled:bg-blue-300"
        >
          {loading ? "Creating..." : "Create Assignment"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            message.includes("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}