import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InteractionStatus = "idle" | "saving" | "saved" | "error";

export type InteractionFormState = {
  hcp_name: string;
  product: string;
  summary: string;
  follow_up: string;
  sentiment: string;
  interaction_type: string;
  occurred_at: string;
};

type InteractionState = {
  form: InteractionFormState;
  status: InteractionStatus;
  error?: string;
  lastSavedId?: number;
};

const initialForm: InteractionFormState = {
  hcp_name: "",
  product: "",
  summary: "",
  follow_up: "",
  sentiment: "",
  interaction_type: "",
  occurred_at: "",
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
    setField(
      state,
      action: PayloadAction<{
        field: keyof InteractionFormState;
        value: string;
      }>,
    ) {
      state.form[action.payload.field] = action.payload.value;
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
