import { useState, useEffect } from "react";
import { SurveyAPI } from "../api/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Question {
  questionId: string;
  label: string;
  type: "select" | "chip" | "text";
  options: string[];
  required: boolean;
  order: number;
}

interface SurveyData {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface ChipGroupProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

interface QuestionFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

interface SurveyModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

type Answers = Record<string, string>;

const QUESTION_TYPE_MAP: Record<string, Question["type"]> = {
  q_city: "select",
  q_category: "chip",
  q_job: "chip",
};

function resolveType(q: Question): Question["type"] {
  if (q.options && q.options.length > 0 && q.options.length < 5) {
    return "chip";
  }
  return QUESTION_TYPE_MAP[q.questionId] ?? q.type;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChipGroup({ options, value, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ${
            value === opt
              ? "bg-primary text-white border-primary"
              : "bg-secondary text-textGray border-borderLight hover:border-primary hover:text-primary hover:bg-secondary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function QuestionField({ question, value, onChange }: QuestionFieldProps) {
  const type = resolveType(question);

  // 1. Trường hợp Chip
  if (type === "chip") {
    return (
      <ChipGroup options={question.options} value={value} onChange={onChange} />
    );
  }

  // 2. Trường hợp Select
  if (type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-borderLight bg-white text-textDark text-sm focus:outline-none focus:border-primary cursor-pointer"
      >
        <option value="" disabled>Chọn {question.label.toLowerCase()}...</option>
        {question.options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  // 3. Trường hợp Text (Input nhập liệu)
  return (
    <input
      type="text"
      value={value}
      placeholder="Nhập câu trả lời..."
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-borderLight bg-white text-textDark text-sm focus:outline-none focus:border-primary"
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SurveyModal({ isOpen = true, onClose, onSuccess }: SurveyModalProps) {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSurvey = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await SurveyAPI.getSurvey();
        setSurveyData(res.data);
      } catch (err) {
        setError("Không thể tải khảo sát. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [isOpen]);

  const sorted = surveyData
    ? [...surveyData.questions].sort((a, b) => a.order - b.order)
    : [];

  const handleChange = (questionId: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await SurveyAPI.submitSurvey(answers);
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      console.error("Lỗi khi nộp khảo sát:", err);
      setError("Có lỗi xảy ra khi gửi khảo sát. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setAnswers({});
    setSubmitted(false);
    setSurveyData(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-primary px-6 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-white uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/30 bg-white/20">
              Khảo sát 2026
            </span>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/30 transition-colors text-white text-lg leading-none"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          <h2 className="text-white text-lg font-medium mt-3 leading-snug">
            {surveyData?.title ?? "Đang tải..."}
          </h2>
          <p className="text-white/75 text-sm mt-1">
            {surveyData?.description ?? ""}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <svg
              className="animate-spin w-5 h-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm text-textGray">Đang tải khảo sát...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => { setError(null); setSurveyData(null); }}
              className="text-sm text-primary underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Body */}
        {!loading && !error && surveyData && (
          <>
            {!submitted ? (
              <>
                <div className="px-6 pt-5 pb-2 flex flex-col gap-5">
                  {sorted.map((q, idx) => (
                    <div key={q.questionId}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-secondary text-primaryDark text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-textDark">
                          {q.label}
                        </span>
                      </div>
                      <QuestionField
                        question={q}
                        value={answers[q.questionId] ?? ""}
                        onChange={(val: string) => handleChange(q.questionId, val)}
                      />
                      {idx < sorted.length - 1 && (
                        <div className="border-t border-borderLight mt-5" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-xs text-textGray">
                    Tất cả câu hỏi không bắt buộc
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primaryDark text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi khảo sát
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl">
                  ✓
                </div>
                <p className="text-base font-medium text-textDark">
                  Cảm ơn bạn đã tham gia!
                </p>
                <p className="text-sm text-textGray">
                  Phản hồi của bạn đã được ghi nhận thành công.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm text-primary hover:text-primaryDark underline underline-offset-2"
                >
                  Đóng
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}