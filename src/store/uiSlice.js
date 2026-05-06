import { createSlice } from '@reduxjs/toolkit';

  initialState: {
    isAddExpenseModalOpen: false,
    editingExpense: null,
    refreshTrigger: 0,
  },
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
