import type { FormEvent } from "react";
import type { Post } from "@/api/types";

type MainPageProps = {
  user: any;
  posts: Post[];
  userPosts: Post[];
  favoritedPosts: Post[];
  favoriteSet: Set<number>;
  currentTab: "own" | "browse" | "favorites";
  message: string;
  error: string;
  showCreateForm: boolean;
  newPostTitle: string;
  newPostDescription: string;
  newPostPrice: string;
  newPostImageUrl: string;
  editingPostId: number | null;
  onSetCurrentTab: (tab: "own" | "browse" | "favorites") => void;
  onSetShowCreateForm: (show: boolean) => void;
  onSetNewPostTitle: (value: string) => void;
  onSetNewPostDescription: (value: string) => void;
  onSetNewPostPrice: (value: string) => void;
  onSetNewPostImageUrl: (value: string) => void;
  onSetEditingPostId: (id: number | null) => void;
  onSetNewPostData: (post: Post | null) => void;
  onSubmitCreatePost: () => Promise<void>;
  onSubmitDeletePost: (id: number) => Promise<void>;
  onSubmitFavoritePost: (id: number, favorited: boolean) => Promise<void>;
  onSubmitLogout: () => Promise<void>;
};

export function MainPage(props: MainPageProps) {
  async function handleSubmitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSubmitCreatePost();
  }

  function startEdit(post: Post) {
    props.onSetEditingPostId(post.id);
    props.onSetNewPostTitle(post.title);
    props.onSetNewPostDescription(post.description || "");
    props.onSetNewPostPrice(post.price ? String(post.price) : "");
    props.onSetNewPostImageUrl(post.image_url || "");
    props.onSetShowCreateForm(true);
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Advertisement Inc</h1>
          <p>Please no inappropriate posts</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={() => props.onSubmitLogout()} type="button">
            Logout ({props.user?.username})
          </button>
        </div>
      </header>

      {props.message ? <div className="notice success">{props.message}</div> : null}
      {props.error ? <div className="notice error">{props.error}</div> : null}

      <main className="panel">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "1rem" }}>
          <button
            className={`btn ${props.currentTab === "own" ? "btn-primary" : ""}`}
            onClick={() => props.onSetCurrentTab("own")}
            style={{ padding: "0.5rem 1rem" }}
          >
            Your Posts
          </button>
          <button
            className={`btn ${props.currentTab === "browse" ? "btn-primary" : ""}`}
            onClick={() => props.onSetCurrentTab("browse")}
            style={{ padding: "0.5rem 1rem" }}
          >
            Browse Posts
          </button>
          <button
            className={`btn ${props.currentTab === "favorites" ? "btn-primary" : ""}`}
            onClick={() => props.onSetCurrentTab("favorites")}
            style={{ padding: "0.5rem 1rem" }}
          >
            Favorites
          </button>
        </div>

        {props.currentTab === "own" && (
          <section className="card">
            <div className="spread">
              <h2>Your Posts & Listings</h2>
              <button className="btn btn-primary" type="button" onClick={() => {
                props.onSetShowCreateForm(!props.showCreateForm);
                if (props.showCreateForm) {
                  props.onSetEditingPostId(null);
                  props.onSetNewPostTitle("");
                  props.onSetNewPostDescription("");
                  props.onSetNewPostPrice("");
                  props.onSetNewPostImageUrl("");
                }
              }}>
                {props.showCreateForm ? "Cancel" : "Create Post"}
              </button>
            </div>

            {props.showCreateForm && (
              <form onSubmit={handleSubmitPost} className="stack" style={{ marginTop: "1rem", padding: "1rem", background: "#f9fbfe", borderRadius: "0.55rem" }}>
                <input
                  type="text"
                  placeholder="Post Title"
                  value={props.newPostTitle}
                  onChange={e => props.onSetNewPostTitle(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={props.newPostDescription}
                  onChange={e => props.onSetNewPostDescription(e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price (optional)"
                  value={props.newPostPrice}
                  onChange={e => props.onSetNewPostPrice(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  value={props.newPostImageUrl}
                  onChange={e => props.onSetNewPostImageUrl(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  {props.editingPostId ? "Update Post" : "Create Post"}
                </button>
              </form>
            )}

            <div className="grid" style={{ marginTop: "1rem" }}>
              {!props.userPosts || props.userPosts.length === 0 ? (
                <p className="muted">No posts yet. Create one to get started!</p>
              ) : (
                props.userPosts.map(post => (
                  <div key={post.id} className="card">
                    {post.image_url && (
                      <img src={post.image_url} alt={post.title} className="card-image" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "0.55rem", marginBottom: "0.5rem" }} />
                    )}
                    <h3>{post.title}</h3>
                    {post.description && <p>{post.description}</p>}
                    {post.price && <p className="price">${post.price.toFixed(2)}</p>}
                    <p className="muted">Posted: {new Date(post.created_at).toLocaleDateString()}</p>
                    <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        className="btn"
                        onClick={() => startEdit(post)}
                        style={{ flex: 1 }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => props.onSubmitDeletePost(post.id)}
                        style={{ flex: 1 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {props.currentTab === "browse" && (
          <section className="card">
            <h2>Browse Posts</h2>
            <div className="grid" style={{ marginTop: "1rem" }}>
              {!props.posts || props.posts.length === 0 ? (
                <p className="muted">No posts available.</p>
              ) : (
                props.posts.map(post => (
                  <div key={post.id} className="card">
                    {post.image_url && (
                      <img src={post.image_url} alt={post.title} className="card-image" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "0.55rem", marginBottom: "0.5rem" }} />
                    )}
                    <h3>{post.title}</h3>
                    {post.description && <p>{post.description}</p>}
                    {post.price && <p className="price">${post.price.toFixed(2)}</p>}
                    <p className="muted">Posted: {new Date(post.created_at).toLocaleDateString()}</p>
                    <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        className={`btn ${props.favoriteSet.has(post.id) ? "btn-danger" : ""}`}
                        onClick={() => props.onSubmitFavoritePost(post.id, props.favoriteSet.has(post.id))}
                        style={{ flex: 1 }}
                      >
                        {props.favoriteSet.has(post.id) ? "★ Unfavorite" : "☆ Favorite"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {props.currentTab === "favorites" && (
          <section className="card">
            <h2>Your Favorites</h2>
            <div className="grid" style={{ marginTop: "1rem" }}>
              {!props.favoritedPosts || props.favoritedPosts.length === 0 ? (
                <p className="muted">No favorited posts yet.</p>
              ) : (
                props.favoritedPosts.map(post => (
                  <div key={post.id} className="card">
                    {post.image_url && (
                      <img src={post.image_url} alt={post.title} className="card-image" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "0.55rem", marginBottom: "0.5rem" }} />
                    )}
                    <h3>{post.title}</h3>
                    {post.description && <p>{post.description}</p>}
                    {post.price && <p className="price">${post.price.toFixed(2)}</p>}
                    <p className="muted">Posted: {new Date(post.created_at).toLocaleDateString()}</p>
                    <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => props.onSubmitFavoritePost(post.id, true)}
                        style={{ flex: 1 }}
                      >
                        ★ Unfavorite
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
