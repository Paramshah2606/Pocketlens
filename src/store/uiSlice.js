import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAddExpenseModalOpen: false,
  // Which form the add/edit modal shows: 'expense' | 'income'
  modalType: 'expense',
  editingExpense: null,
  editingIncome: null,
  // Date ("YYYY-MM-DD") to pre-fill when adding from the calendar
  presetDate: null,
  refreshTrigger: 0,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddExpenseModal: (state, action) => {
      state.isAddExpenseModalOpen = true;
      state.modalType = 'expense';
      state.editingExpense = action.payload || null;
      state.editingIncome = null;
      state.presetDate = null;
    },
    openAddIncomeModal: (state, action) => {
      state.isAddExpenseModalOpen = true;
      state.modalType = 'income';
      state.editingIncome = action.payload || null;
      state.editingExpense = null;
      state.presetDate = null;
    },
    // Add a new expense or income on a specific day: payload { type, date }
    openAddModalForDate: (state, action) => {
      state.isAddExpenseModalOpen = true;
      state.modalType = action.payload.type === 'income' ? 'income' : 'expense';
      state.presetDate = action.payload.date;
      state.editingExpense = null;
      state.editingIncome = null;
    },
    // Switch between the expense and income form while adding (not while editing)
    setModalType: (state, action) => {
      state.modalType = action.payload;
    },
    closeAddExpenseModal: (state) => {
      state.isAddExpenseModalOpen = false;
      state.modalType = 'expense';
      state.editingExpense = null;
      state.editingIncome = null;
      state.presetDate = null;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const {
  openAddExpenseModal,
  openAddIncomeModal,
  openAddModalForDate,
  setModalType,
  closeAddExpenseModal,
  triggerRefresh,
} = uiSlice.actions;

export default uiSlice.reducer;
