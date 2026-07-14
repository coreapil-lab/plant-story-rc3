import "./BottomTabBar.css";

type BottomTabBarProps = {
  activeTab: "home" | "guide";
  onHome: () => void;
  onGuide: () => void;
};

function BottomTabBar({
  activeTab,
  onHome,
  onGuide,
}: BottomTabBarProps) {
  return (
    <nav className="bottom-tab-bar" aria-label="하단 메뉴">
      <button
        type="button"
        className={
          activeTab === "home"
            ? "bottom-tab-item bottom-tab-item-active"
            : "bottom-tab-item"
        }
        onClick={onHome}
      >
        <span className="bottom-tab-icon" aria-hidden="true">
          🏠
        </span>
        <span>홈</span>
      </button>

      <button
        type="button"
        className={
          activeTab === "guide"
            ? "bottom-tab-item bottom-tab-item-active"
            : "bottom-tab-item"
        }
        onClick={onGuide}
      >
        <span className="bottom-tab-icon" aria-hidden="true">
          🌿
        </span>
        <span>식물정보</span>
      </button>
    </nav>
  );
}

export default BottomTabBar;