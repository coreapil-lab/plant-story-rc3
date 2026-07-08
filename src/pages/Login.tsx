import { loginWithGoogle } from "../services/authService";
import "./Login.css";

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? `Google 로그인 실패: ${error.message}`
          : "Google 로그인에 실패했습니다."
      );
    }
  };

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

        <button type="button" className="google-button" onClick={handleLogin}>
          Google로 시작하기
        </button>
      </section>
    </main>
  );
}