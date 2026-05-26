import "./index.css";

import { AuthPage } from "./pages/AuthPage";
import { useAdvertisementApp } from "./api/useAdvertisementApp.ts";

export function App() {
  const app = useAdvertisementApp();
  const { state, actions } = app;

  if (!state.sessionReady) {
    return (
      <div className="page">
        <main className="panel auth-page">
          <section className="auth-box">
            <h2>Loading session...</h2>
            <p className="muted">Please wait a moment.</p>
          </section>
        </main>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <AuthPage
        loginMode={state.loginMode}
        authName={state.authName}
        authEmail={state.authEmail}
        authPassword={state.authPassword}
        message={state.message}
        error={state.error}
        onSetLoginMode={actions.setLoginMode}
        onSetAuthName={actions.setAuthName}
        onSetAuthEmail={actions.setAuthEmail}
        onSetAuthPassword={actions.setAuthPassword}
        onSubmitAuth={actions.submitAuth}
      />
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Welcome to advertisements inc.</h1>
          <p>Please do not post any inappropriate content.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={() => actions.submitLogout()} type="button">
            Logout ({state.user?.name})
          </button>
        </div>
      </header>

      {state.message ? <div className="notice success">{state.message}</div> : null}
      {state.error ? <div className="notice error">{state.error}</div> : null}

      <main className="panel">
        <section className="card">
          <h2>Welcome, {state.user?.name}!</h2>
          <p>You have successfully logged in.</p>
          <div className="form-group">
            <label>Email:</label>
            <p>{state.user?.email}</p>
          </div>
          <div className="form-group">
            <label>User Role:</label>
            <p>{state.user?.role === 'admin' ? 'Administrator' : 'Regular User'}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
