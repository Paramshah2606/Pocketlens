import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAddExpenseModalOpen: false,
  editingExpense: null,
  refreshTrigger: 0,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddExpenseModal: (state, action) => {
      state.isAddExpenseModalOpen = true;
      state.editingExpense = action.payload || null;
    },
    closeAddExpenseModal: (state) => {
      state.isAddExpenseModalOpen = false;
      state.editingExpense = null;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const { openAddExpenseModal, closeAddExpenseModal, triggerRefresh } = uiSlice.actions;

export default uiSlice.reducer;
