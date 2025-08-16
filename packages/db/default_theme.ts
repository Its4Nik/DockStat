import type { THEME } from "@dockstat/typings";

export const darkDockStatTheme: THEME.THEME_config = {
  name: "default",
  creator: "Its4Nik",
  version: "1.0.0",
  license: "MIT",
  vars: {
    background_effect: {
      Solid: {
        color: "",
      },
    },
    components: {
      Card: {
        accent: "#ffffff",
        border: true,
        border_size: 1,
        border_color: "#000000",
        title: {
          font: "Arial",
          color: "#ffffff",
          font_size: 11,
          font_weight: 400,
        },
        sub_title: {
          font: "Arial",
          color: "#ffffff",
          font_size: 11,
          font_weight: 400,
        },
        content: {
          font: "Arial",
          color: "#ffffff",
          font_size: 11,
          font_weight: 400,
        },
      },
    },
  },
};
