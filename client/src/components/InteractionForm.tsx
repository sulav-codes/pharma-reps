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

const sentimentOptions = ["positive", "neutral", "negative", "mixed"];
const interactionOptions = ["visit", "call", "email", "virtual", "event"];

const statusLabel = {
  idle: "Ready",
  saving: "Saving",
  saved: "Saved",
  error: "Needs attention",
} as const;

export default function InteractionForm() {
  const dispatch = useAppDispatch();
  const { form, status, error, lastSavedId } = useAppSelector(
    (state) => state.interaction,
  );
  const [note, setNote] = useState<string | null>(null);

  const handleSave = async () => {
    dispatch(setStatus("saving"));
    setNote(null);

    try {
      const response = await createInteraction({
        ...form,
        occurred_at: form.occurred_at || undefined,
      });

      dispatch(setStatus("saved"));
      dispatch(setLastSavedId(response?.id));
      if (response) {
        dispatch(
          setForm({
            hcp_name: response.hcp_name || "",
            product: response.product || "",
            summary: response.summary || "",
            follow_up: response.follow_up || "",
            sentiment: response.sentiment || "",
            interaction_type: response.interaction_type || "",
            occurred_at: response.occurred_at
              ? response.occurred_at.slice(0, 16)
              : "",
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

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Structured Form</h2>
          <p className="panel-subtitle">
            Capture details precisely, then submit.
          </p>
        </div>
        <span className={`status status-${status}`}>{statusLabel[status]}</span>
      </div>

      <div className="form-grid">
        <label className="field">
          HCP name
          <input
            className="input"
            value={form.hcp_name}
            onChange={(event) =>
              dispatch(
                setField({ field: "hcp_name", value: event.target.value }),
              )
            }
            placeholder="Dr. Avery Patel"
          />
        </label>

        <label className="field">
          Product
          <input
            className="input"
            value={form.product}
            onChange={(event) =>
              dispatch(
                setField({ field: "product", value: event.target.value }),
              )
            }
            placeholder="Zorvia"
          />
        </label>

        <label className="field">
          Interaction type
          <select
            className="input"
            value={form.interaction_type}
            onChange={(event) =>
              dispatch(
                setField({
                  field: "interaction_type",
                  value: event.target.value,
                }),
              )
            }
          >
            <option value="">Select</option>
            {interactionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Sentiment
          <select
            className="input"
            value={form.sentiment}
            onChange={(event) =>
              dispatch(
                setField({ field: "sentiment", value: event.target.value }),
              )
            }
          >
            <option value="">Select</option>
            {sentimentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Occurred at
          <input
            className="input"
            type="datetime-local"
            value={form.occurred_at}
            onChange={(event) =>
              dispatch(
                setField({ field: "occurred_at", value: event.target.value }),
              )
            }
          />
        </label>

        <label className="field full">
          Summary
          <textarea
            className="input textarea"
            rows={4}
            value={form.summary}
            onChange={(event) =>
              dispatch(
                setField({ field: "summary", value: event.target.value }),
              )
            }
            placeholder="Key discussion points and responses."
          />
        </label>

        <label className="field full">
          Follow-up
          <textarea
            className="input textarea"
            rows={3}
            value={form.follow_up}
            onChange={(event) =>
              dispatch(
                setField({ field: "follow_up", value: event.target.value }),
              )
            }
            placeholder="Next action or commitment."
          />
        </label>
      </div>

      <div className="form-footer">
        <button
          className="btn primary"
          onClick={handleSave}
          disabled={status === "saving"}
        >
          Save interaction
        </button>
        <div className="helper">
          {lastSavedId ? (
            <span>Saved ID: {lastSavedId}</span>
          ) : (
            <span>Form mode writes directly to CRM.</span>
          )}
        </div>
      </div>

      {note ? <p className="notice">{note}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
