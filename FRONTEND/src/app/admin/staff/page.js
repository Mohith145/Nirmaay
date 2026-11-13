"use client";

import React, { useState } from "react";
import {
  UserCog,
  CheckCircle2,
  AlertCircle,
  Shield,
  Stethoscope,
  Users,
  Copy,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Form } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ROLES, ROLE_LABELS } from "@/config/roles";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function AdminStaffPage() {
  const { user, registerStaff } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES.DOCTOR);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [createdList, setCreatedList] = useState([]);

  // Verify only admin can select role
  const isAdmin = user && user.role === ROLES.ADMIN;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      setError("Please fill in all staff details.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await registerStaff({
        email,
        password,
        full_name: fullName,
        role,
      });

      setCreatedUser(result);
      setCreatedList((prev) => [result, ...prev]);
      addToast(`Staff account for ${result.full_name} created successfully!`, "success");

      // Reset form fields
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to create staff account. Check admin privileges.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Healthcare Staff Provisioning"
        description="Create authorized accounts for Clinicians, Community Health Workers, and Administrators."
        backHref="/admin"
        backLabel="Back to Admin Dashboard"
        badge={<Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>Admin Privileged</Badge>}
      />

      <DisclaimerBanner variant="subtle" />

      {/* Success Notification Banner */}
      {createdUser && (
        <div className="p-5 rounded-xl bg-risk-low-bg border border-risk-low/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-risk-low flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-ink-900 text-sm">
                Account Created Successfully!
              </span>
              <span className="text-xs text-ink-600">
                User ID: <strong className="font-mono text-ink-900">#{createdUser.id}</strong> &middot; Email: <strong>{createdUser.email}</strong> &middot; Role: <strong className="capitalize">{ROLE_LABELS[createdUser.role] || createdUser.role}</strong>
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(createdUser.email);
              addToast("Email copied to clipboard", "info");
            }}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Copy Email
          </Button>
        </div>
      )}

      {/* Provisioning Form */}
      <Card variant="default">
        <Card.Header>
          <Card.Title>Register New Staff Member</Card.Title>
          <Card.Description>
            Uses <code>POST /auth/register</code> authorized with your current Administrator Bearer token.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Staff Member Full Name"
                type="text"
                id="staffName"
                required
                placeholder="e.g. Dr. Priya Rao"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Official Email Address"
                type="email"
                id="staffEmail"
                required
                placeholder="e.g. priya.rao@hospital.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Temporary Password"
                type="password"
                id="staffPassword"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                helperText="Provide this to the staff member along with their login email."
              />

              {/* Only admins can see and choose the role */}
              {isAdmin ? (
                <Select
                  label="Assigned System Role"
                  id="staffRole"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={[
                    { value: ROLES.DOCTOR, label: "Clinician / Oncologist (Doctor)" },
                    { value: ROLES.HEALTH_WORKER, label: "Community Health Worker (Camp Mode)" },
                    { value: ROLES.ADMIN, label: "Platform Administrator" },
                  ]}
                  helperText="Determines access to queues, camp screening, or administrative controls."
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink-900">Assigned Role</span>
                  <div className="px-3.5 py-2.5 rounded-lg border border-line-200 bg-surface-50 text-sm text-ink-600">
                    Clinician (Doctor)
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Provision Staff Account
              </Button>
            </div>
          </Form>
        </Card.Content>
      </Card>

      {/* Recently Created Staff Records */}
      {createdList.length > 0 && (
        <Card variant="flat">
          <Card.Header>
            <Card.Title>Recently Created in This Session ({createdList.length})</Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-line-200">
              {createdList.map((st) => (
                <div key={st.id} className="p-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center font-bold text-ink-900 text-xs">
                      #{st.id}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink-900">{st.full_name}</span>
                      <span className="text-xs text-ink-600">{st.email}</span>
                    </div>
                  </div>
                  <Badge variant="brand" size="sm">
                    {ROLE_LABELS[st.role] || st.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
