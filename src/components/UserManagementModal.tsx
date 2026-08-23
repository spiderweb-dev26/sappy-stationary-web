"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  User,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { User as UserType } from "@/lib/types";
import { formatDate } from "@/lib/format";
import MasterModal from "./MasterModal";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManagementModal({
  isOpen,
  onClose,
}: UserManagementModalProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("CASHIER");
  const [actionLoading, setActionLoading] = useState(false);

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Fetch users error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.toLowerCase().trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setFeedback(`User ${data.name} added successfully!`);
      setTimeout(() => setFeedback(null), 3500);

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (password: string) => {
    if (!deletingUserId) return;

    try {
      const res = await fetch(`/api/users/${deletingUserId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setFeedback("User account removed.");
      setTimeout(() => setFeedback(null), 3000);
      setDeletingUserId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                  Staff & User Management
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage store cashiers, managers, and active staff accounts.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Active Store Accounts ({users.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Cancel" : "Add Staff Member"}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 text-xs animate-scale-up">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                Create New Staff Account
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Bekele"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="samuel@sappy.local"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Temporary password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CASHIER">Cashier / Staff</option>
                    <option value="MANAGER">Store Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Save Staff Account</span>
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-2">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p>Loading user list...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="p-4 text-center text-slate-400 text-xs">No users registered.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="py-2.5 px-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{u.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {u.email} • Added: {formatDate(u.createdAt)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeletingUserId(u.id);
                      setIsMasterModalOpen(true);
                    }}
                    title="Remove Staff Account"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <MasterModal
        isOpen={isMasterModalOpen}
        title="Authorize Staff Account Deletion"
        description="Deleting staff accounts requires the shop master password."
        onConfirm={handleDeleteUser}
        onClose={() => {
          setIsMasterModalOpen(false);
          setDeletingUserId(null);
        }}
      />
    </>
  );
}