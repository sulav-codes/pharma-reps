import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatStatus = "idle" | "loading" | "error";

type ChatState = {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
};

const initialState: ChatState = {
  messages: [],
  status: "idle",
  error: undefined,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    clearMessages(state) {
      state.messages = [];
    },
    setStatus(state, action: PayloadAction<ChatStatus>) {
      state.status = action.payload;
      if (action.payload !== "error") {
        state.error = undefined;
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
  },
});

export const { addMessage, clearMessages, setStatus, setError } =
  chatSlice.actions;
export default chatSlice.reducer;
