import SearchIcon from "@mui/icons-material/Search";

type LessonListSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
};

export function LessonListSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Tìm theo tên bài, môn học...",
}: LessonListSearchProps) {
  return (
    <form
      className="vq-lessons-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <SearchIcon className="vq-lessons-search__icon" />
      <input
        className="vq-lessons-search__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
      />
    </form>
  );
}
