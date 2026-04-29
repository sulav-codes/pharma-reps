"use client";

import { useState } from "react";

import { createInteraction } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  setError,
  setField,
  setForm,
  setLastSavedId,
  setStatus,
} from "@/lib/slices/interactionSlice";

const sentimentOptions = ["neutral", "positive", "negative"];
const interactionTypeOptions = ["Meeting", "Call", "Email", "Other"];

const statusLabel = {
  idle: "Ready",
  saving: "Saving...",
  saved: "Saved",
  error: "Needs attention",
} as const;

const statusColors = {
  idle: "bg-gray-100 text-gray-700 border-gray-200",
  saving: "bg-blue-50 text-blue-700 border-blue-200",
  saved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

const formatDateInput = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(
    parsed.getDate(),
  )}`;
};

const formatTimeInput = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
};

const buildOccurredAt = (dateValue: string, timeValue: string) => {
  if (!dateValue) {
    return null;
  }
  const timePart = timeValue || "00:00";
  const parsed = new Date(`${dateValue}T${timePart}`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

export default function InteractionForm() {
  const dispatch = useAppDispatch();
  const { form, status, error, lastSavedId } = useAppSelector(
    (state) => state.interaction,
  );
  const [note, setNote] = useState<string | null>(null);

  const handleSave = async () => {
    dispatch(setStatus("saving"));
    setNote(null);

    const summaryParts = [] as string[];
    if (form.topics_discussed) {
      summaryParts.push(`Topics Discussed: ${form.topics_discussed}`);
    }
    if (form.outcomes) {
      summaryParts.push(`Outcomes: ${form.outcomes}`);
    }
    if (form.voice_note_consent && form.voice_note_summary) {
      summaryParts.push(`Voice Note Summary: ${form.voice_note_summary}`);
    }

    const samples = form.no_samples
      ? []
      : form.samples_distributed
          .split("\n")
          .map((item) => item.replace(/^[-*]\s*/, "").trim())
          .filter(Boolean);

    const raw_text = JSON.stringify({
      materials_shared: form.materials_shared,
      brochures_shared: form.brochures_shared,
      q_search: form.q_search,
      samples_distributed: samples,
      no_samples: form.no_samples,
    });

    try {
      const occurredAt = buildOccurredAt(form.date, form.time);

      const response = await createInteraction({
        hcp_name: form.hcp_name,
        product: form.product,
        interaction_type: form.product || undefined,
        summary: summaryParts.join("\n\n") || undefined,
        follow_up: form.follow_up_actions || undefined,
        sentiment: form.sentiment || undefined,
        occurred_at: occurredAt || undefined,
        attendees: form.attendees || undefined,
        raw_text,
      });

      dispatch(setStatus("saved"));
      dispatch(setLastSavedId(response?.id));
      if (response) {
        dispatch(
          setForm({
            hcp_name: response.hcp_name || "",
            product: response.product || response.interaction_type || "",
            topics_discussed: response.summary || "",
            voice_note_consent: form.voice_note_consent,
            voice_note_summary: form.voice_note_summary,
            materials_shared: form.materials_shared,
            brochures_shared: form.brochures_shared,
            q_search: form.q_search,
            samples_distributed: form.samples_distributed,
            no_samples: form.no_samples,
            sentiment: response.sentiment || "",
            outcomes: form.outcomes,
            follow_up_actions: response.follow_up || "",
            date: formatDateInput(response.occurred_at),
            time: formatTimeInput(response.occurred_at),
            attendees: response.attendees || "",
          }),
        );
      }
      setNote("Interaction saved to CRM.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      dispatch(setError(message));
      setNote(null);
    }
  };

  const inputBaseClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-400";

  const labelClasses = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <section className=" w-full overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Log HCP Interaction
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Capture interaction details precisely, then submit to the CRM.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[status]}`}
          >
            {statusLabel[status]}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 sm:p-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          {/* Basic Info */}
          <div className="sm:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
          </div>
          <div>
            <label className={labelClasses}>HCP Name</label>
            <input
              className={inputBaseClasses}
              value={form.hcp_name}
              onChange={(event) =>
                dispatch(
                  setField({ field: "hcp_name", value: event.target.value }),
                )
              }
              placeholder="Dr. Avery Patel"
            />
          </div>

          <div>
            <label className={labelClasses}>Interaction Type</label>
            <select
              className={inputBaseClasses}
              value={form.product}
              onChange={(event) =>
                dispatch(
                  setField({ field: "product", value: event.target.value }),
                )
              }
            >
              <option value="">Select an option</option>
              {interactionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Date</label>
            <input
              type="date"
              className={inputBaseClasses}
              value={form.date}
              onChange={(event) =>
                dispatch(setField({ field: "date", value: event.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClasses}>Time</label>
            <input
              type="time"
              className={inputBaseClasses}
              value={form.time}
              onChange={(event) =>
                dispatch(setField({ field: "time", value: event.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>Attendees</label>
            <input
              className={inputBaseClasses}
              value={form.attendees}
              onChange={(event) =>
                dispatch(
                  setField({ field: "attendees", value: event.target.value }),
                )
              }
              placeholder="e.g., Dr. Smith, Jane Doe"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Topics Discussed</label>
            <textarea
              className={`${inputBaseClasses} resize-y`}
              rows={3}
              value={form.topics_discussed}
              onChange={(event) =>
                dispatch(
                  setField({
                    field: "topics_discussed",
                    value: event.target.value,
                  }),
                )
              }
              placeholder="Key discussion points, clinical focus, and objections."
            />
          </div>

          {/* Voice Note Section */}
          <div className="sm:col-span-2 mt-4">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Summarize from Voice Note
            </h3>
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="voice-note-consent"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                checked={form.voice_note_consent}
                onChange={(event) =>
                  dispatch(
                    setField({
                      field: "voice_note_consent",
                      value: event.target.checked,
                    }),
                  )
                }
              />
              <label
                htmlFor="voice-note-consent"
                className="text-sm text-gray-700"
              >
                Consent captured for voice note
              </label>
            </div>
            <textarea
              className={`${inputBaseClasses} resize-y`}
              rows={3}
              value={form.voice_note_summary}
              onChange={(event) =>
                dispatch(
                  setField({
                    field: "voice_note_summary",
                    value: event.target.value,
                  }),
                )
              }
              placeholder="Summarize key points from the voice note."
              disabled={!form.voice_note_consent}
            />
          </div>

          {/* Materials Section */}
          <div className="sm:col-span-2 mt-4">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Materials Shared & Samples
            </h3>
          </div>

          <div>
            <label className={labelClasses}>Materials Shared</label>
            <input
              className={inputBaseClasses}
              value={form.materials_shared}
              onChange={(event) =>
                dispatch(
                  setField({
                    field: "materials_shared",
                    value: event.target.value,
                  }),
                )
              }
              placeholder="Leave-behinds, decks, or links"
            />
          </div>

          <div className="flex flex-col justify-center pt-6">
            <div className="flex items-center gap-2">
              <input
                id="brochures-shared"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                checked={form.brochures_shared}
                onChange={(event) =>
                  dispatch(
                    setField({
                      field: "brochures_shared",
                      value: event.target.checked,
                    }),
                  )
                }
              />
              <label
                htmlFor="brochures-shared"
                className="text-sm text-gray-700"
              >
                Brochures shared
              </label>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Q Search / Add</label>
            <input
              className={inputBaseClasses}
              value={form.q_search}
              onChange={(event) =>
                dispatch(
                  setField({ field: "q_search", value: event.target.value }),
                )
              }
              placeholder="Search or add a question/answer"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Samples Distributed</label>
            <textarea
              className={`${inputBaseClasses} resize-y mb-2`}
              rows={3}
              value={form.samples_distributed}
              onChange={(event) =>
                dispatch(
                  setField({
                    field: "samples_distributed",
                    value: event.target.value,
                  }),
                )
              }
              placeholder="- Sample name, quantity"
              disabled={form.no_samples}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:text-gray-400"
                onClick={() =>
                  dispatch(
                    setField({
                      field: "samples_distributed",
                      value: form.samples_distributed
                        ? `${form.samples_distributed}\n- `
                        : "- ",
                    }),
                  )
                }
                disabled={form.no_samples}
              >
                + Add Sample
              </button>
              <div className="flex items-center gap-2">
                <input
                  id="no-samples"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  checked={form.no_samples}
                  onChange={(event) =>
                    dispatch(
                      setField({
                        field: "no_samples",
                        value: event.target.checked,
                      }),
                    )
                  }
                />
                <label htmlFor="no-samples" className="text-sm text-gray-700">
                  No samples added
                </label>
              </div>
            </div>
          </div>

          {/* Outcomes & Follow-up Section */}
          <div className="sm:col-span-2 mt-4">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Outcomes & Follow-up
            </h3>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>
              Observed/Inferred HCP Sentiment
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              {sentimentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`capitalize px-4 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
                    form.sentiment === option
                      ? "bg-blue-100 border-blue-600 text-blue-800 ring-1 ring-blue-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    dispatch(setField({ field: "sentiment", value: option }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Outcomes</label>
            <textarea
              className={`${inputBaseClasses} resize-y`}
              rows={3}
              value={form.outcomes}
              onChange={(event) =>
                dispatch(
                  setField({ field: "outcomes", value: event.target.value }),
                )
              }
              placeholder="Key outcomes or agreements..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Follow-up Actions</label>
            <textarea
              className={`${inputBaseClasses} resize-y`}
              rows={3}
              value={form.follow_up_actions}
              onChange={(event) =>
                dispatch(
                  setField({
                    field: "follow_up_actions",
                    value: event.target.value,
                  }),
                )
              }
              placeholder="Next steps, commitments, or dates."
            />
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSave}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Saving..." : "Save Interaction"}
        </button>

        {lastSavedId && (
          <span className="text-sm font-medium text-gray-500">
            Saved ID: {lastSavedId}
          </span>
        )}
      </div>

      {/* Notifications */}
      {(note || error) && (
        <div className="px-6 pb-6">
          {note && (
            <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-800">{note}</p>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
