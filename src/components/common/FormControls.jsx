import React, { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { today } from "../../utils/date.js";
import { Button } from "./Actions.jsx";

export function Field({ label, value, onChange, placeholder, type = "text", autoComplete }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}

export function PasswordField({
  show,
  setShow,
  value,
  onChange,
  label = "Password",
  autoComplete = "current-password",
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-input">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder="Enter password"
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label="Toggle password visibility"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

export function Strength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  return password ? (
    <div className="strength">
      <div>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < score ? "filled" : ""} />
        ))}
      </div>
      <span>{["Too short", "Fair", "Good", "Strong", "Excellent"][score]}</span>
    </div>
  ) : null;
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function TaskForm({ initial = {}, onSave, onClose }) {
  const [f, setF] = useState({
    title: initial.title || "",
    description: initial.description || "",
    category: initial.category || "Personal",
    priority: initial.priority || "Medium",
    status: initial.status || "Pending",
    dueDate: initial.dueDate || today(),
    estimatedDuration: initial.estimatedDuration || 30,
  });
  const put = (k, v) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form
      className="entity-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <Field
        label="Task name"
        value={f.title}
        onChange={(v) => put("title", v)}
        placeholder="What needs to get done?"
      />
      <label className="field">
        <span>Description</span>
        <textarea
          value={f.description}
          onChange={(e) => put("description", e.target.value)}
          placeholder="Add a few details..."
        />
      </label>
      <div className="form-row">
        <Select
          label="Category"
          value={f.category}
          onChange={(v) => put("category", v)}
          options={["Personal", "Study", "Work", "Health", "Other"]}
        />
        <Select
          label="Priority"
          value={f.priority}
          onChange={(v) => put("priority", v)}
          options={["Low", "Medium", "High"]}
        />
      </div>
      <div className="form-row">
        <Field
          label="Due date"
          value={f.dueDate}
          onChange={(v) => put("dueDate", v)}
          type="date"
        />
        <Field
          label="Estimate (minutes)"
          value={f.estimatedDuration}
          onChange={(v) => put("estimatedDuration", Number(v))}
          type="number"
        />
      </div>
      <div className="modal-actions">
        <Button kind="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Check}>{initial.id ? "Save changes" : "Add task"}</Button>
      </div>
    </form>
  );
}

export function SimpleForm({
  fields,
  initial = {},
  onSave,
  onClose,
  submit = "Save",
}) {
  const [f, setF] = useState(() =>
    Object.fromEntries(
      fields.map((x) => [x.name, initial[x.name] ?? x.default ?? ""]),
    ),
  );
  const put = (k, v) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form
      className="entity-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      {fields.map((x) =>
        x.type === "select" ? (
          <Select
            key={x.name}
            label={x.label}
            value={f[x.name]}
            onChange={(v) => put(x.name, v)}
            options={x.options}
          />
        ) : (
          <Field
            key={x.name}
            label={x.label}
            value={f[x.name]}
            onChange={(v) => put(x.name, x.type === "number" ? Number(v) : v)}
            placeholder={x.placeholder}
            type={x.type || "text"}
          />
        ),
      )}
      <div className="modal-actions">
        <Button kind="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Check}>{submit}</Button>
      </div>
    </form>
  );
}
