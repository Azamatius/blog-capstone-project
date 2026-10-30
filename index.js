import { randomUUID } from "node:crypto";
import express from "express";

const app = express();
const port = process.env.PORT || 3001;
const posts = [];

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false, limit: "25kb" }));
app.use(express.static("public"));

app.locals.formatDate = (date) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);

function findPost(id) {
  return posts.find((post) => post.id === id);
}

function validatePost(title, content) {
  if (!title || !content) {
    return "Заполните заголовок и текст поста.";
  }
  if (title.length > 120) {
    return "Заголовок не должен быть длиннее 120 символов.";
  }
  if (content.length > 20000) {
    return "Текст поста не должен быть длиннее 20 000 символов.";
  }
  return null;
}

app.get("/", (req, res) => {
  res.render("index", {
    posts: [...posts].sort((a, b) => b.createdAt - a.createdAt),
  });
});

app.get("/posts/new", (req, res) => {
  res.render("compose", {
    pageTitle: "Новый пост",
    heading: "Новая запись",
    action: "/posts",
    post: { title: "", content: "" },
    error: null,
  });
});

app.post("/posts", (req, res) => {
  const title = req.body.title?.trim() ?? "";
  const content = req.body.content?.trim() ?? "";
  const error = validatePost(title, content);

  if (error) {
    return res.status(400).render("compose", {
      pageTitle: "Новый пост",
      heading: "Новая запись",
      action: "/posts",
      post: { title, content },
      error,
    });
  }

  posts.push({
    id: randomUUID(),
    title,
    content,
    createdAt: new Date(),
    updatedAt: null,
  });
  res.redirect("/");
});

app.get("/posts/:id/edit", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) {
    return res.status(404).render("not-found");
  }

  res.render("compose", {
    pageTitle: "Редактировать пост",
    heading: "Редактировать запись",
    action: `/posts/${post.id}`,
    post,
    error: null,
  });
});

app.post("/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) {
    return res.status(404).render("not-found");
  }

  const title = req.body.title?.trim() ?? "";
  const content = req.body.content?.trim() ?? "";
  const error = validatePost(title, content);

  if (error) {
    return res.status(400).render("compose", {
      pageTitle: "Редактировать пост",
      heading: "Редактировать запись",
      action: `/posts/${post.id}`,
      post: { ...post, title, content },
      error,
    });
  }

  post.title = title;
  post.content = content;
  post.updatedAt = new Date();
  res.redirect(`/posts/${post.id}`);
});

app.post("/posts/:id/delete", (req, res) => {
  const postIndex = posts.findIndex((post) => post.id === req.params.id);
  if (postIndex === -1) {
    return res.status(404).render("not-found");
  }

  posts.splice(postIndex, 1);
  res.redirect("/");
});

app.get("/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) {
    return res.status(404).render("not-found");
  }

  res.render("show", { post });
});

app.use((req, res) => {
  res.status(404).render("not-found");
});

app.listen(port, () => {
  console.log(`Blog is running at http://localhost:${port}`);
});
