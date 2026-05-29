import { getMe, login, logout, register, listPosts, createPost, updatePost, deletePost, addFavorite, removeFavorite, getUserFavorites } from "@/api/appApi";
import { useEffect, useState } from "react";
import type { User, Post } from "./types";

const TOKEN_KEY = "ad-app-token";

export function useAdvertisementApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [favoritedPosts, setFavoritedPosts] = useState<Post[]>([]);
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(new Set());
  const [currentTab, setCurrentTab] = useState<"own" | "browse" | "favorites">("browse");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostDescription, setNewPostDescription] = useState("");
  const [newPostPrice, setNewPostPrice] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const isAuthenticated = !!user;

  function storeToken(nextToken: string | null) {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  }

  function clearNotices() {
    setMessage("");
    setError("");
  }

  async function loadPosts() {
    try {
      const response = await listPosts();
      const allPosts = response.posts || [];
      setPosts(allPosts.filter(p => p.user_id !== user?.id));
      setUserPosts(allPosts.filter(p => p.user_id === user?.id));
      
      const favResponse = await getUserFavorites(token!);
      const favoritedPostsList = favResponse.favorites || [];
      setFavoritedPosts(favoritedPostsList);
      setFavoriteSet(new Set(favoritedPostsList.map(p => p.id)));
    } catch (err) {
      console.error("Failed to load posts:", err);
      setPosts([]);
      setUserPosts([]);
      setFavoritedPosts([]);
      setError(err instanceof Error ? err.message : "Failed to load posts");
    }
  }

  async function loadSession() {
    setSessionReady(false);
    if (!token) {
      setUser(null);
      setSessionReady(true);
      return;
    }

    try {
      const response = await getMe(token);
      setUser(response.user);
      await loadPosts();
    } catch {
      storeToken(null);
      setUser(null);
    } finally {
      setSessionReady(true);
    }
  }

  async function submitAuth() {
    clearNotices();

    try {
      if (loginMode === "login") {
        const response = await login(authEmail, authPassword);
        storeToken(response.token);
        setUser(response.user);
        setMessage(`Welcome back, ${response.user.username}.`);
      } else {
        const response = await register(authName, authEmail, authPassword);
        storeToken(response.token);
        setUser(response.user);
        setMessage(`Account created. Hello, ${response.user.username}.`);
      }

      setAuthPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  async function submitLogout() {
    clearNotices();
    try {
      await logout(token);
    } catch {
    storeToken(null);
    setUser(null);
    setPosts([]);
    setMessage("You have been logged out.");
  }

  async function submitCreatePost() {
    clearNotices();
    if (!newPostTitle.trim()) {
      setError("Post title is required");
      return;
    }

    try {
      const price = newPostPrice ? parseFloat(newPostPrice) : undefined;
      
      if (editingPostId) {
        await updatePost(editingPostId, {
          title: newPostTitle,
          description: newPostDescription || undefined,
          price,
          image_url: newPostImageUrl || undefined,
        } as any, token ?? undefined);
        setMessage("Post updated successfully");
      } else {
        await createPost(
          newPostTitle,
          newPostDescription || undefined,
          price,
          newPostImageUrl || undefined,
          undefined,
          token ?? undefined
        );
        setMessage("Post created successfully");
      }

      setNewPostTitle("");
      setNewPostDescription("");
      setNewPostPrice("");
      setNewPostImageUrl("");
      setEditingPostId(null);
      setShowCreateForm(false);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  }

  async function submitDeletePost(id: number) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    clearNotices();
    try {
      await deletePost(id, token ?? undefined);
      setMessage("Post deleted successfully");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  }

  async function submitFavoritePost(id: number, favorited: boolean) {
    clearNotices();
    try {
      if (favorited) {
        await removeFavorite(id, token!);
        setMessage("Post removed from favorites");
      } else {
        await addFavorite(id, token!);
        setMessage("Post added to favorites");
      }
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update favorite");
    }
  }

  useEffect(() => {
    loadSession().catch(err => {
      setError(err instanceof Error ? err.message : "Failed to load session");
      setSessionReady(true);
    });
  }, [token]);

  return {
    state: {
      sessionReady,
      isAuthenticated,
      user,
      message,
      error,
      loginMode,
      authName,
      authEmail,
      authPassword,
      posts,
      userPosts,
      favoritedPosts,
      favoriteSet,
      currentTab,
      showCreateForm,
      newPostTitle,
      newPostDescription,
      newPostPrice,
      newPostImageUrl,
      editingPostId,
    },
    actions: {
      setLoginMode,
      setAuthName,
      setAuthEmail,
      setAuthPassword,
      submitAuth,
      submitLogout,
      setCurrentTab,
      setShowCreateForm,
      setNewPostTitle,
      setNewPostDescription,
      setNewPostPrice,
      setNewPostImageUrl,
      setEditingPostId,
      submitCreatePost,
      submitDeletePost,
      submitFavoritePost,
    },
  };
}}
