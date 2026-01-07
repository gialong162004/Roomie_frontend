import { useState, useEffect } from "react";
import { NoteAPI } from "../api/api";
import type { INoteItem } from "../types/note.type";
import { useToast } from "./common/ToastProvider";

const daysOfWeek = ["T2","T3","T4","T5","T6","T7","CN"];

interface NoteItem {
  title: string;
  description?: string;
}

interface Note {
  _id?: string;
  date: string;
  items: NoteItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface DayCell {
  day: number;
  monthOffset: -1 | 0 | 1;
}

const AppointmentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDescription, setNewNoteDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // State cho chỉnh sửa và hiển thị form
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Load notes của cả tháng khi thay đổi tháng/năm
  useEffect(() => {
    loadMonthNotes(month, year);
  }, [month, year]);

  // Load notes khi chọn ngày
  useEffect(() => {
    if (selectedDate) {
      loadNotesByDate(selectedDate);
      setShowForm(false);
      setEditingIndex(null);
      setNewNoteTitle("");
      setNewNoteDescription("");
    }
  }, [selectedDate]);

  const loadMonthNotes = async (m: number, y: number) => {
    try {
      // Load notes cho tất cả các ngày trong tháng
      const lastDay = new Date(y, m + 1, 0);
      
      const allNotes: Note[] = [];
      for (let day = 1; day <= lastDay.getDate(); day++) {
        try {
          const date = new Date(y, m, day);
          const response = await NoteAPI.getNote(date);
          if (response.data && response.data.items.length > 0) {
            allNotes.push(response.data);
          }
        } catch (err) {
          // Ngày không có note, bỏ qua
        }
      }
      setNotes(allNotes);
    } catch (error) {
      console.error("Error loading month notes:", error);
    }
  };

  const loadNotesByDate = async (dateStr: string) => {
    try {
      setLoading(true);
      const date = new Date(dateStr);
      const response = await NoteAPI.getNote(date);
      
      if (response.data) {
        // Cập nhật note của ngày được chọn trong danh sách notes
        setNotes(prevNotes => {
          const filtered = prevNotes.filter(n => n.date.slice(0, 10) !== dateStr);
          return [...filtered, response.data];
        });
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle || !selectedDate) return;

    try {
      setLoading(true);
      const date = new Date(selectedDate);
      const existingNote = notes.find(n => n.date.slice(0, 10) === selectedDate);
      
      if (editingIndex !== null && existingNote && existingNote._id) {
        // Đang ở chế độ sửa
        const updatedItems = existingNote.items.map((item, i) => 
          i === editingIndex 
            ? { title: newNoteTitle, description: newNoteDescription }
            : item
        );
        await NoteAPI.updateNote(existingNote._id, updatedItems as INoteItem[]);
        showToast('Cập nhật lịch hẹn thành công!', { type: 'success' });
      } else if (existingNote && existingNote._id) {
        // Thêm mới vào note hiện tại
        const updatedItems = [
          ...existingNote.items,
          { title: newNoteTitle, description: newNoteDescription }
        ];
        await NoteAPI.updateNote(existingNote._id, updatedItems as INoteItem[]);
        showToast('Thêm lịch hẹn thành công!', { type: 'success' });
      } else {
        // Tạo note mới
        await NoteAPI.createNote(date, [{ title: newNoteTitle, description: newNoteDescription }]);
        showToast('Thêm lịch hẹn thành công!', { type: 'success' });
      }
      
      setNewNoteTitle("");
      setNewNoteDescription("");
      setShowForm(false);
      setEditingIndex(null);
      
      setTimeout(() => {
        loadNotesByDate(selectedDate);
        loadMonthNotes(month, year); // Reload lại notes của tháng
      }, 300);
    } catch (error) {
      console.error("Error adding/updating note:", error);
      showToast('Có lỗi xảy ra', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (index: number, item: NoteItem) => {
    setEditingIndex(index);
    setNewNoteTitle(item.title);
    setNewNoteDescription(item.description || "");
    setShowForm(true);
  };

  const handleDeleteNoteItem = async (noteId: string, itemIndex: number) => {
    try {
      setLoading(true);
      const note = notes.find(n => n._id === noteId);
      if (!note) return;

      const updatedItems = note.items.filter((_, i) => i !== itemIndex);
      
      if (updatedItems.length === 0) {
        await NoteAPI.deleteNote(noteId);
        showToast('Xóa lịch hẹn thành công!', { type: 'success' });
      } else {
        await NoteAPI.updateNote(noteId, updatedItems as INoteItem[]);
        showToast('Xóa lịch hẹn thành công!', { type: 'success' });
      }
      
      if (selectedDate) {
        await loadNotesByDate(selectedDate);
        await loadMonthNotes(month, year); // Reload lại notes của tháng
      }
    } catch (error) {
      console.error("Error deleting note item:", error);
      showToast('Có lỗi xảy ra khi xóa lịch hẹn', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingIndex(null);
    setNewNoteTitle("");
    setNewNoteDescription("");
  };

  if (!isOpen) return null;

  const generateDays = (month: number, year: number) => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let days: DayCell[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, monthOffset: -1 });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, monthOffset: 0 });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, monthOffset: 1 });
    }

