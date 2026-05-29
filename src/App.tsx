import "./index.css";

import { AuthPage } from "./pages/authPage.tsx";
import { MainPage } from "./pages/mainPage.tsx";
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
    <MainPage
      user={state.user}
      posts={state.posts}
      userPosts={state.userPosts}
      favoritedPosts={state.favoritedPosts}
      favoriteSet={state.favoriteSet}
      currentTab={state.currentTab}
      message={state.message}
      error={state.error}
      showCreateForm={state.showCreateForm}
      newPostTitle={state.newPostTitle}
      newPostDescription={state.newPostDescription}
      newPostPrice={state.newPostPrice}
      newPostImageUrl={state.newPostImageUrl}
      editingPostId={state.editingPostId}
      onSetCurrentTab={actions.setCurrentTab}
      onSetShowCreateForm={actions.setShowCreateForm}
      onSetNewPostTitle={actions.setNewPostTitle}
      onSetNewPostDescription={actions.setNewPostDescription}
      onSetNewPostPrice={actions.setNewPostPrice}
      onSetNewPostImageUrl={actions.setNewPostImageUrl}
      onSetEditingPostId={actions.setEditingPostId}
      onSetNewPostData={() => {}}
      onSubmitCreatePost={actions.submitCreatePost}
      onSubmitDeletePost={actions.submitDeletePost}
      onSubmitFavoritePost={actions.submitFavoritePost}
      onSubmitLogout={actions.submitLogout}
    />
  );
}

export default App;
