import React, { useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, Camera } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
export type FieldType =
  | 'text' | 'email' | 'phone' | 'password' | 'number'
  | 'select' | 'textarea' | 'checkbox' | 'file' | 'image' | 'date';

export interface FieldOption { label: string; value: string; }

export interface FormField {
  id:          string;
  type:        FieldType;
  label:       string;
  placeholder?: string;
  required?:   boolean;
  options?:    FieldOption[];
  accept?:     string;       // for file/image fields
  visibleIf?:  { role?: string; field?: string; value?: unknown }; // role-based visibility
  hint?:       string;
}

export interface FormSection {
  title:  string;
  fields: FormField[];
}

export interface FormSchema {
  id:          string;
  title:       string;
  description?: string;
  submitLabel: string;
  sections:    FormSection[];
}

interface Props {
  schema:     FormSchema;
  userRole?:  string;
  onSubmit:   (data: Record<string, unknown>) => Promise<void>;
  onCancel?:  () => void;
}

// ── Component ────────────────────────────────────────────────
export default function DynamicForm({ schema, userRole, onSubmit, onCancel }: Props) {
  const [values,  setValues]  = useState<Record<string, unknown>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (id: string, val: unknown) => {
    setValues(v => ({ ...v, [id]: val }));
    setErrors(e => ({ ...e, [id]: '' }));
  };

  function isVisible(field: FormField): boolean {
    if (!field.visibleIf) return true;
    if (field.visibleIf.role && userRole !== field.visibleIf.role) return false;
    if (field.visibleIf.field) {
      return values[field.visibleIf.field] === field.visibleIf.value;
    }
    return true;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    schema.sections.forEach(sec =>
      sec.fields.forEach(f => {
        if (f.required && isVisible(f) && !values[f.id]) {
          errs[f.id] = `${f.label} is required`;
        }
      })
    );
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(values);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-12 space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <p className="text-white font-semibold text-lg">All saved!</p>
        <p className="text-slate-400 text-sm">Your information has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {schema.description && (
        <p className="text-slate-400 text-sm">{schema.description}</p>
      )}

      {schema.sections.map((section, si) => {
        const visibleFields = section.fields.filter(isVisible);
        if (!visibleFields.length) return null;
        return (
          <div key={si} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.map((field, fi) => (
                <div key={field.id + fi}>
                  <FieldRenderer
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    onChange={val => set(field.id, val)}
                    fullWidth={['textarea', 'file', 'image', 'checkbox'].includes(field.type)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:border-white/20 transition">
            Cancel
          </button>
        )}
        <button
          type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {loading ? 'Saving...' : schema.submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Field renderer ───────────────────────────────────────────
function FieldRenderer({
  field, value, error, onChange, fullWidth,
}: {
  field: FormField; value: unknown; error?: string;
  onChange: (v: unknown) => void; fullWidth?: boolean;
}) {
  const base = 'w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition';
  const borderCls = error ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-emerald-500';

  const el = (() => {
    switch (field.type) {
      case 'select':
        return (
          <select value={String(value ?? '')} onChange={e => onChange(e.target.value)}
            className={`${base} ${borderCls}`}>
            <option value="">Select {field.label}</option>
            {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder} value={String(value ?? '')}
            onChange={e => onChange(e.target.value)} rows={3}
            className={`${base} ${borderCls} resize-none`}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => onChange(!value)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${value ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}
            >
              {value && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-slate-300">{field.label}</span>
          </label>
        );

      case 'file':
      case 'image':
        return (
          <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl cursor-pointer transition group">
            {field.type === 'image'
              ? <Camera className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition" />
              : <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition" />
            }
            <span className="text-slate-400 text-xs text-center">
              {value ? '✅ File selected' : `Click to upload ${field.label}`}
            </span>
            <input type="file" accept={field.accept} className="hidden"
              onChange={e => onChange(e.target.files?.[0]?.name ?? '')} />
          </label>
        );

      default:
        return (
          <input
            type={field.type} placeholder={field.placeholder} value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            className={`${base} ${borderCls}`}
          />
        );
    }
  })();

  return (
    <div className={`space-y-1.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      {field.type !== 'checkbox' && (
        <label className="text-xs font-medium text-slate-400">
          {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {el}
      {field.hint && !error && <p className="text-[11px] text-slate-600">{field.hint}</p>}
      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
          <AlertCircle className="w-3 h-3" />{error}
        </div>
      )}
    </div>
  );
}
