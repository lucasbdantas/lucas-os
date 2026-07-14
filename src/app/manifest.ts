import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucas OS",
    short_name: "Lucas OS",
    description: "Personal operations dashboard for Lucas",
    start_url: "/quick-capture",
    scope: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#2f6b58",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/lucas-os-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/lucas-os-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/share/target",
      enctype: "multipart/form-data",
      method: "POST",
      params: {
        text: "text",
        title: "title",
        url: "url",
      },
    },
  } as MetadataRoute.Manifest & {
    share_target: {
      action: string;
      enctype: "multipart/form-data";
      method: "POST";
      params: {
        text: string;
        title: string;
        url: string;
      };
    };
  };
}
