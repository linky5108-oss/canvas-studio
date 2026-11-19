import { createFileRoute } from "@tanstack/react-router";
import Editor from "@/editor/Editor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lienzo — Editor de interfaces móvil" },
      { name: "description", content: "Diseña interfaces de apps desde tu móvil con un lienzo táctil estilo Apple." },
      { property: "og:title", content: "Lienzo — Editor de interfaces móvil" },
      { property: "og:description", content: "Diseña interfaces de apps desde tu móvil con un lienzo táctil estilo Apple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Editor,
});
