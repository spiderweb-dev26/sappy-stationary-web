"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  User,
  CheckCircle2,
} from "lucide-react";
import { User as UserType } from "@/lib/types";
import { formatDate } from "@/lib/format";
import ProgressBar from "@/components/ProgressBar";
import MasterModal from "@/components/MasterModal";

export default function UsersClient() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState<UserType | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [masterPasscode, setMasterPasscode] = useState("");
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetMasterPass, setResetMasterPass] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json().catch(() => []);
      
      let list = Array.isArray(data) ? data : [];

      if (list.length === 0 && session?.user) {
        list = [{
          id: (session.user as any).id || "usr-current",
          name: session.user.name || "Amanueal Getahun",
          email: session.user.email || "amanuealhailu007@gmail.com",
          role: "ADMIN",
          createdAt: new Date(),
        }];
      }

      setUsers(list);
    } catch (e) {
      console.error(e);
      if (session?.user) {
        setUsers([{
          id: (session.user as any).id || "usr-current",
          name: session.user.name || "Amanueal Getahun",
          email: session.user.email || "amanuealhailu007@gmail.com",
          role: "ADMIN",
          createdAt: new Date(),
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newName.trim() || !newEmail.trim() || !newPassword || !masterPasscode.trim()) {
      setFormError("All fields including the Master Passcode are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 4) {
      setFormError("Password must be at least 4 characters.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.toLowerCase().trim(),
          password: newPassword,
          masterPasscode: masterPasscode.trim(),
          role: "ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create administrator account.");

      showToast(`Administrator account "${data.name}" created successfully.`);
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setMasterPasscode("");
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError("");

    if (!newResetPassword || !resetMasterPass.trim()) {
      setFormError("New password and Master Passcode are required.");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${activeUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: newResetPassword,
          masterPassword: resetMasterPass.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed.");

      showToast(`Password for "${activeUser.name}" successfully updated.`);
      setIsResetPasswordModalOpen(false);
      setActiveUser(null);
      setNewResetPassword("");
      setConfirmResetPassword("");
      setResetMasterPass("");
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (password: string) => {
    if (!activeUser) return;

    try {
      const res = await fetch(`/api/users/${activeUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account.");

      showToast(`Administrator account "${activeUser.name}" removed.`);
      setIsDeleteModalOpen(false);
      setActiveUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-mint-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-700" />
            Users & Security Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {users.length} administrator account(s) registered • Master passcode authorization required for modifications
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-700/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Administrator</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <ProgressBar label="Loading registered administrators..." durationMs={500} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-12 h-12 mx-auto opacity-30 text-emerald-700" />
            <p className="text-sm font-bold text-slate-700">No User Accounts Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "Add Administrator" above to create your first secure user account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Administrator</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Access Role</th>
                  <th className="py-3.5 px-5">Registration Date</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono text-slate-700 font-medium">
                      {u.email}
                    </td>

                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300/60">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" /> Administrator
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUser(u);
                            setFormError("");
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveUser(u);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Account (Master-gated)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
            <h3 className="font-display font-black text-lg text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-700" /> Add New Administrator
            </h3>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Bekele"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="samuel@sappy.local"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1.5">
                <label className="block font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" /> Master Passcode Required *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter master passcode"
                  value={masterPasscode}
                  onChange={(e) => setMasterPasscode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Save Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-up space-y-4">
            <h3 className="font-display font-black text-lg text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-700" /> Reset Password for {activeUser.name}
            </h3>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 chars)"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
                <label className="block font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                  Master Passcode *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter master passcode"
                  value={resetMasterPass}
                  onChange={(e) => setResetMasterPass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <MasterModal
        isOpen={isDeleteModalOpen}
        title={`Delete Administrator Account: ${activeUser?.name}`}
        description="Removing an administrator account permanently revokes access and requires Master Passcode verification."
        onConfirm={handleDeleteUser}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveUser(null);
        }}
      />
    </div>
  );
}