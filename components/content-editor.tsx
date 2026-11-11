"use client";
import { useState } from "react";
export function ContentEditor() {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/admin/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: f.get("slug"),
              title: f.get("title"),
              body: f.get("body"),
              author: f.get("author"),
              publish: f.get("publish") === "on",
            }),
          });
          const d = await r.json();
          setMsg(r.ok ? "Content saved" : d.error);
        } catch {
          setMsg("Could not save content");
        }
      }}
    >
      {[
        ["slug", "Page slug"],
        ["title", "Title"],
        ["author", "Author or editorial owner"],
      ].map(([n, t]) => (
        <label className="block" key={n}>
          {t}
          <input
            name={n}
            required
            className="block border rounded p-3 w-full"
          />
        </label>
      ))}
      <label className="block">
        Guide text (paragraphs, at least 400 characters)
        <textarea
          name="body"
          rows={14}
          required
          minLength={400}
          maxLength={30000}
          className="block w-full border rounded p-3"
        />
      </label>
      <label className="flex gap-3">
        <input name="publish" type="checkbox" />I have reviewed the facts, have
        permission to use the content, and want to publish it.
      </label>
      <p>
        Do not invent prices, distances, testimonials or market rankings.
        Content is rendered as text, not executable markup.
      </p>
      <button className="border rounded p-3">Save guide</button>
      <p role="status">{msg}</p>
    </form>
  );
}
