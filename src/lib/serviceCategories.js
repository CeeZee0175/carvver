import {
  Camera,
  Code2,
  GraduationCap,
  Mic2,
  Package,
  Palette,
  PenTool,
  Share2,
  ShoppingBag,
  Video,
} from "lucide-react";

export const SERVICE_CATEGORY_GROUPS = [
  {
    label: "Creative Services",
    items: [
      "Art & Illustration",
      "Graphic Design",
      "Video Editing",
      "Voice Over",
      "Social Media",
      "Photography",
      "Web Development",
    ],
  },
  {
    label: "Handmade & Custom Work",
    items: [
      "Handmade Products",
      "Plushies",
      "Custom Gifts",
      "Costumes & Props",
      "Crochet & Knitting",
      "Embroidery",
    ],
  },
  {
    label: "Learning & Support",
    items: [
      "Tutoring",
      "Language Help",
      "Writing",
      "Virtual Assistance",
      "Craft Lessons",
      "Event Styling",
    ],
  },
];

export const ALL_SERVICE_CATEGORIES = SERVICE_CATEGORY_GROUPS.flatMap(
  (group) => group.items
);

export const DASHBOARD_CATEGORY_HIGHLIGHTS = [
  "Art & Illustration",
  "Photography",
  "Video Editing",
  "Graphic Design",
  "Voice Over",
  "Social Media",
  "Tutoring",
  "Handmade Products",
];

const CATEGORY_ICON_MAP = {
  "Art & Illustration": Palette,
  Photography: Camera,
  "Video Editing": Video,
  "Graphic Design": PenTool,
  "Voice Over": Mic2,
  "Social Media": Share2,
  "Web Development": Code2,
  Tutoring: GraduationCap,
  "Handmade Products": ShoppingBag,
};

export function getCategoryIcon(category) {
  return CATEGORY_ICON_MAP[category] || Package;
}
