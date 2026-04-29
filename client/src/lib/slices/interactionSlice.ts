import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InteractionStatus = "idle" | "saving" | "saved" | "error";

export type InteractionFormState = {
  hcp_name: string;
  interaction_type: string;
  topics_discussed: string;
  voice_note_consent: boolean;
  voice_note_summary: string;
  materials_shared: string;
  brochures_shared: boolean;
  q_search: string;
  samples_distributed: string;
  no_samples: boolean;
  sentiment: string;
  outcomes: string;
  follow_up_actions: string;
  date: string;
  time: string;
  attendees: string;
};

type InteractionState = {
  form: InteractionFormState;
  status: InteractionStatus;
  error?: string;
  lastSavedId?: number;
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

const now = new Date();
const defaultDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
  now.getDate(),
)}`;
const defaultTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

const initialForm: InteractionFormState = {
  hcp_name: "",
  interaction_type: "",
  topics_discussed: "",
  voice_note_consent: false,
  voice_note_summary: "",
  materials_shared: "",
  brochures_shared: false,
  q_search: "",
  samples_distributed: "",
  no_samples: false,
  sentiment: "",
  outcomes: "",
  follow_up_actions: "",
  date: defaultDate,
  time: defaultTime,
  attendees: "",
};

const initialState: InteractionState = {
  form: initialForm,
  status: "idle",
  error: undefined,
  lastSavedId: undefined,
};

const interactionSlice = createSlice({
  name: "interaction",
  initialState,
  reducers: {
    setField<K extends keyof InteractionFormState>(
      state: InteractionState,
      action: PayloadAction<{ field: K; value: InteractionFormState[K] }>,
    ) {
      (state.form as InteractionFormState)[action.payload.field] =
        action.payload.value;
    },
    setForm(state, action: PayloadAction<Partial<InteractionFormState>>) {
      state.form = { ...state.form, ...action.payload };
    },
    resetForm(state) {
      state.form = initialForm;
      state.status = "idle";
      state.error = undefined;
      state.lastSavedId = undefined;
    },
    setStatus(state, action: PayloadAction<InteractionStatus>) {
      state.status = action.payload;
      if (action.payload !== "error") {
        state.error = undefined;
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    setLastSavedId(state, action: PayloadAction<number | undefined>) {
      state.lastSavedId = action.payload;
    },
  },
});

export const {
  setField,
  setForm,
  resetForm,
  setStatus,
  setError,
  setLastSavedId,
} = interactionSlice.actions;
export default interactionSlice.reducer;
