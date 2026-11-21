import React, { useState, useEffect } from 'react';
import {
  ClassInfo,
  Student,
  ViolationCategory,
  ViolationRecord,
  StudentViolationSummary
} from './types';
import {
  getStoredClassInfo,
  saveClassInfo,
  getStoredStudents,
  saveStudents,
  getStoredCategories,
  saveCategories,
  getStoredRecords,
  saveRecords
} from './utils/storage';
import { getTodayDateString } from './utils/date';

import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { Toast, ToastMessage } from './components/Toast';

import { StudentModal } from './components/StudentModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ViolationCategoryModal } from './components/ViolationCategoryModal';
import { SendZaloModal } from './components/SendZaloModal';

import { OverviewView } from './views/OverviewView';
import { CheckinView } from './views/CheckinView';
import { StudentsView } from './views/StudentsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  // Master State
  const [classInfo, setClassInfo] = useState<ClassInfo>(getStoredClassInfo);
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [categories, setCategories] = useState<ViolationCategory[]>(getStoredCategories);
  const [records, setRecords] = useState<ViolationRecord[]>(getStoredRecords);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ViolationCategory | null>(null);

  const [isSendZaloOpen, setIsSendZaloOpen] = useState(false);
  const [selectedSummaryForZalo, setSelectedSummaryForZalo] = useState<StudentViolationSummary | null>(null);
  const [timePeriodLabelForZalo, setTimePeriodLabelForZalo] = useState<string>('');

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Student Actions
  const handleSaveStudent = (savedStudent: Student) => {
    setStudents(prev => {
      let updated: Student[];
      const exists = prev.some(s => s.id === savedStudent.id);
      if (exists) {
        updated = prev.map(s => s.id === savedStudent.id ? savedStudent : s);
        addToast(`Đã cập nhật thông tin học sinh ${savedStudent.name}!`, 'success');
      } else {
        updated = [...prev, savedStudent];
        addToast(`Đã thêm học sinh ${savedStudent.name} vào lớp!`, 'success');
      }
      // Sort by STT
      updated.sort((a, b) => a.stt - b.stt);
      saveStudents(updated);
      return updated;
    });
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveStudents(updated);
      return updated;
    });
  };

  const handleImportStudents = (newStudents: Student[], mode: 'replace' | 'append') => {
    setStudents(prev => {
      let updated: Student[];
      if (mode === 'replace') {
        updated = [...newStudents];
      } else {
        // Append mode
        const existingMap = new Map(prev.map(s => [s.name.trim().toLowerCase(), s]));
        newStudents.forEach(s => {
          existingMap.set(s.name.trim().toLowerCase(), s);
        });
        updated = Array.from(existingMap.values());
      }
      updated.sort((a, b) => a.stt - b.stt);
      saveStudents(updated);
      addToast(`Đã nạp thành công ${newStudents.length} học sinh từ file Excel!`, 'success');
      return updated;
    });
  };

  // Category Actions
  const handleSaveCategory = (savedCategory: ViolationCategory) => {
    setCategories(prev => {
      let updated: ViolationCategory[];
      const exists = prev.some(c => c.id === savedCategory.id);
      if (exists) {
        updated = prev.map(c => c.id === savedCategory.id ? savedCategory : c);
        addToast(`Đã cập nhật lỗi "${savedCategory.name}"!`, 'success');
      } else {
        updated = [...prev, savedCategory];
        addToast(`Đã thêm lỗi mới "${savedCategory.name}" (-${savedCategory.pointsDeducted}đ)!`, 'success');
      }
      saveCategories(updated);
      return updated;
    });
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCategories(updated);
      return updated;
    });
  };

  // Violation Records Actions
  const handleSaveRecords = (newRecords: ViolationRecord[]) => {
    setRecords(prev => {
      const updated = [...prev, ...newRecords];
      saveRecords(updated);
      return updated;
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveRecords(updated);
      return updated;
    });
  };

  // Class Info Actions
  const handleSaveClassInfo = (newInfo: ClassInfo) => {
    setClassInfo(newInfo);
    saveClassInfo(newInfo);
  };

  // Reload all from storage (e.g. after restore or sample reset)
  const handleReloadAllData = () => {
    setClassInfo(getStoredClassInfo());
    setStudents(getStoredStudents());
    setCategories(getStoredCategories());
    setRecords(getStoredRecords());
  };

  // Open Zalo Modal for student
  const handleOpenSendZalo = (summary: StudentViolationSummary, timePeriodLabel: string) => {
    setSelectedSummaryForZalo(summary);
    setTimePeriodLabelForZalo(timePeriodLabel);
    setIsSendZaloOpen(true);
  };

  // Calculate today's violations count for badge on BottomNav
  const todayStr = getTodayDateString();
  const todayViolationCount = records.filter(r => r.date === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-blue-200">
      {/* Top Mobile Navbar */}
      <Navbar classInfo={classInfo} activeTab={activeTab} />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'overview' && (
          <OverviewView
            students={students}
            records={records}
            categories={categories}
            classInfo={classInfo}
            onChangeTab={setActiveTab}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckinView
            students={students}
            categories={categories}
            records={records}
            onSaveRecords={handleSaveRecords}
            onDeleteRecord={handleDeleteRecord}
            onOpenCategoryModal={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onToast={addToast}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            classInfo={classInfo}
            onOpenAddModal={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onOpenEditModal={(student) => {
              setEditingStudent(student);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
            onToast={addToast}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            students={students}
            records={records}
            classInfo={classInfo}
            onOpenSendZalo={handleOpenSendZalo}
            onToast={addToast}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            classInfo={classInfo}
            categories={categories}
            onSaveClassInfo={handleSaveClassInfo}
            onOpenAddCategory={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onOpenEditCategory={(cat) => {
              setEditingCategory(cat);
              setIsCategoryModalOpen(true);
            }}
            onDeleteCategory={handleDeleteCategory}
            onReloadAllData={handleReloadAllData}
            onToast={addToast}
          />
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        todayViolationCount={todayViolationCount}
      />

      {/* Modals & Dialogs */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
        nextStt={students.length + 1}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImport={handleImportStudents}
      />

      <ViolationCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
        editingCategory={editingCategory}
      />

      <SendZaloModal
        isOpen={isSendZaloOpen}
        onClose={() => setIsSendZaloOpen(false)}
        summary={selectedSummaryForZalo}
        classInfo={classInfo}
        timePeriodLabel={timePeriodLabelForZalo}
        onToast={addToast}
      />

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