    return days;
  };

  const days = generateDays(month, year);
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const formatDate = (d: number, offset: -1 | 0 | 1) => {
    let m = month + offset;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    return `${y}-${(m + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  };

  const selectedNote = notes.find(n => n.date.slice(0, 10) === selectedDate);
  const noteItems = selectedNote?.items || [];
  

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-auto z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-5xl w-full relative p-6 flex gap-6">

        {/* Cột trái - Lịch */}
        <div className="flex-1">
          <button
            className="absolute top-2 right-2 text-2xl font-bold text-gray-600 hover:text-primary"
            onClick={onClose}
          >
            ×
          </button>

          <div className="flex justify-between items-center mb-4">
            <button
              className="px-3 py-1 rounded bg-primary text-white hover:bg-primaryDark"
              onClick={handlePrevMonth}
            >
              {"<"}
            </button>
            <div className="font-semibold text-lg">{monthName} {year}</div>
            <button
              className="px-3 py-1 rounded bg-primary text-white hover:bg-primaryDark"
              onClick={handleNextMonth}
            >
              {">"}
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-2">
            {daysOfWeek.map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            const dateStr = formatDate(cell.day, cell.monthOffset);
            const dayNote = notes.find(n => n.date.slice(0, 10) === dateStr);
            const hasNotes = dayNote && dayNote.items.length > 0;
            const isToday = cell.day === today.getDate() && cell.monthOffset === 0 && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDate === dateStr;
            const opacityClass = cell.monthOffset !== 0 ? "opacity-40" : "";

            return (
              <div
                key={i}
                className={`relative p-2 h-16 border rounded-lg cursor-pointer hover:bg-gray-100 
                  ${isSelected ? "border-primary" : "border-transparent"} 
                  ${opacityClass}`}
                onClick={() => {
                  if (cell.monthOffset === -1) {
                    if (month === 0) { setMonth(11); setYear(year - 1); } 
                    else setMonth(month - 1);
                  } else if (cell.monthOffset === 1) {
                    if (month === 11) { setMonth(0); setYear(year + 1); } 
                    else setMonth(month + 1);
                  }
                  setSelectedDate(dateStr);
                }}
              >
                <div className="text-right text-sm font-semibold">
                  {isToday ? (
                    <span className="bg-primary px-2 py-1 rounded-full text-white">
                      {cell.day}
                    </span>
                  ) : (
                    cell.day
                  )}
                </div>
                {hasNotes && (
                  <div className="absolute bottom-1 left-1 right-1 bg-primary text-white text-xs rounded px-1 truncate">
                    {dayNote.items[0].title}
                    {dayNote.items.length > 1 && ` +${dayNote.items.length - 1}`}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Cột phải - Danh sách lịch hẹn */}
        <div className="w-80 border-l pl-6 relative">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-lg mb-4">
                Lịch hẹn ngày {selectedDate}
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                    {noteItems.length > 0 ? (
                      noteItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-secondary p-3 rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-200 transition"
                          onClick={() => handleEditNote(idx, item)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item.title}</div>
                            {item.description && (
                              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                            )}
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700 ml-2 text-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectedNote?._id && handleDeleteNoteItem(selectedNote._id, idx);
                            }}
                            disabled={loading}
                            title="Xóa"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-4">
                        Chưa có lịch hẹn nào
                      </div>
                    )}
                  </div>

                  {/* Nút + hoặc Form */}
                  {!showForm ? (
                    <button
                      className="absolute bottom-2 right-2 w-14 h-14 bg-primary text-white rounded-full hover:bg-primaryDark flex items-center justify-center text-3xl font-bold shadow-lg hover:shadow-xl transition leading-none"
                      onClick={() => setShowForm(true)}
                    >
                      +
                    </button>
                  ) : (
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="font-medium mb-2">
                        {editingIndex !== null ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn mới"}
                      </div>
                      <input
                        type="text"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Tiêu đề lịch hẹn"
                        className="p-2 rounded border w-full mb-2"
                        disabled={loading}
                      />
                      <textarea
                        value={newNoteDescription}
                        onChange={(e) => setNewNoteDescription(e.target.value)}
                        placeholder="Mô tả chi tiết (tùy chọn)"
                        className="p-2 rounded border w-full mb-2 resize-none"
                        rows={3}
                        disabled={loading}
                      />
                      <div className="flex gap-2">
                        <button
                          className="bg-primary text-white px-3 py-1 rounded hover:bg-primaryDark flex-1 disabled:opacity-50"
                          onClick={handleAddNote}
                          disabled={loading || !newNoteTitle}
                        >
                          {loading ? "Đang lưu..." : (editingIndex !== null ? "Cập nhật" : "Thêm")}
                        </button>
                        <button
                          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
                          onClick={handleCancelForm}
                          disabled={loading}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Chọn một ngày để xem lịch hẹn
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AppointmentModal;