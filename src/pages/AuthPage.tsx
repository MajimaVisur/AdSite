import type { FormEvent } from "react";

type AuthPageProps = {
  loginMode: "login" | "register";
  authName: string;
  authEmail: string;
  authPassword: string;
  message: string;
  error: string;
  onSetLoginMode: (mode: "login" | "register") => void;
  onSetAuthName: (value: string) => void;
  onSetAuthEmail: (value: string) => void;
  onSetAuthPassword: (value: string) => void;
  onSubmitAuth: () => Promise<void>;
};

export function AuthPage(props: AuthPageProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSubmitAuth();
  }

  function toggleMode() {
    props.onSetLoginMode(props.loginMode === "login" ? "register" : "login");
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Advertisement Board</h1>
          <p>Please login to continue to the application.</p>
        </div>
      </header>

      {props.message ? <div className="notice success">{props.message}</div> : null}
      {props.error ? <div className="notice error">{props.error}</div> : null}

      <main className="panel auth-page">
        <section className="auth-box">
          <h2>{props.loginMode === "login" ? "Login" : "Register"}</h2>
          <form onSubmit={handleSubmit} className="stack">
            {props.loginMode === "register" ? (
              <input value={props.authName} onChange={event => props.onSetAuthName(event.target.value)} placeholder="Name" required />
            ) : null}
            <input value={props.authEmail} onChange={event => props.onSetAuthEmail(event.target.value)} placeholder="Email" type="email" required />
            <input
              value={props.authPassword}
              onChange={event => props.onSetAuthPassword(event.target.value)}
              placeholder="Password"
              type="password"
              required
            />
            <button className="btn btn-primary" type="submit">
              {props.loginMode === "login" ? "Login" : "Create account"}
            </button>
          </form>

          <p className="muted">Demo Admin: admin@example.com / admin123</p>
          <p className="muted">Demo User: user@example.com / user123</p>

          <button className="btn" type="button" onClick={toggleMode}>
            {props.loginMode === "login" ? "Need an account? Register" : "Have an account? Login"}
          </button>
        </section>
      </main>
    </div>
  );
}
