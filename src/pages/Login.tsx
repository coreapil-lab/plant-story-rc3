import { loginWithGoogle } from "../services/authService";
import "./Login.css";

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">🌿</div>

        <span className="hero-label">Plant Story</span>

        <h1 className="login-title">식물의 이야기를 기록하세요</h1>

        <p className="login-desc">
          물주기, 영양제, 메모까지
          <br />
          나만의 식물 관리 다이어리
        </p>

        <button
          type="button"
          className="google-button"
          onClick={loginWithGoogle}
        >
          Google로 시작하기
        </button>
      </section>
    </main>
  );
}