import Joi from "joi";

// Reusable ObjectId validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const createJobPostingSchema = Joi.object({
  // ─── TITLE ─────────────────────────────────────────────
  title: Joi.object({
    _id: objectId.optional().messages({
      "string.pattern.base": "Invalid job title ID format",
    }),
    name: Joi.string().trim().required().messages({
      "string.empty": "Job title is required",
    }),
  }).required(),

  // ─── COMPANY ───────────────────────────────────────────
  company: objectId.required().messages({
    "string.pattern.base": "Invalid company ID format",
    "string.empty": "Company is required",
  }),

  // ─── STATUS ────────────────────────────────────────────
  status: Joi.string()
    .valid("Active", "Closed", "Archived")
    .default("Active"),

  // ─── LOCATION ──────────────────────────────────────────
  location: Joi.object({
    _id: objectId.optional().messages({
      "string.pattern.base": "Invalid location ID format",
    }),
    name: Joi.string().trim().required().messages({
      "string.empty": "Location is required",
    }),
  }).required(),

  // ─── JOB TYPE ──────────────────────────────────────────
  jobType: Joi.string()
    .valid("Full-Time", "Part-Time", "Contract", "Internship")
    .required()
    .messages({
      "any.only":
        "Job type must be one of: Full-Time, Part-Time, Contract, Internship",
      "string.empty": "Job type is required",
    }),

  // ─── EXPERIENCE LEVEL ──────────────────────────────────
  experienceLevel: Joi.string()
    .valid("Intern", "Entry", "Mid-Level", "Senior")
    .optional()
    .messages({
      "any.only":
        "Experience level must be one of: Intern, Entry, Mid-Level, Senior",
    }),

  // ─── SALARY ────────────────────────────────────────────
  salary: Joi.object({
    currency: Joi.string()
      .valid("$", "₱", "€", "¥", "£")
      .default("$")
      .messages({
        "any.only": "Currency must be one of: $, ₱, €, ¥, £",
      }),

    min: Joi.number().min(0).allow(null).default(null).messages({
      "number.min": "Minimum salary must be a positive number",
    }),

    max: Joi.number().min(0).allow(null).default(null).messages({
      "number.min": "Maximum salary must be a positive number",
    }),

    frequency: Joi.string()
      .valid("hour", "day", "week", "month", "year")
      .default("year")
      .messages({
        "any.only":
          "Frequency must be one of: hour, day, week, month, year",
      }),
  })
    .custom((value, helpers) => {
      if (
        value?.min != null &&
        value?.max != null &&
        value.max < value.min
      ) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "Salary range validation")
    .messages({
      "any.invalid": "Maximum salary cannot be less than minimum salary",
    })
    .optional(),

  // ─── REQUIREMENTS ──────────────────────────────────────
  requirements: Joi.object({
    description: Joi.string().trim().required().messages({
      "string.empty": "Requirements description is required",
    }),

    education: Joi.string()
      .valid(
        "High School",
        "Associate",
        "Bachelor",
        "Master",
        "PhD",
        "None Required"
      )
      .optional()
      .messages({
        "any.only":
          "Education must be one of: High School, Associate, Bachelor, Master, PhD, None Required",
      }),

    yearsOfExperience: Joi.number().min(0).optional().messages({
      "number.min": "Years of experience must be a positive number",
    }),

    certifications: Joi.array()
      .items(Joi.string().trim())
      .optional()
      .messages({
        "array.base": "Certifications must be an array of strings",
      }),
  }).required(),

  // ─── SKILLS ────────────────────────────────────────────
  skills: Joi.array()
    .items(
      Joi.object({
        _id: objectId.optional().messages({
          "string.pattern.base": "Invalid skill ID format",
        }),

        name: Joi.string().trim().required().messages({
          "string.empty": "Skill name is required",
        }),

        requirementLevel: Joi.string()
          .valid("Required", "Preferred", "Nice-to-Have")
          .optional()
          .messages({
            "any.only":
              "Requirement level must be one of: Required, Preferred, Nice-to-Have",
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Must have at least one skill",
      "array.base": "Skills must be an array",
    }),

  // ─── PRE-SCREENING QUESTIONS ───────────────────────────
  preScreeningQuestions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().trim().required().messages({
          "string.empty": "Question text is required",
        }),

        required: Joi.boolean().default(false),
      })
    )
    .optional()
    .messages({
      "array.base": "Pre-screening questions must be an array",
    }),
});