interface Props {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export default function AddPlant({ value, onChange, onAdd }: Props) {
  return (
    <div className="form-card">
      <div className="form-group">
        <label className="form-label">새 식물 추가</label>

        <input
          className="form-input"
          value={value}
          placeholder="식물 이름을 입력하세요"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
          }}
        />
      </div>

      <button className="primary-button" type="button" onClick={onAdd}>
        추가
      </button>
    </div>
  );
}