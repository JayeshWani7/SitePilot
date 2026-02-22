export type FieldType = "text" | "textarea" | "number" | "list" | "json";

export type ModuleField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required?: boolean;
  defaultValue: string;
};

export type ModuleDefinition = {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  fields: ModuleField[];
};

export const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "onboarding",
    title: "Onboarding Wizard",
    description:
      "Generate a full starter site blueprint from tenant business context.",
    endpoint: "/api/ai/onboarding/generate-site",
    fields: [
      {
        id: "tenantName",
        label: "Tenant Name",
        type: "text",
        placeholder: "Bella's Bakery",
        required: true,
        defaultValue: "Bella's Bakery"
      },
      {
        id: "businessDescription",
        label: "Business Description",
        type: "textarea",
        placeholder: "Describe business in one paragraph",
        required: true,
        defaultValue:
          "Artisan bakery focused on sourdough breads, custom cakes, and catering for local events."
      },
      {
        id: "audience",
        label: "Audience",
        type: "text",
        placeholder: "Families, local offices",
        required: true,
        defaultValue: "Families, nearby offices, and event organizers"
      },
      {
        id: "goals",
        label: "Goals",
        type: "text",
        placeholder: "Increase online cake orders",
        required: true,
        defaultValue: "Increase online cake orders and catering leads"
      }
    ]
  },
  {
    id: "component-suggester",
    title: "Component Suggester",
    description:
      "Recommend high-impact page blocks based on current layout and objective.",
    endpoint: "/api/ai/component-suggester/recommend",
    fields: [
      {
        id: "pageType",
        label: "Page Type",
        type: "text",
        placeholder: "Pricing",
        required: true,
        defaultValue: "Pricing"
      },
      {
        id: "currentSections",
        label: "Current Sections (comma separated)",
        type: "list",
        placeholder: "Hero, Testimonials",
        required: true,
        defaultValue: "Hero, Pricing Cards, Testimonials"
      },
      {
        id: "objective",
        label: "Objective",
        type: "text",
        placeholder: "Improve trial conversions",
        required: true,
        defaultValue: "Increase free-trial conversion rate"
      }
    ]
  },
  {
    id: "brand-consistency",
    title: "Brand Consistency Guard",
    description:
      "Validate new text and colors against established brand guidelines.",
    endpoint: "/api/ai/brand-consistency/check",
    fields: [
      {
        id: "brandTone",
        label: "Brand Tone",
        type: "text",
        placeholder: "Warm and premium",
        required: true,
        defaultValue: "Warm, premium, neighborhood-friendly"
      },
      {
        id: "brandColors",
        label: "Brand Colors (comma separated)",
        type: "list",
        placeholder: "#D97706,#7C2D12",
        required: true,
        defaultValue: "#D97706, #7C2D12, #FEF3C7"
      },
      {
        id: "candidateText",
        label: "Candidate Text",
        type: "textarea",
        placeholder: "Paste content to evaluate",
        required: true,
        defaultValue:
          "Get your celebration cake crafted by local bakers with same-day pickup options."
      },
      {
        id: "candidateColors",
        label: "Candidate Colors (comma separated)",
        type: "list",
        placeholder: "#F59E0B,#1F2937",
        defaultValue: "#F59E0B, #1F2937"
      }
    ]
  },
  {
    id: "usage-coach",
    title: "Usage Coach",
    description:
      "Transform traffic patterns into prioritized optimizations and experiments.",
    endpoint: "/api/ai/usage-coach/recommend",
    fields: [
      {
        id: "mobileTrafficPercent",
        label: "Mobile Traffic %",
        type: "number",
        placeholder: "80",
        required: true,
        defaultValue: "80"
      },
      {
        id: "bounceRatePercent",
        label: "Bounce Rate %",
        type: "number",
        placeholder: "56",
        required: true,
        defaultValue: "56"
      },
      {
        id: "topPages",
        label: "Top Pages JSON",
        type: "json",
        placeholder: '[{"path":"/","views":1300}]',
        required: true,
        defaultValue:
          "[{\"path\":\"/\",\"views\":1320},{\"path\":\"/cakes\",\"views\":940},{\"path\":\"/contact\",\"views\":500}]"
      },
      {
        id: "conversionGoal",
        label: "Conversion Goal",
        type: "text",
        placeholder: "Increase catering inquiries",
        required: true,
        defaultValue: "Increase catering inquiry submissions"
      }
    ]
  },
  {
    id: "seo-copilot",
    title: "SEO Copilot",
    description:
      "Generate metadata, alt text, and JSON-LD from page context.",
    endpoint: "/api/ai/seo-copilot/generate",
    fields: [
      {
        id: "pageTitle",
        label: "Page Title",
        type: "text",
        placeholder: "Custom Wedding Cakes",
        required: true,
        defaultValue: "Custom Wedding Cakes in Austin"
      },
      {
        id: "pageSummary",
        label: "Page Summary",
        type: "textarea",
        placeholder: "Short summary",
        required: true,
        defaultValue:
          "Explore bespoke wedding cake designs with tasting sessions, seasonal flavors, and delivery options."
      },
      {
        id: "primaryKeyword",
        label: "Primary Keyword",
        type: "text",
        placeholder: "wedding cakes austin",
        required: true,
        defaultValue: "wedding cakes austin"
      },
      {
        id: "imageContext",
        label: "Image Context",
        type: "text",
        placeholder: "Three-tier floral cake",
        required: true,
        defaultValue: "Three-tier floral wedding cake on a rustic wooden table"
      }
    ]
  }
];
